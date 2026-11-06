const { z } = require("zod");

const createReviewSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(1).max(3000),
});

const sellerResponseSchema = z.object({
  response: z.string().trim().min(1).max(3000),
});

module.exports = { createReviewSchema, sellerResponseSchema };
