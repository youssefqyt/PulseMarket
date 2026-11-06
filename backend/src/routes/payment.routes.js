const { Router } = require("express");
const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { createOrderSchema } = require("../validators/cart.validator");

const router = Router();

router.post("/checkout-session", requireAuth, validate(createOrderSchema), paymentController.createSession);
router.get("/sessions/:sessionId", requireAuth, paymentController.status);

module.exports = router;
