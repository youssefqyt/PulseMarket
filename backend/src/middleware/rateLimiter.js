const rateLimit = require("express-rate-limit");
const config = require("../config");

/** General limiter applied to the whole API. */
const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests, please try again later." },
  },
});

/** Stricter limiter for auth endpoints (brute-force protection). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many auth attempts, please try again later." },
  },
});

module.exports = { apiLimiter, authLimiter };
