const { z } = require("zod");

const priceAlertSchema = z.object({
  targetPrice: z.coerce.number().positive(),
});

module.exports = { priceAlertSchema };
