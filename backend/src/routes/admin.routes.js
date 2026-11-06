const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { updateProductSchema } = require("../validators/product.validator");

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/summary", adminController.summary);
router.get("/trends", adminController.trends);
router.get("/users", adminController.users);
router.patch("/users/:id", validate(require("../validators/admin.validator").updateUserSchema), adminController.updateUser);
router.get("/audit", adminController.audit);
router.get("/products", adminController.products);
router.patch(
  "/products/:id",
  validate(updateProductSchema),
  adminController.updateProduct
);
router.get("/orders", adminController.orders);

module.exports = router;
