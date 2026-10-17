const { Router } = require("express");
const controller = require("../controllers/favorite.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.get("/", requireAuth, controller.list);
router.post("/", requireAuth, controller.add);
router.delete("/:id", requireAuth, controller.remove);

module.exports = router;
