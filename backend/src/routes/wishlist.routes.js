const { Router } = require("express");
const controller = require("../controllers/wishlist.controller");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { priceAlertSchema } = require("../validators/wishlist.validator");

const router = Router();

router.get("/shared/:token", controller.getShared);
router.get("/price-alerts", requireAuth, controller.listAlerts);
router.post("/price-alerts/:productId", requireAuth, validate(priceAlertSchema), controller.setAlert);
router.delete("/price-alerts/:productId", requireAuth, controller.removeAlert);
router.post("/share", requireAuth, controller.createShare);

module.exports = router;
