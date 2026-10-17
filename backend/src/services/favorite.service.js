const ApiError = require("../utils/ApiError");
const favoriteRepo = require("../repositories/favorite.repository");
const productRepo = require("../repositories/product.repository");

async function add(userId, productId) {
  const product = await productRepo.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  await favoriteRepo.add(userId, productId);
  return { favorited: true, productId };
}

async function remove(userId, productId) {
  await favoriteRepo.remove(userId, productId);
  return { favorited: false, productId };
}

module.exports = { add, remove };
