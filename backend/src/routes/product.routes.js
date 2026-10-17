const { Router } = require("express");
const controller = require("../controllers/product.controller");
const { validate } = require("../middleware/common");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} = require("../validators/product.validator");

const router = Router();

router.get("/", optionalAuth, validate(listProductsQuerySchema, "query"), controller.list);
router.get("/:id", controller.getById);

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
