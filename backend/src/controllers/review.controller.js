const asyncHandler = require("../utils/asyncHandler");
const reviewService = require("../services/review.service");

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await reviewService.list(Number(req.params.id), req.query) });
});
const listEligibleOrderItems = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await reviewService.listEligibleOrderItems(Number(req.params.id), req.user.id),
  });
});
const create = asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    data: await reviewService.create(Number(req.params.id), req.user.id, req.body),
  });
});
const respond = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await reviewService.respond(Number(req.params.reviewId), req.user.id, req.body.response),
  });
});

module.exports = { list, listEligibleOrderItems, create, respond };
