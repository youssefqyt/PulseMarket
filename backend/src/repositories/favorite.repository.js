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

module.exports = { add, remove, exists };
