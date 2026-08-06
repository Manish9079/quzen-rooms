import { prisma } from '../config/prisma.js';

/**
 * Tracks coarse online/offline status (separate from per-room presence in
 * chat.handler.js). A user counts as "online" while they have at least one
 * open socket, so multiple tabs don't flicker their status.
 */
const openSocketsByUser = new Map(); // userId -> count

export function registerPresenceHandlers(io, socket) {
  const count = (openSocketsByUser.get(socket.user.id) || 0) + 1;
  openSocketsByUser.set(socket.user.id, count);

  if (count === 1) {
    prisma.user.update({ where: { id: socket.user.id }, data: { onlineStatus: true } }).catch(() => {});
    socket.broadcast.emit('presence:online', { userId: socket.user.id });
  }

  socket.on('disconnect', () => {
    const remaining = (openSocketsByUser.get(socket.user.id) || 1) - 1;
    if (remaining <= 0) {
      openSocketsByUser.delete(socket.user.id);
      prisma.user.update({ where: { id: socket.user.id }, data: { onlineStatus: false } }).catch(() => {});
      socket.broadcast.emit('presence:offline', { userId: socket.user.id });
    } else {
      openSocketsByUser.set(socket.user.id, remaining);
    }
  });
}
