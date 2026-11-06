const { query } = require("../config/db");

async function listByProduct(productId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT r.*, u.name AS buyer_name
       FROM product_reviews r
       JOIN users u ON u.id = r.buyer_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );
  return rows;
}

async function countByProduct(productId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total, COALESCE(AVG(rating), 0)::numeric AS average
       FROM product_reviews WHERE product_id = $1`,
    [productId]
  );
  return rows[0];
}

async function listEligibleOrderItems(productId, buyerId) {
  const { rows } = await query(
    `SELECT oi.id AS order_item_id, o.id AS order_id, o.created_at AS purchased_at
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE oi.product_id = $1 AND o.buyer_id = $2
        AND o.status IN ('shipped', 'completed') AND o.payment_status = 'paid'
        AND p.seller_id <> $2
        AND NOT EXISTS (
          SELECT 1 FROM product_reviews r WHERE r.order_item_id = oi.id
        )
      ORDER BY o.created_at DESC
      LIMIT 10`,
    [productId, buyerId]
  );
  return rows;
}

async function createVerified({ productId, buyerId, orderItemId, rating, body }) {
  const { rows } = await query(
    `WITH inserted AS (
       INSERT INTO product_reviews (product_id, buyer_id, order_item_id, rating, body)
       SELECT $1, $2, oi.id, $4, $5
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
        WHERE oi.id = $3 AND oi.product_id = $1 AND o.buyer_id = $2
          AND o.status IN ('shipped', 'completed') AND o.payment_status = 'paid'
          AND p.seller_id <> $2
       RETURNING *
     )
     SELECT inserted.*, u.name AS buyer_name
       FROM inserted JOIN users u ON u.id = inserted.buyer_id`,
    [productId, buyerId, orderItemId, rating, body]
  );
  return rows[0] || null;
}

async function respond(reviewId, sellerId, response) {
  const { rows } = await query(
    `WITH updated AS (
       UPDATE product_reviews r
          SET seller_response = $3, responded_at = now(), updated_at = now()
         FROM products p
        WHERE r.id = $1 AND p.id = r.product_id AND p.seller_id = $2
        RETURNING r.*
     )
     SELECT updated.*, u.name AS buyer_name
       FROM updated JOIN users u ON u.id = updated.buyer_id`,
    [reviewId, sellerId, response]
  );
  return rows[0] || null;
}

module.exports = { listByProduct, countByProduct, listEligibleOrderItems, createVerified, respond };
