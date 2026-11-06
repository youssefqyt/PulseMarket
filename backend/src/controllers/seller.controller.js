const asyncHandler = require("../utils/asyncHandler");
const sellerService = require("../services/seller.service");

const orders = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await sellerService.listOrders(req.user.id, req.query) });
});
const analytics = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await sellerService.getAnalytics(req.user.id) });
});
const fulfill = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await sellerService.updateFulfillment(req.user.id, Number(req.params.id), req.body),
  });
});

module.exports = { orders, analytics, fulfill };
