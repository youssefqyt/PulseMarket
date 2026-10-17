/**
 * Operational (expected) errors carry an HTTP status code.
 * Anything that is NOT an ApiError is treated as an unexpected 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized", details) {
    return new ApiError(401, message, details);
  }
  static forbidden(message = "Forbidden", details) {
    return new ApiError(403, message, details);
  }
  static notFound(message = "Not found", details) {
    return new ApiError(404, message, details);
  }
  static conflict(message = "Conflict", details) {
    return new ApiError(409, message, details);
  }
  static tooMany(message = "Too many requests", details) {
    return new ApiError(429, message, details);
  }
  static internal(message = "Internal server error", details) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;
