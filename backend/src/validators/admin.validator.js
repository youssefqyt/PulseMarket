const { z } = require("zod");

const updateUserSchema = z.object({
  role: z.enum(["user", "seller"]).optional(),
  sellerStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  isSuspended: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one account field is required",
});

module.exports = { updateUserSchema };
