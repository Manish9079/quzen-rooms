import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret); // throws on invalid/expired
}
