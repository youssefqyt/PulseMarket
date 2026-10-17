const bcrypt = require("bcryptjs");
const config = require("../config");

/** Hash a plaintext password. */
async function hashPassword(plain) {
  return bcrypt.hash(plain, config.security.bcryptRounds);
}

/** Compare a plaintext password against a stored hash. */
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
