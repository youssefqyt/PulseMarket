const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

/**
 * Validate req[source] against a zod schema.
 * On failure we return a 422 with per-field messages.
 */
function validate(schema, source = "body") {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // replace with the parsed/sanitised value
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return next(ApiError.badRequest("Validation failed", details));
      }
      return next(err);
    }
  };
}

/** 404 handler for unmatched routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Central error handler - must be registered LAST. */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error(err.message, { path: req.originalUrl, stack: err.stack });
  } else {
    logger.debug(err.message, { path: req.originalUrl, statusCode });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isServerError && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { validate, notFound, errorHandler };
