const { Router } = require("express");
const controller = require("../controllers/cart.controller");
const { validate } = require("../middleware/common");
const { requireAuth } = require("../middleware/auth");
const { addToCartSchema, updateCartSchema } = require("../validators/cart.validator");

const router = Router();

router.use(requireAuth);

router.get("/", controller.get);
router.post("/", validate(addToCartSchema), controller.add);
router.put("/:productId", validate(updateCartSchema), controller.update);
router.delete("/:productId", controller.remove);
router.delete("/", controller.clear);

module.exports = router;
