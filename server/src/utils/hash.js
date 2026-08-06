import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const SALT_ROUNDS = 12;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Refresh tokens are random opaque strings, never JWTs. We hand the raw
 * token to the client (as an httpOnly cookie) and store only its SHA-256
 * hash, so a leaked database never reveals usable tokens.
 */
export function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
