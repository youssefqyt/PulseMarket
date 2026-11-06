const { query } = require("../config/db");

const PUBLIC_COLUMNS = "id, name, email, role, avatar_url, seller_status, is_suspended, created_at";

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, role, avatar_url, seller_status, is_suspended, created_at, password_hash
       FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findAuthState(id) {
  const { rows } = await query(
    `SELECT id, name, email, role, seller_status, is_suspended
       FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, role = "user" }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

async function updateProfile(id, { name, avatarUrl }) {
  const { rows } = await query(
    `UPDATE users
        SET name = COALESCE($2, name),
            avatar_url = COALESCE($3, avatar_url)
      WHERE id = $1
      RETURNING ${PUBLIC_COLUMNS}`,
    [id, name ?? null, avatarUrl ?? null]
  );
  return rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, passwordHash]);
}

module.exports = { findByEmail, findById, findAuthState, create, updateProfile, updatePassword };
