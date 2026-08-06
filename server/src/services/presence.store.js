/**
 * Ephemeral realtime state: who's connected per room, and pending waiting-
 * room requests for locked/approval-gated rooms. This intentionally lives
 * in memory (not Postgres) because it's session state, not durable data —
 * exactly the kind of thing to move into Redis once you run more than one
 * server process. The interface below (get/set/delete per room) is written
 * so swapping the Map for an `ioredis` client later only touches this file.
 */

const roomSockets = new Map(); // roomId -> Set<socketId>
const socketMeta = new Map(); // socketId -> { roomId, userId, username }
const waitingRooms = new Map(); // roomId -> Map<userId, { username, displayName, socketId }>

export const presenceStore = {
  addToRoom(roomId, socketId, meta) {
    if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
    roomSockets.get(roomId).add(socketId);
    socketMeta.set(socketId, { roomId, ...meta });
  },

  removeSocket(socketId) {
    const meta = socketMeta.get(socketId);
    if (!meta) return null;
    roomSockets.get(meta.roomId)?.delete(socketId);
    socketMeta.delete(socketId);
    return meta;
  },

  getMeta(socketId) {
    return socketMeta.get(socketId) || null;
  },

  roomSize(roomId) {
    return roomSockets.get(roomId)?.size || 0;
  },

  socketsInRoom(roomId) {
    return [...(roomSockets.get(roomId) || [])];
  },

  addToWaitingRoom(roomId, userId, info) {
    if (!waitingRooms.has(roomId)) waitingRooms.set(roomId, new Map());
    waitingRooms.get(roomId).set(userId, info);
  },

  removeFromWaitingRoom(roomId, userId) {
    waitingRooms.get(roomId)?.delete(userId);
  },

  listWaitingRoom(roomId) {
    return [...(waitingRooms.get(roomId) || new Map()).entries()].map(([userId, info]) => ({ userId, ...info }));
  },
};
