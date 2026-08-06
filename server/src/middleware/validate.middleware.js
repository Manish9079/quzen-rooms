import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body (or req.query) against a Zod schema. On success,
 * replaces it with the parsed/coerced value so controllers get clean data.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    next();
  };
}
