import { presenceStore } from '../services/presence.store.js';
import { db as prisma } from '../config/dynamo.js';
import * as roomService from '../services/room.service.js';
import * as messageService from '../services/message.service.js';

export function registerChatHandlers(io, socket) {
  socket.on(
    'room:join',
    async ({ code } = {}, ack) => {
      try {
        const roomCode = (code || '').trim().toUpperCase();

        if (!roomCode) {
          return ack?.({
            ok: false,
            message: 'Room code is required.',
          });
        }

        const room = await roomService.joinRoomByCode(roomCode, socket.user.id);
        const roomRecord = await prisma.room.findUnique({ where: { code: roomCode } });
        socket.data.roomId = roomRecord.id;
        socket.data.roomCode = roomCode;

        socket.join(roomCode);

        presenceStore.addToRoom(roomCode, socket.id, {
          userId: socket.user.id,
          username: socket.user.username,
          displayName: socket.user.displayName,
        });

        const participant = room.participant;
        socket.to(roomCode).emit('presence:userJoined', { participant });
        io.to(roomCode).emit('presence:participantCount', { count: presenceStore.roomSize(roomCode) });
        ack?.({ ok: true, participant });
      } catch (err) {
        ack?.({
          ok: false,
          message:
            err.message || 'Could not connect to room media.',
        });
      }
    }
  );

  socket.on('room:leave', (_payload, ack) => {
    leaveCurrentRoom(socket);
    ack?.({ ok: true });
  });

  socket.on('disconnect', () => {
    leaveCurrentRoom(socket);
  });

  socket.on('chat:send', async ({ body } = {}, ack) => {
    try {
      if (!socket.data.roomId) throw new Error('You are not in a room.');
      const text = String(body || '').trim();
      if (!text) throw new Error('Message cannot be empty.');
      const message = await messageService.createMessage(socket.data.roomId, socket.user.id, text);
      io.to(socket.data.roomCode).emit('chat:message', message);
      ack?.({ ok: true, message });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });

  socket.on('chat:typing', ({ isTyping } = {}) => {
    if (!socket.data.roomCode) return;
    socket.to(socket.data.roomCode).emit('chat:typing', {
      userId: socket.user.id,
      username: socket.user.username,
      displayName: socket.user.displayName,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on('chat:deleteMessage', async ({ messageId } = {}, ack) => {
    try {
      const message = await messageService.deleteOwnMessage(messageId, socket.user.id);
      io.to(socket.data.roomCode).emit('chat:messageDeleted', message);
      ack?.({ ok: true, message });
    } catch (err) {
      ack?.({ ok: false, message: err.message });
    }
  });
}

export async function completeJoin(io, socket, code, password, options = {}) {
  const roomCode = (code || '').trim().toUpperCase();
  const result = await roomService.joinRoomByCode(roomCode, socket.user.id, password, options);
  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  socket.data.roomId = room.id;
  socket.data.roomCode = roomCode;
  socket.join(roomCode);
  presenceStore.addToRoom(roomCode, socket.id, {
    userId: socket.user.id,
    username: socket.user.username,
    displayName: socket.user.displayName,
  });
  io.to(roomCode).emit('presence:userJoined', { participant: result.participant });
  io.to(roomCode).emit('presence:participantCount', { count: presenceStore.roomSize(roomCode) });
  socket.emit('room:joined', { participant: result.participant });
  return result;
}

function leaveCurrentRoom(socket) {
  const roomId = socket.data.roomId;

  if (!roomId) return;

  const meta = presenceStore.removeSocket(socket.id);
  socket.leave(socket.data.roomCode);
  if (meta) {
    socket.to(meta.roomId).emit('presence:userLeft', { userId: meta.userId });
    socket.to(meta.roomId).emit('presence:participantCount', { count: presenceStore.roomSize(meta.roomId) });
  }

  socket.data.roomId = null;
  socket.data.roomCode = null;
}