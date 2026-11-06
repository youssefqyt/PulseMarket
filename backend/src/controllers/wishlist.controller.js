const asyncHandler = require("../utils/asyncHandler");
const wishlistService = require("../services/wishlist.service");

const createShare = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await wishlistService.createShare(req.user.id) });
});
const getShared = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await wishlistService.getShared(req.params.token) });
});
const listAlerts = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await wishlistService.listAlerts(req.user.id) });
});
const setAlert = asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    data: await wishlistService.setAlert(req.user.id, Number(req.params.productId), req.body.targetPrice),
  });
});
const removeAlert = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await wishlistService.removeAlert(req.user.id, Number(req.params.productId)),
  });
});

module.exports = { createShare, getShared, listAlerts, setAlert, removeAlert };
