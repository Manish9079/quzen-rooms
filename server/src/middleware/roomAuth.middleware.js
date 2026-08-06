import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeRoomCode } from '../utils/roomCode.js';

/**
 * Loads the room from :code and attaches req.room. Use before any
 * room-scoped route so downstream handlers don't repeat the lookup.
 */
export const loadRoom = asyncHandler(async (req, res, next) => {
  const code = normalizeRoomCode(req.params.code);
  const room = await prisma.room.findUnique({ where: { code } });
  if (!room || room.closedAt) throw ApiError.notFound('Room not found.');
  req.room = room;
  next();
});

/**
 * Requires req.user to currently be an active HOST or CO_HOST of req.room.
 * Must run after requireAuth + loadRoom.
 */
export const requireHostOrCoHost = asyncHandler(async (req, res, next) => {
  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId: req.room.id, userId: req.user.id, leftAt: null },
  });
  if (!participant || (participant.role !== 'HOST' && participant.role !== 'CO_HOST')) {
    throw ApiError.forbidden('Only the host or a co-host can do that.');
  }
  req.participant = participant;
  next();
});

/** Requires req.user to currently be the room's HOST specifically. */
export const requireHost = asyncHandler(async (req, res, next) => {
  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId: req.room.id, userId: req.user.id, leftAt: null },
  });
  if (!participant || participant.role !== 'HOST') {
    throw ApiError.forbidden('Only the host can do that.');
  }
  req.participant = participant;
  next();
});
