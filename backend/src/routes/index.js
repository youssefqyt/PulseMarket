const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "PulseMarket API",
      version: "1.0.0",
      endpoints: {
        auth: "/api/auth",
        products: "/api/products",
        categories: "/api/categories",
        favorites: "/api/favorites",
        cart: "/api/cart",
        orders: "/api/orders",
        notifications: "/api/notifications",
        settings: "/api/settings",
        admin: "/api/admin",
        seller: "/api/seller",
        payments: "/api/payments",
        wishlist: "/api/wishlist",
      },
    },
  });
});

router.use("/auth", require("./auth.routes"));
router.use("/products", require("./product.routes"));
router.use("/categories", require("./category.routes"));
router.use("/favorites", require("./favorite.routes"));
router.use("/cart", require("./cart.routes"));
router.use("/orders", require("./order.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/favorites", require("./wishlist.routes"));
router.use("/wishlist", require("./wishlist.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/seller", require("./seller.routes"));
router.use("/payments", require("./payment.routes"));
router.use("/", require("./review.routes"));

module.exports = router;
