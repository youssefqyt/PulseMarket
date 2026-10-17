const { query } = require("../config/db");

async function store(userId, tokenHash, expiresAt) {
  const { rows } = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, revoked`,
    [userId, tokenHash, expiresAt]
  );
  return rows[0];
}

/** Only returns a token if it exists AND is not revoked AND not expired. */
async function findValid(tokenHash) {
  const { rows } = await query(
    `SELECT * FROM refresh_tokens
      WHERE token_hash = $1 AND revoked = FALSE AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revoke(tokenHash) {
  const { rowCount } = await query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
    [tokenHash]
  );
  return rowCount > 0;
}

async function revokeAllForUser(userId) {
  await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
}

module.exports = { store, findValid, revoke, revokeAllForUser };
