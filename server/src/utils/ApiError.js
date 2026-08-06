/** Thrown from controllers/services; caught by middleware/error.middleware.js. */
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isApiError = true;
  }

  static badRequest(message, details) { return new ApiError(400, message, details); }
  static unauthorized(message = 'Unauthorized') { return new ApiError(401, message); }
  static forbidden(message = 'Forbidden') { return new ApiError(403, message); }
  static notFound(message = 'Not found') { return new ApiError(404, message); }
  static conflict(message) { return new ApiError(409, message); }
  static tooMany(message = 'Too many requests') { return new ApiError(429, message); }
  static internal(message = 'Internal server error') { return new ApiError(500, message); }
}
