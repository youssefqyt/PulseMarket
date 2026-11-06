const { query, withTransaction } = require("../config/db");
const ApiError = require("../utils/ApiError");

async function getSummary() {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'seller') AS sellers,
      (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE) AS active_products,
      (SELECT COUNT(*)::int FROM products WHERE is_active = FALSE) AS hidden_products,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
      COALESCE(
        (SELECT SUM(total) FROM orders WHERE payment_status = 'paid'),
        0
      )::numeric AS gross_sales
  `);
  return rows[0];
}

async function listProducts({ limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
            u.name AS seller_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN users u ON u.id = p.seller_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function countProducts() {
  const { rows } = await query(`SELECT COUNT(*)::int AS total FROM products`);
  return rows[0].total;
}

async function listUsers({ search = "", limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT id, name, email, role, seller_status, is_suspended, created_at
       FROM users
      WHERE ($1 = '' OR name ILIKE $2 OR email ILIKE $2)
      ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [search, `%${search}%`, limit, offset]
  );
  return rows;
}

async function countUsers(search = "") {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM users
      WHERE ($1 = '' OR name ILIKE $2 OR email ILIKE $2)`,
    [search, `%${search}%`]
  );
  return rows[0].total;
}

async function updateUserWithAudit(adminId, userId, changes) {
  return withTransaction(async (client) => {
    const existingResult = await client.query(
      `SELECT id, name, email, role, seller_status, is_suspended, created_at
         FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const existing = existingResult.rows[0];
    if (!existing) return null;
    if (changes.sellerStatus && (changes.role ?? existing.role) !== "seller") {
      throw ApiError.badRequest("Seller review status only applies to seller accounts");
    }

    const updatedResult = await client.query(
      `UPDATE users SET
         role = COALESCE($2, role),
         seller_status = COALESCE($3, seller_status),
         is_suspended = COALESCE($4, is_suspended)
        WHERE id = $1
        RETURNING id, name, email, role, seller_status, is_suspended, created_at`,
      [userId, changes.role ?? null, changes.sellerStatus ?? null, changes.isSuspended ?? null]
    );
    const updated = updatedResult.rows[0];
    await client.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'user.updated', 'user', $2, $3)`,
      [
        adminId,
        String(userId),
        JSON.stringify({
          changes,
          before: {
            role: existing.role,
            sellerStatus: existing.seller_status,
            isSuspended: existing.is_suspended,
          },
        }),
      ]
    );
    return { existing, updated };
  });
}

async function writeAudit(adminId, action, targetType, targetId, details) {
  const { rows } = await query(
    `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [adminId, action, targetType, String(targetId), JSON.stringify(details)]
  );
  return rows[0];
}

async function listAudit({ limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at,
            u.name AS admin_name, u.email AS admin_email
       FROM admin_audit_logs a
       LEFT JOIN users u ON u.id = a.admin_id
      ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getSalesTrends() {
  const { rows } = await query(
    `WITH days AS (
       SELECT generate_series(current_date - 29, current_date, INTERVAL '1 day')::date AS day
     ),
     order_daily AS (
       SELECT created_at::date AS day,
              COUNT(*)::int AS orders,
              COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancellations,
              COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS revenue
         FROM orders
        WHERE created_at >= current_date - INTERVAL '29 days'
        GROUP BY created_at::date
     ),
     seller_daily AS (
       SELECT o.created_at::date AS day, COUNT(DISTINCT oi.seller_id)::int AS active_sellers
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.created_at >= current_date - INTERVAL '29 days'
          AND o.payment_status = 'paid'
        GROUP BY o.created_at::date
     )
     SELECT days.day,
            COALESCE(order_daily.orders, 0)::int AS orders,
            COALESCE(order_daily.cancellations, 0)::int AS cancellations,
            COALESCE(order_daily.revenue, 0)::numeric AS revenue,
            COALESCE(seller_daily.active_sellers, 0)::int AS active_sellers
       FROM days
       LEFT JOIN order_daily USING (day)
       LEFT JOIN seller_daily USING (day)
      ORDER BY days.day`
  );
  return rows.map((row) => ({
    day: row.day,
    orders: row.orders,
    cancellations: row.cancellations,
    revenue: Number(row.revenue),
    activeSellers: row.active_sellers,
  }));
}

module.exports = {
  getSummary,
  listProducts,
  countProducts,
  listUsers,
  countUsers,
  updateUserWithAudit,
  writeAudit,
  listAudit,
  getSalesTrends,
};
