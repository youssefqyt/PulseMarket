const ApiError = require("../utils/ApiError");
const { mapProduct } = require("../models");
const { getPagination, paginated } = require("../utils/pagination");
const productRepo = require("../repositories/product.repository");
const categoryRepo = require("../repositories/category.repository");
const cache = require("../config/redis");

const CACHE_TTL = 30; // seconds

async function list(filters) {
  const { page, limit, offset } = getPagination(filters);
  const cacheKey = `products:list:${JSON.stringify({ ...filters, page, limit })}`;

  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { rows, total } = await productRepo.findAll(filters, { limit, offset });
  const result = paginated(rows.map(mapProduct), total, page, limit);

  await cache.set(cacheKey, JSON.stringify(result), CACHE_TTL);
  return result;
}

async function getById(id) {
  const row = await productRepo.findById(id);
  if (!row) throw ApiError.notFound("Product not found");
  return mapProduct(row);
}

async function create(sellerId, data) {
  if (data.categoryId) {
    const category = await categoryRepo.findById(data.categoryId);
    if (!category) throw ApiError.badRequest("Category does not exist");
  }
  const row = await productRepo.create({ ...data, sellerId });
  await cache.delByPrefix("products:list:");
  return mapProduct(row);
}

/** Only the owner (or an admin) may change a product. */
async function update(id, data, user) {
  const existing = await productRepo.findById(id);
  if (!existing) throw ApiError.notFound("Product not found");
  if (existing.seller_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You can only edit your own products");
  }
  if (data.categoryId) {
    const category = await categoryRepo.findById(data.categoryId);
    if (!category) throw ApiError.badRequest("Category does not exist");
  }
  const row = await productRepo.update(id, data);
  await cache.delByPrefix("products:list:");
  return mapProduct(row);
}

async function remove(id, user) {
  const existing = await productRepo.findById(id);
  if (!existing) throw ApiError.notFound("Product not found");
  if (existing.seller_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own products");
  }
  await productRepo.remove(id);
  await cache.delByPrefix("products:list:");
  return { deleted: true };
}

async function listFavorites(userId, query) {
  const { page, limit, offset } = getPagination(query);
  const rows = await productRepo.findFavoritesByUser(userId, { limit, offset });
  const total = await productRepo.countFavoritesByUser(userId);
  return paginated(rows.map(mapProduct), total, page, limit);
}

module.exports = { list, getById, create, update, remove, listFavorites };
