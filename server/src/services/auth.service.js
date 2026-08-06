import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword, generateOpaqueToken, hashToken } from '../utils/hash.js';
import { signAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const publicUserSelect = {
  id: true, username: true, displayName: true, email: true,
  avatar: true, bio: true, onlineStatus: true, createdAt: true,
};

export async function registerUser({ username, displayName, email, password }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    if (existing.email === email) throw ApiError.conflict('An account with that email already exists.');
    throw ApiError.conflict('That username is already taken.');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, displayName, email, passwordHash, onlineStatus: true },
    select: publicUserSelect,
  });

  return issueSession(user);
}

export async function loginUser({ identifier, password }) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }] },
  });
  if (!user) throw ApiError.unauthorized('Invalid email/username or password.');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email/username or password.');

  await prisma.user.update({ where: { id: user.id }, data: { onlineStatus: true } });

  const { passwordHash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  return issueSession(publicUser);
}

/** Creates an access token + a freshly stored refresh token for a user. */
export async function issueSession(user, userAgent) {
  const accessToken = signAccessToken(user);

  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt, userAgent },
  });

  return { user, accessToken, refreshToken };
}

/** Rotates a refresh token: the old one is revoked, a new pair is issued. */
export async function rotateRefreshToken(refreshToken, userAgent) {
  if (!refreshToken) throw ApiError.unauthorized('Not authenticated.');
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: publicUserSelect } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(stored.user, userAgent);
}

export async function logoutUser(refreshToken, userId) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { onlineStatus: false } });
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Your current password is incorrect.');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Revoke every existing session so a stolen refresh token stops working.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Forgot/reset password: V1 issues a short-lived reset token and logs it
 * instead of emailing it (there's no transactional email provider wired
 * up yet). Swap the console.info for a real mailer call — everything else
 * (token generation, hashing, expiry, single-use enforcement) is real.
 */
export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always resolve the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  if (!user) return;

  const resetToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.refreshToken.create({
    data: {
      tokenHash: `reset:${hashToken(resetToken)}`,
      userId: user.id,
      expiresAt,
    },
  });

  // eslint-disable-next-line no-console
  console.info(`[auth] Password reset requested for ${email}. Reset token (send via email in production): ${resetToken}`);
}

export async function resetPassword(token, newPassword) {
  const tokenHash = `reset:${hashToken(token)}`;
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('This reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export { publicUserSelect };
