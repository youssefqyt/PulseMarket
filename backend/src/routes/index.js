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

module.exports = router;
