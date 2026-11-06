const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");
const productService = require("../services/product.service");
const { writeAudit } = require("../repositories/admin.repository");

const summary = asyncHandler(async (_req, res) => {
  const data = await adminService.getSummary();
  res.json({ success: true, data });
});

const products = asyncHandler(async (req, res) => {
  const data = await adminService.listProducts(req.query);
  res.json({ success: true, data });
});

const orders = asyncHandler(async (req, res) => {
  const data = await adminService.listOrders(req.query);
  res.json({ success: true, data });
});

const users = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listUsers(req.query) });
});

const updateUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await adminService.updateUser(req.user.id, Number(req.params.id), req.body),
  });
});

const audit = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.listAudit(req.query) });
});

const trends = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await adminService.getSalesTrends() });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(Number(req.params.id), req.body, req.user);
  await writeAudit(req.user.id, "product.moderated", "product", product.id, req.body);
  res.json({ success: true, data: product });
});

module.exports = { summary, products, orders, users, updateUser, audit, trends, updateProduct };
