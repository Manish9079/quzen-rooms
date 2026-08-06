import * as roomService from '../services/room.service.js';
import * as messageService from '../services/message.service.js';
import { presenceStore } from '../services/presence.store.js';
import { prisma } from '../config/prisma.js';

/**
 * Actually joins the socket to a room's channel + persists membership,
 * and tells everyone else in the room. Shared by room:join and by
 * host:approveWaiting (once a waiting user is let in).
 */
async function completeJoin(io, socket, code, password, { bypassLock = false } = {}) {
  const { room, participant } = await roomService.joinRoomByCode(code, socket.user.id, password, { bypassLock });

  socket.data.roomId = room.id;
  socket.data.roomCode = room.code;
  socket.join(room.id);
  presenceStore.addToRoom(room.id, socket.id, { userId: socket.user.id, username: socket.user.username });

  const [messages, participants] = await Promise.all([
    messageService.getRecentMessages(room.id, { limit: 50 }),
    roomService.listParticipants(room.id),
  ]);

  socket.emit('room:joined', { room, messages, participants, you: participant });
  socket.to(room.id).emit('presence:userJoined', { participant });
  io.to(room.id).emit('presence:participantCount', { count: presenceStore.roomSize(room.id) });

  return room;
}

export function registerChatHandlers(io, socket) {
  socket.on('room:join', async ({ code, password } = {}, ack) => {
    try {
      const roomRecord = await prisma.room.findUnique({ where: { code: (code || '').toUpperCase() } });
      if (!roomRecord) return ack?.({ ok: false, message: 'Room not found.' });

      const alreadyIn = await prisma.roomParticipant.findFirst({
        where: { roomId: roomRecord.id, userId: socket.user.id, leftAt: null },
      });

      // Locked rooms hold new (non-member, non-host) joiners in a waiting
      // room instead of admitting them immediately — the host approves or
      // rejects them via host:approveWaiting / host:rejectWaiting.
      if (roomRecord.isLocked && !alreadyIn) {
        presenceStore.addToWaitingRoom(roomRecord.id, socket.user.id, {
          username: socket.user.username,
          displayName: socket.user.displayName,
          socketId: socket.id,
        });
        socket.data.waitingRoomId = roomRecord.id;
        socket.emit('room:waiting', { code: roomRecord.code });
        io.to(roomRecord.id).emit('host:waitingRoomUpdate', {
          waiting: presenceStore.listWaitingRoom(roomRecord.id),
        });
        return ack?.({ ok: true, waiting: true });
      }

      await completeJoin(io, socket, code, password);
      ack?.({ ok: true, waiting: false });
    } catch (err) {
      ack?.({ ok: false, message: err.message || 'Could not join the room.' });
    }
  });

  socket.on('room:leave', async (_payload, ack) => {
    try {
      await leaveCurrentRoom(io, socket);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('chat:send', async ({ body } = {}, ack) => {
    try {
      if (!socket.data.roomId) throw new Error('You are not in a room.');
      if (!body?.trim()) throw new Error('Message cannot be empty.');
      const message = await messageService.createMessage(socket.data.roomId, socket.user.id, body.trim());
      io.to(socket.data.roomId).emit('chat:message', message);
      ack?.({ ok: true, message });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('chat:typing', ({ isTyping } = {}) => {
    if (!socket.data.roomId) return;
    socket.to(socket.data.roomId).emit('chat:typing', {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on('chat:deleteMessage', async ({ messageId } = {}, ack) => {
    try {
      if (!socket.data.roomId) throw new Error('You are not in a room.');
      const message = await messageService.deleteOwnMessage(messageId, socket.user.id);
      io.to(socket.data.roomId).emit('chat:messageDeleted', { id: message.id });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('disconnect', () => {
    leaveCurrentRoom(io, socket).catch(() => {});
    if (socket.data.waitingRoomId) {
      presenceStore.removeFromWaitingRoom(socket.data.waitingRoomId, socket.user.id);
    }
  });
}

async function leaveCurrentRoom(io, socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  presenceStore.removeSocket(socket.id);
  socket.leave(roomId);

  await roomService.leaveRoom(roomId, socket.user.id);

  socket.to(roomId).emit('presence:userLeft', { userId: socket.user.id, username: socket.user.username });
  io.to(roomId).emit('presence:participantCount', { count: presenceStore.roomSize(roomId) });

  socket.data.roomId = null;
  socket.data.roomCode = null;
}

export { completeJoin, leaveCurrentRoom };
