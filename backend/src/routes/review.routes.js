const { Router } = require("express");
const reviewController = require("../controllers/review.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/common");
const { createReviewSchema, sellerResponseSchema } = require("../validators/review.validator");

const router = Router();

router.get("/products/:id/reviews", reviewController.list);
router.get("/products/:id/reviews/eligible-items", requireAuth, reviewController.listEligibleOrderItems);
router.post("/products/:id/reviews", requireAuth, validate(createReviewSchema), reviewController.create);
router.patch(
  "/reviews/:reviewId/response",
  requireAuth,
  requireRole("seller", "admin"),
  validate(sellerResponseSchema),
  reviewController.respond
);

module.exports = router;
