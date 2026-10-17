const { query } = require("../config/db");

async function findAll() {
  const { rows } = await query(
    `SELECT id, name, slug, icon FROM categories ORDER BY name ASC`
  );
  return rows;
}

async function findBySlug(slug) {
  const { rows } = await query(`SELECT * FROM categories WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return rows[0] || null;
}

/** Categories with a live product count, for the Home screen chips. */
async function findAllWithCounts() {
  const { rows } = await query(
    `SELECT c.id, c.name, c.slug, c.icon,
            COUNT(p.id) FILTER (WHERE p.is_active)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC`
  );
  return rows;
}

module.exports = { findAll, findBySlug, findById, findAllWithCounts };
