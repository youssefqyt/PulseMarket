const { Router } = require("express");
const controller = require("../controllers/order.controller");
const { validate } = require("../middleware/common");
const { requireAuth } = require("../middleware/auth");
const { createOrderSchema } = require("../validators/cart.validator");

const router = Router();

router.use(requireAuth);

router.post("/", validate(createOrderSchema), controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);

module.exports = router;
