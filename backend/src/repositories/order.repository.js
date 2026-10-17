const { query } = require("../config/db");

async function create(client, { buyerId, total, shippingAddress, status = "pending" }) {
  const { rows } = await client.query(
    `INSERT INTO orders (buyer_id, total, shipping_address, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [buyerId, total, shippingAddress, status]
  );
  return rows[0];
}

async function addItem(client, orderId, item) {
  const { rows } = await client.query(
    `INSERT INTO order_items (order_id, product_id, seller_id, title, price, quantity)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orderId, item.productId, item.sellerId, item.title, item.price, item.quantity]
  );
  return rows[0];
}

async function listByBuyer(buyerId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT * FROM orders WHERE buyer_id = $1
      ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [buyerId, limit, offset]
  );
  return rows;
}

async function countByBuyer(buyerId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM orders WHERE buyer_id = $1`,
    [buyerId]
  );
  return rows[0].total;
}

async function findById(orderId) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  return rows[0] || null;
}

async function getItems(orderId) {
  const { rows } = await query(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

async function updateStatus(orderId, status) {
  const { rows } = await query(
    `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
    [orderId, status]
  );
  return rows[0] || null;
}

module.exports = {
  create,
  addItem,
  listByBuyer,
  countByBuyer,
  findById,
  getItems,
  updateStatus,
};
