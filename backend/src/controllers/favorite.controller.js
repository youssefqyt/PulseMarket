const asyncHandler = require("../utils/asyncHandler");
const favoriteService = require("../services/favorite.service");
const productService = require("../services/product.service");

const list = asyncHandler(async (req, res) => {
  const result = await productService.listFavorites(req.user.id, req.query);
  res.json({ success: true, data: result });
});

const add = asyncHandler(async (req, res) => {
  const productId = Number(req.body.productId ?? req.params.id);
  const result = await favoriteService.add(req.user.id, productId);
  res.status(201).json({ success: true, data: result });
});

const remove = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  const result = await favoriteService.remove(req.user.id, productId);
  res.json({ success: true, data: result });
});

module.exports = { list, add, remove };
