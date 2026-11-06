const { Router } = require("express");
const controller = require("../controllers/product.controller");
const { uploadProductImages } = require("../middleware/imageUpload");
const { validate } = require("../middleware/common");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  suggestQuerySchema,
  deleteProductImageParamsSchema,
} = require("../validators/product.validator");

const router = Router();

router.get("/", optionalAuth, validate(listProductsQuerySchema, "query"), controller.list);
router.get("/suggest", validate(suggestQuerySchema, "query"), controller.suggest);
router.get("/mine", requireAuth, requireRole("seller", "admin"), controller.listMine);
router.get("/:id", controller.getById);
router.post(
  "/:id/images",
  requireAuth,
  requireRole("seller", "admin"),
  uploadProductImages,
  controller.uploadImages
);
router.delete(
  "/:id/images/:imageId",
  requireAuth,
  requireRole("seller", "admin"),
  validate(deleteProductImageParamsSchema, "params"),
  controller.deleteImage
);

router.post(
  "/",
  requireAuth,
  requireRole("seller", "admin"),
  validate(createProductSchema),
  controller.create
);
router.put(
  "/:id",
  requireAuth,
  requireRole("seller", "admin"),
  validate(updateProductSchema),
  controller.update
);
router.delete("/:id", requireAuth, requireRole("seller", "admin"), controller.remove);

module.exports = router;
