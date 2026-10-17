const asyncHandler = require("../utils/asyncHandler");
const cartService = require("../services/cart.service");

const get = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.json({ success: true, data: cart });
});

const add = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(req.user.id, productId, quantity);
  res.status(201).json({ success: true, data: cart });
});

const update = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(
    req.user.id,
    Number(req.params.productId),
    req.body.quantity
  );
  res.json({ success: true, data: cart });
});

const remove = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, Number(req.params.productId));
  res.json({ success: true, data: cart });
});

const clear = asyncHandler(async (req, res) => {
  const cart = await cartService.clear(req.user.id);
  res.json({ success: true, data: cart });
});

module.exports = { get, add, update, remove, clear };
