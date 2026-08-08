import { presenceStore } from '../services/presence.store.js';

export function registerChatHandlers(io, socket) {
  socket.on(
    'room:join',
    async ({ code, userId, username, displayName } = {}, ack) => {
      try {
        const roomCode = (code || '').trim().toUpperCase();

        if (!roomCode) {
          return ack?.({
            ok: false,
            message: 'Room code is required.',
          });
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
}

function leaveCurrentRoom(socket) {
  const roomId = socket.data.roomId;

  if (!roomId) return;

  presenceStore.removeSocket(socket.id);
  socket.leave(roomId);

  socket.data.roomId = null;
  socket.data.roomCode = null;
}