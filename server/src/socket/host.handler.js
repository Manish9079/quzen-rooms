import { prisma } from '../config/prisma.js';
import { presenceStore } from '../services/presence.store.js';
import * as roomService from '../services/room.service.js';
import { completeJoin } from './chat.handler.js';

async function requireRole(socket, roles) {
  if (!socket.data.roomId) throw new Error('You are not in a room.');
  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId: socket.data.roomId, userId: socket.user.id, leftAt: null },
  });
  if (!participant || !roles.includes(participant.role)) {
    throw new Error('You do not have permission to do that.');
  }
  return participant;
}

export function registerHostHandlers(io, socket) {
  socket.on('host:removeParticipant', async ({ userId } = {}, ack) => {
    try {
      await requireRole(socket, ['HOST', 'CO_HOST']);
      await roomService.removeParticipant(socket.data.roomId, userId);

      for (const sid of presenceStore.socketsInRoom(socket.data.roomId)) {
        const meta = presenceStore.getMeta(sid);
        if (meta?.userId === userId) {
          io.to(sid).emit('host:removedYou');
          io.sockets.sockets.get(sid)?.leave(socket.data.roomId);
          presenceStore.removeSocket(sid);
        }
      }
      io.to(socket.data.roomId).emit('presence:userLeft', { userId, reason: 'removed' });
      io.to(socket.data.roomId).emit('presence:participantCount', { count: presenceStore.roomSize(socket.data.roomId) });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:setCoHost', async ({ userId } = {}, ack) => {
    try {
      await requireRole(socket, ['HOST']);
      const participant = await roomService.setParticipantRole(socket.data.roomId, userId, 'CO_HOST');
      io.to(socket.data.roomId).emit('host:roleChanged', { participant });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:removeCoHost', async ({ userId } = {}, ack) => {
    try {
      await requireRole(socket, ['HOST']);
      const participant = await roomService.setParticipantRole(socket.data.roomId, userId, 'MEMBER');
      io.to(socket.data.roomId).emit('host:roleChanged', { participant });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:lockRoom', async (_payload, ack) => {
    try {
      const participant = await requireRole(socket, ['HOST', 'CO_HOST']);
      const room = await prisma.room.update({ where: { id: socket.data.roomId }, data: { isLocked: true } });
      io.to(socket.data.roomId).emit('host:roomLocked', { isLocked: room.isLocked, by: participant.userId });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:unlockRoom', async (_payload, ack) => {
    try {
      await requireRole(socket, ['HOST', 'CO_HOST']);
      const room = await prisma.room.update({ where: { id: socket.data.roomId }, data: { isLocked: false } });
      io.to(socket.data.roomId).emit('host:roomLocked', { isLocked: room.isLocked });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:approveWaiting', async ({ userId } = {}, ack) => {
    try {
      await requireRole(socket, ['HOST', 'CO_HOST']);
      const waiting = presenceStore.listWaitingRoom(socket.data.roomId).find((w) => w.userId === userId);
      if (!waiting) throw new Error('That user is no longer waiting.');

      const waitingSocket = io.sockets.sockets.get(waiting.socketId);
      presenceStore.removeFromWaitingRoom(socket.data.roomId, userId);
      if (waitingSocket) {
        waitingSocket.data.waitingRoomId = null;
        await completeJoin(io, waitingSocket, socket.data.roomCode, undefined, { bypassLock: true });
      }
      io.to(socket.data.roomId).emit('host:waitingRoomUpdate', { waiting: presenceStore.listWaitingRoom(socket.data.roomId) });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('host:rejectWaiting', async ({ userId } = {}, ack) => {
    try {
      await requireRole(socket, ['HOST', 'CO_HOST']);
      const waiting = presenceStore.listWaitingRoom(socket.data.roomId).find((w) => w.userId === userId);
      presenceStore.removeFromWaitingRoom(socket.data.roomId, userId);
      const waitingSocket = waiting && io.sockets.sockets.get(waiting.socketId);
      waitingSocket?.emit('room:joinRejected', { reason: 'The host declined your request to join.' });
      io.to(socket.data.roomId).emit('host:waitingRoomUpdate', { waiting: presenceStore.listWaitingRoom(socket.data.roomId) });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });
}
