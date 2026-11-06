const { Router } = require("express");
const sellerController = require("../controllers/seller.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { sellerFulfillmentSchema } = require("../validators/seller.validator");

const router = Router();

router.use(requireAuth, requireRole("seller", "admin"));
router.get("/orders", sellerController.orders);
router.get("/analytics", sellerController.analytics);
router.patch("/orders/:id/fulfillment", validate(sellerFulfillmentSchema), sellerController.fulfill);

module.exports = router;
