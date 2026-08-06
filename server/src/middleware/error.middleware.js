import { env } from '../config/env.js';
import { fail } from '../utils/ApiResponse.js';

export function notFoundHandler(req, res) {
  fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err?.isApiError) {
    return fail(res, err.statusCode, err.message, err.details);
  }

  // Prisma unique-constraint violation -> 409, without leaking internals.
  if (err?.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return fail(res, 409, `That ${field} is already taken.`);
  }
  if (err?.code === 'P2025') {
    return fail(res, 404, 'The requested resource was not found.');
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return fail(res, 401, 'Your session has expired. Please log in again.');
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  const message = env.isProd ? 'Something went wrong. Please try again.' : (err?.message || 'Internal error');
  return fail(res, 500, message);
}
