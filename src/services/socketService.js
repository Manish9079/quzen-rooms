import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Thin singleton wrapper around one shared socket.io-client connection.
 * Auth rides on the same httpOnly cookies as REST calls (withCredentials),
 * matching the backend's socketAuthMiddleware.
 */
class SocketService {
  socket = null;

  connect() {
  if (this.socket) return this.socket;

  this.socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['polling', 'websocket'],
  });

  this.socket.on('connect', () => {
    console.log('Socket connected:', this.socket.id);
  });

  this.socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
  });

  return this.socket;
}

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected() {
    return Boolean(this.socket?.connected);
  }

  on(event, handler) {
    this.socket?.on(event, handler);
    return () => this.socket?.off(event, handler);
  }

  off(event, handler) {
    this.socket?.off(event, handler);
  }

  /** Emits with an ack callback, resolved as a promise: { ok, message?, ... }. */
  emitAck(event, payload) {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ ok: false, message: 'Not connected.' });
      this.socket.emit(event, payload, (response) => resolve(response ?? { ok: true }));
    });
  }

  /** Fire-and-forget emit for high-frequency events (typing, media state). */
  emit(event, payload) {
    this.socket?.emit(event, payload);
  }
}

export const socketService = new SocketService();
