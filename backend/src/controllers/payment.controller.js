const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");

const createSession = asyncHandler(async (req, res) => {
  const result = await paymentService.createCheckoutSession(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

const status = asyncHandler(async (req, res) => {
  const result = await paymentService.getSessionStatus(req.user.id, req.params.sessionId);
  res.json({ success: true, data: result });
});

const webhook = asyncHandler(async (req, res) => {
  const result = await paymentService.handleWebhook(req.body, req.headers["stripe-signature"]);
  res.json({ success: true, data: result });
});

module.exports = { createSession, status, webhook };
