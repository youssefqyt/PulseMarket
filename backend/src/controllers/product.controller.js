const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");

const list = asyncHandler(async (req, res) => {
  const result = await productService.list(req.query);
  res.json({ success: true, data: result });
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

module.exports = { list, getById, create, update, remove };
