const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");
const imageController = require("./image.controller");

const list = asyncHandler(async (req, res) => {
  const result = await productService.list(req.query);
  res.json({ success: true, data: result });
});

const listMine = asyncHandler(async (req, res) => {
  const products = await productService.listMine(req.user.id);
  res.json({ success: true, data: products });
});

const suggest = asyncHandler(async (req, res) => {
  const suggestions = await productService.suggest(req.query.q, req.query.limit);
  res.json({ success: true, data: suggestions });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(Number(req.params.id));
  res.json({ success: true, data: product });
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.user.id, req.body);
  res.status(201).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(Number(req.params.id), req.body, req.user);
  res.json({ success: true, data: product });
});

const remove = asyncHandler(async (req, res) => {
  const result = await productService.remove(Number(req.params.id), req.user);
  res.json({ success: true, data: result });
});

module.exports = {
  list,
  listMine,
  suggest,
  getById,
  create,
  update,
  remove,
  uploadImages: imageController.uploadProductImages,
  deleteImage: imageController.deleteProductImage,
};
