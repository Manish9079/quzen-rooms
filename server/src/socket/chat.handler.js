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
  socket.on('room:join', async ({ code, userId, username, displayName } = {}, ack) => {
  try {
    const roomCode = (code || '').trim().toUpperCase();

    if (!roomCode) {
      return ack?.({ ok: false, message: 'Room code is required.' });
    }

    socket.user = {
      id: userId || socket.id,
      username: username || 'user',
      displayName: displayName || username || 'User',
    };

    socket.data.roomId = roomCode;
    socket.data.roomCode = roomCode;

    socket.join(roomCode);

    presenceStore.addToRoom(roomCode, socket.id, {
      userId: socket.user.id,
      username: socket.user.username,
    });

    ack?.({ ok: true });
  } catch (err) {
    ack?.({
      ok: false,
      message: err.message || 'Could not connect to room media.',
    });
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
