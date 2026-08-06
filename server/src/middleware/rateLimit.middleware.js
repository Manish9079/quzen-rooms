import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.generalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
