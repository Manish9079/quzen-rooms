import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../config/prisma.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

/** Requires a valid access token; attaches req.user = { id, username }. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('You must be logged in to do that.');

  const payload = verifyAccessToken(token); // throws -> caught by error middleware
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, displayName: true, email: true, avatar: true },
  });
  if (!user) throw ApiError.unauthorized('Account no longer exists.');

  req.user = user;
  next();
});

/** Attaches req.user if a valid token is present; never throws. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, displayName: true, email: true, avatar: true },
    });
    if (user) req.user = user;
  } catch {
    /* ignore invalid/expired token for optional auth */
  }
  next();
});
