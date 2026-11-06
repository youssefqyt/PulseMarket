const { query } = require("../config/db");

async function listByUser(userId) {
  const { rows } = await query(
    `SELECT pa.*, p.title, p.price
       FROM price_alerts pa JOIN products p ON p.id = pa.product_id
      WHERE pa.user_id = $1 AND pa.is_active = TRUE ORDER BY pa.created_at DESC`,
    [userId]
  );
  return rows;
}

async function upsert(userId, productId, targetPrice) {
  const { rows } = await query(
    `INSERT INTO price_alerts (user_id, product_id, target_price, is_active)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (user_id, product_id) DO UPDATE
       SET target_price = EXCLUDED.target_price, is_active = TRUE
     RETURNING *`,
    [userId, productId, targetPrice]
  );
  return rows[0];
}

async function remove(userId, productId) {
  const { rowCount } = await query(
    `DELETE FROM price_alerts WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rowCount > 0;
}

async function findTriggered(productId, newPrice) {
  const { rows } = await query(
    `UPDATE price_alerts SET is_active = FALSE
      WHERE product_id = $1 AND is_active = TRUE AND target_price >= $2
      RETURNING user_id, target_price`,
    [productId, newPrice]
  );
  return rows;
}

module.exports = { listByUser, upsert, remove, findTriggered };
