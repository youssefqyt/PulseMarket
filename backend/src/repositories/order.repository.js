const { query } = require("../config/db");

async function create(
  client,
  {
    buyerId,
    total,
    shippingAddress,
    paymentMethod = "card",
    phone = null,
    deliveryNotes = null,
    status = "pending",
    paymentStatus = "unpaid",
  }
) {
  const { rows } = await client.query(
    `INSERT INTO orders (buyer_id, total, shipping_address, payment_method, phone, delivery_notes, status, payment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [buyerId, total, shippingAddress, paymentMethod, phone, deliveryNotes, status, paymentStatus]
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

async function listAll({ limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function countAll() {
  const { rows } = await query(`SELECT COUNT(*)::int AS total FROM orders`);
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

async function setStripeSession(orderId, sessionId) {
  const { rows } = await query(
    `UPDATE orders SET stripe_checkout_session_id = $2 WHERE id = $1 RETURNING *`,
    [orderId, sessionId]
  );
  return rows[0] || null;
}

async function findByStripeSession(sessionId) {
  const { rows } = await query(
    `SELECT * FROM orders WHERE stripe_checkout_session_id = $1`,
    [sessionId]
  );
  return rows[0] || null;
}

async function updatePayment(orderId, paymentStatus, status) {
  const { rows } = await query(
    `UPDATE orders
        SET payment_status = $2,
            status = COALESCE($3, status),
            paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE paid_at END
      WHERE id = $1 AND payment_status <> 'paid'
      RETURNING *`,
    [orderId, paymentStatus, status ?? null]
  );
  return rows[0] || null;
}

async function listStatusHistory(orderId) {
  const { rows } = await query(
    `SELECT status, note, created_at FROM order_status_history
      WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );
  return rows;
}

async function listFulfillments(orderId) {
  const { rows } = await query(
    `SELECT sf.seller_id, u.name AS seller_name, sf.status,
            sf.tracking_number, sf.carrier, sf.estimated_delivery_at, sf.updated_at
       FROM seller_fulfillments sf
       JOIN users u ON u.id = sf.seller_id
      WHERE sf.order_id = $1 ORDER BY sf.id`,
    [orderId]
  );
  return rows;
}

async function cancelAndRestock(orderId) {
  const { rows } = await query(
    `WITH target AS (
       SELECT id FROM orders WHERE id = $1 AND payment_status = 'pending' AND status = 'pending'
       FOR UPDATE
     ),
     restored AS (
       UPDATE products p
          SET stock = p.stock + oi.quantity
         FROM order_items oi, target
        WHERE oi.order_id = target.id AND p.id = oi.product_id
       RETURNING p.id
     )
     UPDATE orders o
        SET payment_status = 'failed', status = 'cancelled'
       FROM target
      WHERE o.id = target.id
      RETURNING o.*`,
    [orderId]
  );
  return rows[0] || null;
}

module.exports = {
  create,
  addItem,
  listByBuyer,
  countByBuyer,
  listAll,
  countAll,
  findById,
  getItems,
  updateStatus,
  setStripeSession,
  findByStripeSession,
  updatePayment,
  listStatusHistory,
  listFulfillments,
  cancelAndRestock,
};
