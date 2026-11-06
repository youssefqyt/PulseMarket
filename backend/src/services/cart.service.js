const ApiError = require("../utils/ApiError");
const { mapCartItem } = require("../models");
const cartRepo = require("../repositories/cart.repository");
const productRepo = require("../repositories/product.repository");

/** Cart with per-line subtotal and a grand total. */
async function getCart(userId) {
  const rows = await cartRepo.getByUser(userId);
  const items = rows.map(mapCartItem);
  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  return { items, total: Number(total.toFixed(2)), itemCount: items.length };
}

async function addItem(userId, productId, quantity) {
  const product = await productRepo.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  if (product.seller_is_suspended || product.seller_status !== "approved") {
    throw ApiError.badRequest("Product is not available");
  }
  if (!product.is_active) throw ApiError.badRequest("Product is not available");
  if (product.stock < quantity) throw ApiError.badRequest("Not enough stock");

  await cartRepo.addOrIncrement(userId, productId, quantity);
  return getCart(userId);
}

async function updateItem(userId, productId, quantity) {
  const product = await productRepo.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  if (product.seller_is_suspended || product.seller_status !== "approved") {
    throw ApiError.badRequest("Product is not available");
  }
  if (product.stock < quantity) throw ApiError.badRequest("Not enough stock");

  const updated = await cartRepo.updateQuantity(userId, productId, quantity);
  if (!updated) throw ApiError.notFound("Item not in cart");
  return getCart(userId);
}

async function removeItem(userId, productId) {
  await cartRepo.remove(userId, productId);
  return getCart(userId);
}

async function clear(userId) {
  await cartRepo.clear(userId);
  return getCart(userId);
}

module.exports = { getCart, addItem, updateItem, removeItem, clear };
