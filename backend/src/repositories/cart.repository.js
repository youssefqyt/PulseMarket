const { query } = require("../config/db");

const CART_SELECT = `
  SELECT ci.id, ci.product_id, ci.quantity,
         p.title, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
`;

async function getByUser(userId) {
  const { rows } = await query(
    `${CART_SELECT} WHERE ci.user_id = $1 ORDER BY ci.created_at DESC`,
    [userId]
  );
  return rows;
}

async function addOrIncrement(userId, productId, quantity) {
  const { rows } = await query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     RETURNING *`,
    [userId, productId, quantity]
  );
  return rows[0];
}

async function updateQuantity(userId, productId, quantity) {
  const { rows } = await query(
    `UPDATE cart_items SET quantity = $3
      WHERE user_id = $1 AND product_id = $2
      RETURNING *`,
    [userId, productId, quantity]
  );
  return rows[0] || null;
}

async function remove(userId, productId) {
  const { rowCount } = await query(
    `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rowCount > 0;
}

/** Clear the cart (used after a successful order). Accepts a tx client. */
async function clear(userId, client = null) {
  const runner = client || { query };
  await runner.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
}

module.exports = { getByUser, addOrIncrement, updateQuantity, remove, clear };
