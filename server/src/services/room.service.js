import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { generateRoomCode, normalizeRoomCode } from '../utils/roomCode.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { publicUserSelect } from './auth.service.js';

const hostPreview = { select: { id: true, username: true, displayName: true, avatar: true } };

async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const exists = await prisma.room.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw ApiError.internal('Could not generate a unique room code. Please try again.');
}

function activeParticipantCount(room) {
  return room._count?.participants ?? 0;
}

function serializeRoom(room, { includeParticipants = false } = {}) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    description: room.description,
    category: room.category,
    isPrivate: room.isPrivate,
    hasPassword: Boolean(room.passwordHash),
    maxParticipants: room.maxParticipants,
    chatEnabled: room.chatEnabled,
    videoEnabled: room.videoEnabled,
    screenShareEnabled: room.screenShareEnabled,
    isLocked: room.isLocked,
    host: room.host,
    participantCount: activeParticipantCount(room),
    createdAt: room.createdAt,
    ...(includeParticipants && room.participants
      ? { participants: room.participants.map(serializeParticipant) }
      : {}),
  };
}

function serializeParticipant(p) {
  return {
    id: p.id,
    role: p.role,
    joinedAt: p.joinedAt,
    user: p.user,
  };
}

export async function createRoom(hostId, input) {
  const code = await generateUniqueRoomCode();
  const passwordHash = input.isPrivate && input.password ? await hashPassword(input.password) : null;

  const room = await prisma.room.create({
    data: {
      code,
      name: input.name,
      description: input.description,
      category: input.category,
      isPrivate: input.isPrivate,
      passwordHash,
      maxParticipants: input.maxParticipants,
      chatEnabled: input.chatEnabled,
      videoEnabled: input.videoEnabled,
      screenShareEnabled: input.screenShareEnabled,
      hostId,
    },
  });

  // Explicit second write (rather than a Prisma nested `participants: { create }`)
  // so the host's membership row always exists before anyone can query it.
  await prisma.roomParticipant.create({ data: { roomId: room.id, userId: hostId, role: 'HOST' } });

  const fresh = await prisma.room.findUnique({
    where: { id: room.id },
    include: { host: hostPreview, _count: { select: { participants: { where: { leftAt: null } } } } },
  });

  return serializeRoom(fresh);
}

export async function listPublicRooms({ category, search, page, limit }) {
  const where = {
    isPrivate: false,
    closedAt: null,
    ...(category && category !== 'ALL' ? { category } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: { host: hostPreview, _count: { select: { participants: { where: { leftAt: null } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.room.count({ where }),
  ]);

  return {
    rooms: rooms.map((r) => serializeRoom(r)),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getRoomByCode(code, { includeParticipants = false } = {}) {
  const room = await prisma.room.findUnique({
    where: { code: normalizeRoomCode(code) },
    include: {
      host: hostPreview,
      _count: { select: { participants: { where: { leftAt: null } } } },
      ...(includeParticipants
        ? { participants: { where: { leftAt: null }, include: { user: { select: publicUserSelect } } } }
        : {}),
    },
  });
  if (!room || room.closedAt) throw ApiError.notFound('Room not found.');
  return serializeRoom(room, { includeParticipants });
}

export async function joinRoomByCode(code, userId, password, { bypassLock = false } = {}) {
  const room = await prisma.room.findUnique({
    where: { code: normalizeRoomCode(code) },
    include: { _count: { select: { participants: { where: { leftAt: null } } } } },
  });
  if (!room || room.closedAt) throw ApiError.notFound('Room not found.');
  if (room.isLocked && !bypassLock) throw ApiError.forbidden('This room is locked and not accepting new participants.');

  const existing = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  });

  if (!existing || existing.leftAt) {
    if (activeParticipantCount(room) >= room.maxParticipants) {
      throw ApiError.conflict('This room is full.');
    }
    if (room.passwordHash) {
      const valid = password && (await comparePassword(password, room.passwordHash));
      if (!valid) throw ApiError.unauthorized('That room password is incorrect.');
    }
  }

  const participant = existing
    ? await prisma.roomParticipant.update({
        where: { id: existing.id },
        data: { leftAt: null },
        include: { user: { select: publicUserSelect } },
      })
    : await prisma.roomParticipant.create({
        data: { roomId: room.id, userId, role: 'MEMBER' },
        include: { user: { select: publicUserSelect } },
      });

  const fresh = await getRoomByCode(code);
  return { room: fresh, participant: serializeParticipant(participant) };
}

export async function leaveRoom(roomId, userId) {
  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!participant || participant.leftAt) return;

  await prisma.roomParticipant.update({ where: { id: participant.id }, data: { leftAt: new Date() } });

  // If the host leaves, hand the room to the longest-standing co-host (or
  // close it if nobody else is left) so it never ends up ownerless.
  if (participant.role === 'HOST') {
    const successor = await prisma.roomParticipant.findFirst({
      where: { roomId, leftAt: null, userId: { not: userId } },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }], // CO_HOST < MEMBER alphabetically-ish; good enough tiebreak
    });
    if (successor) {
      await prisma.roomParticipant.update({ where: { id: successor.id }, data: { role: 'HOST' } });
      await prisma.room.update({ where: { id: roomId }, data: { hostId: successor.userId } });
    } else {
      await prisma.room.update({ where: { id: roomId }, data: { closedAt: new Date() } });
    }
  }
}

export async function deleteRoom(roomId) {
  await prisma.room.delete({ where: { id: roomId } }); // cascades to participants + messages
}

export async function updateRoom(room, patch) {
  const data = { ...patch };
  if ('password' in patch) {
    data.passwordHash = patch.password ? await hashPassword(patch.password) : null;
    delete data.password;
  }
  const updated = await prisma.room.update({
    where: { id: room.id },
    data,
    include: { host: hostPreview, _count: { select: { participants: { where: { leftAt: null } } } } },
  });
  return serializeRoom(updated);
}

export async function listParticipants(roomId) {
  const participants = await prisma.roomParticipant.findMany({
    where: { roomId, leftAt: null },
    include: { user: { select: publicUserSelect } },
    orderBy: { joinedAt: 'asc' },
  });
  return participants.map(serializeParticipant);
}

export async function setParticipantRole(roomId, targetUserId, role) {
  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
  if (!participant || participant.leftAt) throw ApiError.notFound('That participant is not in the room.');
  if (participant.role === 'HOST') throw ApiError.forbidden("You can't change the host's role.");

  return prisma.roomParticipant.update({
    where: { id: participant.id },
    data: { role },
    include: { user: { select: publicUserSelect } },
  }).then(serializeParticipant);
}

export async function removeParticipant(roomId, targetUserId) {
  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
  if (!participant || participant.leftAt) throw ApiError.notFound('That participant is not in the room.');
  if (participant.role === 'HOST') throw ApiError.forbidden("You can't remove the host.");

  await prisma.roomParticipant.update({ where: { id: participant.id }, data: { leftAt: new Date() } });
}

export { serializeRoom, serializeParticipant };
