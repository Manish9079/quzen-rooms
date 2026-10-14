import { Server } from 'socket.io';
import { allowedOrigins } from '../config/cors.js';
import { socketAuthMiddleware } from './socketAuth.js';
import { registerChatHandlers } from './chat.handler.js';
import { registerWebrtcHandlers } from './webrtc.handler.js';
import { registerHostHandlers } from './host.handler.js';
import { registerPresenceHandlers } from './presence.handler.js';


export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    registerChatHandlers(io, socket);
    registerWebrtcHandlers(io, socket);
    registerHostHandlers(io, socket);
    registerPresenceHandlers(io, socket);
  });

  return io;
}
