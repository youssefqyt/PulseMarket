// Temporary end-to-end smoke test of the whole API against the real DB.
const app = require("./src/app");
const redis = require("./src/config/redis");

const BASE = "http://localhost:5099";

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const server = app.listen(5099, async () => {
  const results = [];
  const check = (name, ok, extra = "") =>
    results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  ->  " + extra : ""}`);

  try {
    await redis.initRedis();

    // 1. Login with the seeded buyer.
    const login = await call("POST", "/api/auth/login", {
      body: { email: "buyer@pulsemarket.dev", password: "Password123!" },
    });
    const token = login.json?.data?.accessToken;
    const refresh = login.json?.data?.refreshToken;
    check("login (seeded buyer)", login.status === 200 && !!token, login.status);

    // 2. List products (public).
    const products = await call("GET", "/api/products?limit=5");
    const first = products.json?.data?.items?.[0];
    check(
      "GET /api/products",
      products.status === 200 && products.json.data.pagination.total > 0,
      `total=${products.json?.data?.pagination?.total}`
    );

    // 3. Search.
    const search = await call("GET", "/api/products?q=headphones");
    check("search products", search.status === 200, `${search.json?.data?.items?.length} hit(s)`);

    // 4. Categories with counts.
    const cats = await call("GET", "/api/categories?withCounts=true");
    check("GET /api/categories", cats.status === 200 && cats.json.data.length > 0, `${cats.json?.data?.length} categories`);

    // 5. Product detail.
    const detail = await call("GET", `/api/products/${first.id}`);
    check("GET /api/products/:id", detail.status === 200, detail.json?.data?.title);

    // 6. Protected route without token.
    const noAuth = await call("GET", "/api/cart");
    check("cart requires auth", noAuth.status === 401, noAuth.status);

    // 7. Favorite toggle.
    const fav = await call("POST", "/api/favorites", { token, body: { productId: first.id } });
    check("POST /api/favorites", fav.status === 201, fav.status);
    const favs = await call("GET", "/api/favorites", { token });
    check("GET /api/favorites", favs.status === 200, `${favs.json?.data?.items?.length} favorite(s)`);

    // 8. Add to cart.
    const addCart = await call("POST", "/api/cart", {
      token,
      body: { productId: first.id, quantity: 2 },
    });
    check("POST /api/cart", addCart.status === 201, JSON.stringify(addCart.json?.data?.total));

    // 9. Cart totals.
    const cart = await call("GET", "/api/cart", { token });
    check("GET /api/cart", cart.status === 200 && cart.json.data.itemCount > 0, `total=${cart.json?.data?.total}`);

    // 10. Create order (transactional stock decrement + cart clear).
    const order = await call("POST", "/api/orders", {
      token,
      body: { shippingAddress: "12 Avenue Habib Bourguiba, Tunis" },
    });
    check("POST /api/orders", order.status === 201 && order.json.data.items.length > 0,
      JSON.stringify({ id: order.json?.data?.id, total: order.json?.data?.total, status: order.json?.data?.status }));

    // 11. Cart is empty after ordering.
    const cartAfter = await call("GET", "/api/cart", { token });
    check("cart cleared after order", cartAfter.json?.data?.itemCount === 0, `itemCount=${cartAfter.json?.data?.itemCount}`);

    // 12. Stock decremented.
    const detailAfter = await call("GET", `/api/products/${first.id}`);
    check("stock decremented", detailAfter.json.data.stock === detail.json.data.stock - 2,
      `${detail.json.data.stock} -> ${detailAfter.json.data.stock}`);

    // 13. Orders list.
    const orders = await call("GET", "/api/orders", { token });
    check("GET /api/orders", orders.status === 200 && orders.json.data.items.length > 0, `${orders.json?.data?.items?.length} order(s)`);

    // 14. Refresh-token rotation.
    const refreshed = await call("POST", "/api/auth/refresh", { body: { refreshToken: refresh } });
    check("POST /api/auth/refresh (rotation)", refreshed.status === 200 && !!refreshed.json.data.accessToken, refreshed.status);

    // 15. Old refresh token is now revoked.
    const reuse = await call("POST", "/api/auth/refresh", { body: { refreshToken: refresh } });
    check("old refresh token revoked", reuse.status === 401, reuse.status);

    // 16. Register a brand-new user.
    const newEmail = `user${Date.now()}@example.com`;
    const reg = await call("POST", "/api/auth/register", {
      body: { name: "New Tester", email: newEmail, password: "Password123!" },
    });
    check("POST /api/auth/register", reg.status === 201 && reg.json.data.user.email === newEmail, reg.status);
  } catch (e) {
    results.push(`FAIL  exception: ${e.message}`);
  } finally {
    const out = ["\n================ E2E RESULTS ================", ...results].join("\n");
    const failed = results.filter((r) => r.startsWith("FAIL")).length;
    const summary = `\n${results.length - failed}/${results.length} checks passed\n`;
    require("fs").writeFileSync("e2e-results.txt", out + summary);
    console.log(out + summary);
    await redis.closeRedis().catch(() => {});
    server.closeAllConnections?.();
    process.exit(failed === 0 ? 0 : 1);
  }
});
