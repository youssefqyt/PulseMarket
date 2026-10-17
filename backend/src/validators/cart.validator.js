const { z } = require("zod");

const addToCartSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

const updateCartSchema = z.object({
  quantity: z.coerce.number().int().positive().max(99),
});

const createOrderSchema = z.object({
  shippingAddress: z.string().trim().min(5, "Shipping address is required").max(500),
  // Optional: order specific items directly instead of the whole cart.
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(99),
      })
    )
    .optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "completed", "cancelled"]),
});

module.exports = {
  addToCartSchema,
  updateCartSchema,
  createOrderSchema,
  updateOrderStatusSchema,
};
