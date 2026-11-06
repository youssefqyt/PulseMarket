const { z } = require("zod");

const sellerFulfillmentSchema = z.object({
  status: z.enum(["shipped", "completed"]).optional(),
  trackingNumber: z.string().trim().min(3).max(120).optional(),
  carrier: z.string().trim().min(2).max(120).optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one fulfillment field is required",
});

module.exports = { sellerFulfillmentSchema };
