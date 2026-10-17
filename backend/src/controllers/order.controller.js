const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data: order });
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.user.id, req.query);
  res.json({ success: true, data: result });
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(Number(req.params.id), req.user);
  res.json({ success: true, data: order });
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(
    Number(req.params.id),
    req.body.status,
    req.user
  );
  res.json({ success: true, data: order });
});

module.exports = { create, list, getById, updateStatus };
