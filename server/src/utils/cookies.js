import { env } from '../config/env.js';

const baseOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? 'none' : 'lax',
  path: '/',
};

export function accessTokenCookieOptions() {
  return { ...baseOptions, maxAge: 15 * 60 * 1000 }; // 15 min, mirrors JWT_ACCESS_EXPIRES_IN default
}

export function refreshTokenCookieOptions() {
  return { ...baseOptions, maxAge: env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, path: '/api/auth' };
}

export function clearCookieOptions() {
  return { ...baseOptions };
}
