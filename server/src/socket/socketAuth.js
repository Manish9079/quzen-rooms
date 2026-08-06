import cookie from 'cookie';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

/**
 * Authenticates a Socket.IO connection before allowing any event handlers
 * to run. Accepts the access token either explicitly (socket.handshake.auth.token
 * — what the frontend's socketService.js sends) or from the accessToken
 * cookie, so a plain browser tab reconnect also works.
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const fromAuth = socket.handshake.auth?.token;
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = fromAuth || cookies.accessToken;

    if (!token) return next(new Error('UNAUTHORIZED'));

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, displayName: true, avatar: true },
    });
    if (!user) return next(new Error('UNAUTHORIZED'));

    socket.user = user;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}
