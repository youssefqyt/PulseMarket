const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { validate } = require("../middleware/common");
const { authLimiter } = require("../middleware/rateLimiter");
const { requireAuth } = require("../middleware/auth");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
} = require("../validators/auth.validator");

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), controller.register);
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(refreshSchema.partial()), controller.logout);
router.get("/me", requireAuth, controller.me);

module.exports = router;
