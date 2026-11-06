const { z } = require("zod");

const createProductSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(180),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().nonnegative("Price must be >= 0"),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  imageUrl: z.string().trim().url("imageUrl must be a valid URL").optional().nullable(),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().max(100000).optional(),
});

const updateProductSchema = createProductSchema.partial();

const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  sellerId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popularity", "rating"]).optional(),
});

const suggestQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().positive().max(10).optional(),
});

const deleteProductImageParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  suggestQuerySchema,
  deleteProductImageParamsSchema,
};
