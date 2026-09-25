import cookie from 'cookie';
import { db as prisma } from '../config/dynamo.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function socketAuthMiddleware(socket, next) {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = socket.handshake.auth?.token || cookies.accessToken;
    if (!token) throw new Error('UNAUTHORIZED');
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, displayName: true, email: true, avatar: true },
    });
    if (!user) throw new Error('UNAUTHORIZED');
    socket.user = user;
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}