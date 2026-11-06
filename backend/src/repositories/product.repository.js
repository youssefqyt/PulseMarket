const { query, withTransaction } = require("../config/db");
const ApiError = require("../utils/ApiError");

/** Shared SELECT with category + seller joins. */
const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug,
         u.name AS seller_name, u.is_suspended AS seller_is_suspended,
         u.seller_status AS seller_status
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u      ON u.id = p.seller_id
`;

/**
 * Flexible, paginated listing with optional search/filter/sort.
 * Returns { rows, total }.
 */
async function findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
  const where = [
    "p.is_active = TRUE",
    `EXISTS (
      SELECT 1 FROM users seller
       WHERE seller.id = p.seller_id
         AND seller.is_suspended = FALSE
         AND seller.seller_status = 'approved'
    )`,
  ];
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
  if (filters.inStock) where.push("p.stock > 0");

  const sortMap = {
    newest: "p.created_at DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    popularity: `(SELECT COALESCE(SUM(oi.quantity), 0)
                    FROM order_items oi JOIN orders o ON o.id = oi.order_id
                   WHERE oi.product_id = p.id AND o.payment_status = 'paid') DESC, p.created_at DESC`,
    rating: "(SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id) DESC NULLS LAST, p.created_at DESC",
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

  return { rows: await attachImages(listResult.rows), total: countResult.rows[0].total };
}

async function attachImages(rows) {
  if (!rows.length) return rows;
  const { rows: images } = await query(
    `SELECT id, product_id, image_url, public_id, sort_order FROM product_images
      WHERE product_id = ANY($1::int[]) ORDER BY sort_order, id`,
    [rows.map((row) => row.id)]
  );
  const byProduct = new Map();
  for (const image of images) {
    const list = byProduct.get(image.product_id) || [];
    list.push(image);
    byProduct.set(image.product_id, list);
  }
  return rows.map((row) => ({
    ...row,
    image_urls: byProduct.get(row.id)?.map((image) => image.image_url) || (row.image_url ? [row.image_url] : []),
    images: byProduct.get(row.id)?.map((image) => ({
      id: image.id,
      url: image.image_url,
      sortOrder: image.sort_order,
    })) || [],
  }));
}

async function suggest(queryText, limit = 8) {
  const { rows } = await query(
    `SELECT p.id, p.title, p.image_url, p.price
       FROM products p
       JOIN users seller ON seller.id = p.seller_id
      WHERE p.is_active = TRUE AND p.stock > 0
        AND seller.is_suspended = FALSE AND seller.seller_status = 'approved'
        AND p.title ILIKE $1
      ORDER BY CASE WHEN lower(p.title) LIKE lower($2) THEN 0 ELSE 1 END, p.title
      LIMIT $3`,
    [`%${queryText}%`, `${queryText}%`, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    price: Number(row.price),
  }));
}

async function findById(id) {
  const { rows } = await query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  if (!rows[0]) return null;
  const [product] = await attachImages(rows);
  const { rows: stats } = await query(
    `SELECT COUNT(*)::int AS review_count, COALESCE(AVG(rating), 0)::numeric AS average_rating
       FROM product_reviews WHERE product_id = $1`,
    [id]
  );
  return { ...product, review_count: stats[0].review_count, average_rating: stats[0].average_rating };
}

async function findBySeller(sellerId) {
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC`,
    [sellerId]
  );
  return attachImages(rows);
}

async function addImages(productId, images) {
  return withTransaction(async (client) => {
    const product = await client.query(`SELECT id FROM products WHERE id = $1 FOR UPDATE`, [productId]);
    if (!product.rows[0]) throw ApiError.notFound("Product not found");
    const count = await client.query(
      `SELECT COUNT(*)::int AS total FROM product_images WHERE product_id = $1`,
      [productId]
    );
    if (count.rows[0].total + images.length > 6) {
      throw ApiError.badRequest("A product can have up to 6 uploaded images");
    }
    const saved = [];
    for (const image of images) {
      const { rows } = await client.query(
        `INSERT INTO product_images (product_id, image_url, public_id, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [productId, image.url, image.publicId, image.sortOrder]
      );
      saved.push(rows[0]);
    }
    if (saved[0]) {
      await client.query(`UPDATE products SET image_url = $2 WHERE id = $1`, [productId, saved[0].image_url]);
    }
    return saved;
  });
}

async function deleteImage(productId, imageId) {
  return withTransaction(async (client) => {
    const product = await client.query(`SELECT id FROM products WHERE id = $1 FOR UPDATE`, [productId]);
    if (!product.rows[0]) return null;
    const { rows } = await client.query(
      `DELETE FROM product_images WHERE product_id = $1 AND id = $2 RETURNING *`,
      [productId, imageId]
    );
    if (!rows[0]) return null;
    const remaining = await client.query(
      `SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order, id LIMIT 1`,
      [productId]
    );
    const primaryImageUrl = remaining.rows[0]?.image_url ?? null;
    await client.query(`UPDATE products SET image_url = $2 WHERE id = $1`, [productId, primaryImageUrl]);
    return { image: rows[0], primaryImageUrl };
  });
}

/** Like findAll but marks favourites for a given user. */
async function findFavoritesByUser(userId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await query(
    `${BASE_SELECT}
       JOIN favorites f ON f.product_id = p.id AND f.user_id = $1
      WHERE p.is_active = TRUE
        AND EXISTS (
          SELECT 1 FROM users seller
           WHERE seller.id = p.seller_id
             AND seller.is_suspended = FALSE
             AND seller.seller_status = 'approved'
        )
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
    `INSERT INTO products (seller_id, category_id, title, description, price, image_url, stock, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.sellerId,
      data.categoryId ?? null,
      data.title,
      data.description ?? null,
      data.price,
      data.imageUrl ?? null,
      data.stock ?? 0,
      data.lowStockThreshold ?? 5,
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
        is_active   = COALESCE($8, is_active),
        low_stock_threshold = COALESCE($9, low_stock_threshold)
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
      data.lowStockThreshold ?? null,
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
    `SELECT p.*, u.is_suspended AS seller_is_suspended, u.seller_status
       FROM products p JOIN users u ON u.id = p.seller_id
      WHERE p.id = $1 FOR UPDATE OF p, u`,
    [productId]
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  suggest,
  findById,
  findBySeller,
  addImages,
  deleteImage,
  findFavoritesByUser,
  countFavoritesByUser,
  create,
  update,
  remove,
  decrementStock,
  findByIdForUpdate,
};
