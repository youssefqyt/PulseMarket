const { query } = require("../config/db");

/** Add a favourite; idempotent thanks to the unique constraint. */
async function add(userId, productId) {
  const { rows } = await query(
    `INSERT INTO favorites (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING
     RETURNING id, user_id, product_id, created_at`,
    [userId, productId]
  );
  return rows[0] || { user_id: userId, product_id: productId };
}

async function remove(userId, productId) {
  const { rowCount } = await query(
    `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rowCount > 0;
}

async function exists(userId, productId) {
  const { rows } = await query(
    `SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rows.length > 0;
}

async function createShare(userId) {
  const { rows } = await query(
    `INSERT INTO favorite_shares (user_id) VALUES ($1) RETURNING share_token, expires_at`,
    [userId]
  );
  return { token: rows[0].share_token, expiresAt: rows[0].expires_at };
}

async function findShare(token) {
  const { rows } = await query(
    `SELECT fs.user_id, u.name FROM favorite_shares fs
       JOIN users u ON u.id = fs.user_id
      WHERE fs.share_token = $1 AND fs.expires_at > now()`,
    [token]
  );
  return rows[0] || null;
}

module.exports = { add, remove, exists, createShare, findShare };
