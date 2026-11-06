const { Router } = require("express");
const controller = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.patch("/:id/read", controller.markRead);
router.post("/read-all", controller.markAllRead);

module.exports = router;

