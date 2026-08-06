import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { socketAuthMiddleware } from './socketAuth.js';
import { registerChatHandlers } from './chat.handler.js';
import { registerWebrtcHandlers } from './webrtc.handler.js';
import { registerHostHandlers } from './host.handler.js';
import { registerPresenceHandlers } from './presence.handler.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerWebrtcHandlers(io, socket);
    registerHostHandlers(io, socket);
  });

  return io;
}
