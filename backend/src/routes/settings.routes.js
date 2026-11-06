const { Router } = require("express");
const controller = require("../controllers/settings.controller");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { settingsSchema } = require("../validators/settings.validator");

const router = Router();

router.use(requireAuth);
router.get("/", controller.get);
router.patch("/", validate(settingsSchema), controller.update);

module.exports = router;
