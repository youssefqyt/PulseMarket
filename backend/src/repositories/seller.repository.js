const { query, withTransaction } = require("../config/db");
const ApiError = require("../utils/ApiError");

async function listOrders(sellerId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT DISTINCT o.*, u.name AS buyer_name, u.email AS buyer_email
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.seller_id = $1
        AND o.status <> 'cancelled'
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  return rows;
}

async function countOrders(sellerId) {
  const { rows } = await query(
    `SELECT COUNT(DISTINCT o.id)::int AS total
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.seller_id = $1 AND o.status <> 'cancelled'`,
    [sellerId]
  );
  return rows[0].total;
}

async function getOrderItems(sellerId, orderId) {
  const { rows } = await query(
    `SELECT * FROM order_items WHERE seller_id = $1 AND order_id = $2 ORDER BY id`,
    [sellerId, orderId]
  );
  return rows;
}

async function getFulfillment(sellerId, orderId) {
  const { rows } = await query(
    `SELECT * FROM seller_fulfillments WHERE seller_id = $1 AND order_id = $2`,
    [sellerId, orderId]
  );
  return rows[0] || null;
}

async function getAnalytics(sellerId) {
  const { rows } = await query(
    `SELECT
       COUNT(DISTINCT oi.order_id)::int AS orders,
       COALESCE(SUM(oi.price * oi.quantity) FILTER (WHERE o.payment_status = 'paid'), 0)::numeric AS revenue,
       COUNT(*) FILTER (WHERE o.status IN ('pending', 'paid'))::int AS open_lines,
       COUNT(DISTINCT p.id) FILTER (WHERE p.stock <= p.low_stock_threshold)::int AS low_stock_products
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.seller_id = $1`,
    [sellerId]
  );
  const products = await query(
    `SELECT p.id, p.title, p.stock,
            COALESCE(SUM(oi.quantity) FILTER (WHERE o.payment_status = 'paid'), 0)::int AS units_sold,
            COALESCE(SUM(oi.price * oi.quantity) FILTER (WHERE o.payment_status = 'paid'), 0)::numeric AS revenue
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id AND oi.seller_id = $1
       LEFT JOIN orders o ON o.id = oi.order_id
      WHERE p.seller_id = $1
      GROUP BY p.id
      ORDER BY units_sold DESC, p.created_at DESC
      LIMIT 5`,
    [sellerId]
  );
  return {
    ...rows[0],
    revenue: Number(rows[0].revenue),
    bestSellers: products.rows.map((row) => ({
      id: row.id,
      title: row.title,
      stock: row.stock,
      unitsSold: row.units_sold,
      revenue: Number(row.revenue),
    })),
  };
}

async function updateFulfillment(sellerId, orderId, { status, trackingNumber, carrier, estimatedDeliveryAt }) {
  return withTransaction(async (client) => {
    const locked = await client.query(
      `SELECT * FROM seller_fulfillments
        WHERE seller_id = $1 AND order_id = $2
        FOR UPDATE`,
      [sellerId, orderId]
    );
    const current = locked.rows[0];
    if (!current) return null;
    if (
      (status === "shipped" && current.status !== "pending") ||
      (status === "completed" && current.status !== "shipped")
    ) {
      throw ApiError.conflict("Seller fulfillment status changed; refresh and try again");
    }

    const fulfillment = await client.query(
      `UPDATE seller_fulfillments
          SET status = COALESCE($3, status),
              tracking_number = COALESCE($4, tracking_number),
              carrier = COALESCE($5, carrier),
              estimated_delivery_at = COALESCE($6, estimated_delivery_at),
              updated_at = now()
        WHERE seller_id = $1 AND order_id = $2
        RETURNING *`,
      [sellerId, orderId, status ?? null, trackingNumber ?? null, carrier ?? null, estimatedDeliveryAt ?? null]
    );

    const states = await client.query(
      `SELECT bool_and(status IN ('shipped', 'completed')) AS all_shipped,
              bool_and(status = 'completed') AS all_completed
         FROM seller_fulfillments WHERE order_id = $1`,
      [orderId]
    );
    const globalStatus = states.rows[0].all_completed
      ? "completed"
      : states.rows[0].all_shipped
        ? "shipped"
        : null;

    let order;
    if (globalStatus) {
      const updatedOrder = await client.query(
        `UPDATE orders SET status = $2
          WHERE id = $1 AND payment_status IN ('paid', 'unpaid')
            AND status IN ('pending', 'paid', 'shipped')
          RETURNING *`,
        [orderId, globalStatus]
      );
      order = updatedOrder.rows[0];
      if (!order) {
        throw ApiError.conflict("Order cannot be fulfilled in its current payment or status state");
      }
      if (globalStatus === "completed" && order.payment_method === "cash" && order.payment_status !== "paid") {
        const paid = await client.query(
          `UPDATE orders SET payment_status = 'paid', paid_at = now()
            WHERE id = $1 RETURNING *`,
          [orderId]
        );
        order = paid.rows[0];
      }
    } else {
      const currentOrder = await client.query(
        `SELECT * FROM orders
          WHERE id = $1 AND payment_status IN ('paid', 'unpaid')
            AND status IN ('pending', 'paid', 'shipped')`,
        [orderId]
      );
      order = currentOrder.rows[0];
      if (!order) {
        throw ApiError.conflict("Order cannot be fulfilled in its current payment or status state");
      }
    }
    return { ...order, fulfillment_status: fulfillment.rows[0].status };
  });
}

module.exports = { listOrders, countOrders, getOrderItems, getFulfillment, getAnalytics, updateFulfillment };
