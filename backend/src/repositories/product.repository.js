const { query } = require("../config/db");

/** Shared SELECT with category + seller joins. */
const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug,
         u.name AS seller_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u      ON u.id = p.seller_id
`;

/**
 * Flexible, paginated listing with optional search/filter/sort.
 * Returns { rows, total }.
 */
async function findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
  const where = ["p.is_active = TRUE"];
  const params = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`c.slug = $${params.length}`);
  }
  if (filters.sellerId) {
    params.push(filters.sellerId);
    where.push(`p.seller_id = $${params.length}`);
  }
  if (filters.minPrice !== undefined) {
    params.push(filters.minPrice);
    where.push(`p.price >= $${params.length}`);
  }
  if (filters.maxPrice !== undefined) {
    params.push(filters.maxPrice);
    where.push(`p.price <= $${params.length}`);
  }

  const sortMap = {
    newest: "p.created_at DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
  };
  const orderBy = sortMap[filters.sort] || "p.created_at DESC";
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}`,
    params
  );

  const listResult = await query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { rows: listResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const { rows } = await query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  return rows[0] || null;
}

/** Like findAll but marks favourites for a given user. */
async function findFavoritesByUser(userId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `${BASE_SELECT}
       JOIN favorites f ON f.product_id = p.id AND f.user_id = $1
      WHERE p.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

async function countFavoritesByUser(userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM favorites WHERE user_id = $1`,
    [userId]
  );
  return rows[0].total;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO products (seller_id, category_id, title, description, price, image_url, stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.sellerId,
      data.categoryId ?? null,
      data.title,
      data.description ?? null,
      data.price,
      data.imageUrl ?? null,
      data.stock ?? 0,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await query(
    `UPDATE products SET
        title       = COALESCE($2, title),
        description = COALESCE($3, description),
        price       = COALESCE($4, price),
        category_id = COALESCE($5, category_id),
        image_url   = COALESCE($6, image_url),
        stock       = COALESCE($7, stock),
        is_active   = COALESCE($8, is_active)
      WHERE id = $1
      RETURNING *`,
    [
      id,
      data.title ?? null,
      data.description ?? null,
      data.price ?? null,
      data.categoryId ?? null,
      data.imageUrl ?? null,
      data.stock ?? null,
      data.isActive ?? null,
    ]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await query(`DELETE FROM products WHERE id = $1`, [id]);
  return rowCount > 0;
}

/**
 * Atomically decrement stock. Returns the updated row, or null when there
 * is not enough stock (guarded by the WHERE clause).
 * Must be called with a transaction client for order creation.
 */
async function decrementStock(client, productId, quantity) {
  const { rows } = await client.query(
    `UPDATE products
        SET stock = stock - $2
      WHERE id = $1 AND stock >= $2
      RETURNING *`,
    [productId, quantity]
  );
  return rows[0] || null;
}

async function findByIdForUpdate(client, productId) {
  const { rows } = await client.query(
    `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
    [productId]
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findFavoritesByUser,
  countFavoritesByUser,
  create,
  update,
  remove,
  decrementStock,
  findByIdForUpdate,
};
