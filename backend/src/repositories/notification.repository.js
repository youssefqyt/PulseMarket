const { query } = require("../config/db");

async function listByUser(userId, { limit = 30, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1
      ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

async function markRead(userId, id) {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE
      WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

async function markAllRead(userId) {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE
      WHERE user_id = $1 RETURNING *`,
    [userId]
  );
  return rows;
}

async function create(userId, title, body) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, title, body)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, title, body]
  );
  return rows[0];
}

module.exports = { listByUser, markRead, markAllRead, create };
