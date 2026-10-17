const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

/** Short-lived access token (sent in the Authorization header). */
function signAccessToken(payload) {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

/**
 * Long-lived refresh token (stored hashed in the DB).
 * A random `jti` guarantees two tokens issued in the same second are still
 * distinct, so `refresh_tokens.token_hash` never collides on rotation.
 */
function signRefreshToken(payload) {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

/** We never store raw refresh tokens — only a sha256 of them. */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
