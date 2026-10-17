const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

/**
 * Extract a bearer token from the Authorization header.
 */
function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

/** Require a valid access token. Populates req.user = { id, email, role }. */
function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized("Missing access token"));
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/** Attach req.user when a token is present, but never block the request. */
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    } catch {
      /* ignore invalid token on optional routes */
    }
  }
  return next();
}

/** Restrict a route to one or more roles. */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to do this"));
    }
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
