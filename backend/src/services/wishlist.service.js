const ApiError = require("../utils/ApiError");
const favoriteRepository = require("../repositories/favorite.repository");
const productRepository = require("../repositories/product.repository");
const alertRepository = require("../repositories/priceAlert.repository");

async function createShare(userId) {
  return favoriteRepository.createShare(userId);
}

async function getShared(token) {
  const owner = await favoriteRepository.findShare(token);
  if (!owner) throw ApiError.notFound("Wishlist link is invalid or expired");
  const [rows, total] = await Promise.all([
    productRepository.findFavoritesByUser(owner.user_id, { limit: 100 }),
    productRepository.countFavoritesByUser(owner.user_id),
  ]);
  return {
    ownerName: owner.name,
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      price: Number(row.price),
      imageUrl: row.image_url,
    })),
    total,
  };
}

async function listAlerts(userId) {
  return alertRepository.listByUser(userId);
}

async function setAlert(userId, productId, targetPrice) {
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  return alertRepository.upsert(userId, productId, targetPrice);
}

async function removeAlert(userId, productId) {
  await alertRepository.remove(userId, productId);
  return { removed: true };
}

module.exports = { createShare, getShared, listAlerts, setAlert, removeAlert };
