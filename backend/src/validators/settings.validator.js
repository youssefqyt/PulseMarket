const { z } = require("zod");

const settingsSchema = z
  .object({
    currency: z.enum(["USD", "EUR", "TND", "GBP"]).optional(),
    language: z.enum(["en", "fr", "ar"]).optional(),
    pushNotifications: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    defaultAddress: z.string().trim().max(500).optional(),
    phone: z.string().trim().max(50).optional(),
  })
  .refine((settings) => Object.keys(settings).length > 0, {
    message: "At least one setting is required",
  });

module.exports = { settingsSchema };
