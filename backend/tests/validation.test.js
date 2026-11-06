const request = require("supertest");
const app = require("../src/app");
const { settingsSchema } = require("../src/validators/settings.validator");
const { createOrderSchema } = require("../src/validators/cart.validator");
const { createReviewSchema } = require("../src/validators/review.validator");
const { createProductSchema } = require("../src/validators/product.validator");
const orderService = require("../src/services/order.service");

/**
 * These tests exercise the validation middleware and never touch the DB,
 * so they run anywhere (CI included) without a PostgreSQL instance.
 */
describe("Auth validation", () => {
  it("rejects registration with an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "not-an-email", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details[0].field).toBe("email");
  });

  it("rejects registration with a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "a@b.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("password");
  });

  it("rejects login without a password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});

describe("Protected routes", () => {
  it("rejects cart access without a token", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("rejects user settings access without a token", async () => {
    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(401);
  });

  it("rejects admin dashboard access without a token", async () => {
    const res = await request(app).get("/api/admin/summary");
    expect(res.status).toBe(401);
  });

  it("rejects seller listing access without a token", async () => {
    const res = await request(app).get("/api/products/mine");
    expect(res.status).toBe(401);
  });

  it("rejects product creation without a token", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ title: "Thing", price: 10 });
    expect(res.status).toBe(401);
  });
});

describe("User settings validation", () => {
  it("accepts partial updates and rejects empty updates", () => {
    expect(settingsSchema.safeParse({ currency: "EUR" }).success).toBe(true);
    expect(settingsSchema.safeParse({}).success).toBe(false);
    expect(settingsSchema.safeParse({ currency: "JPY" }).success).toBe(false);
  });
});

describe("Marketplace validation", () => {
  it("only accepts supported payment methods", () => {
    const base = { shippingAddress: "1 Market Street" };
    expect(createOrderSchema.safeParse({ ...base, paymentMethod: "cash" }).success).toBe(true);
    expect(createOrderSchema.safeParse({ ...base, paymentMethod: "wallet" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...base, paymentMethod: "transfer" }).success).toBe(false);
  });

  it("does not allow an unverified card order through the direct orders service", async () => {
    await expect(orderService.createOrder(1, {
      shippingAddress: "1 Market Street",
      paymentMethod: "card",
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("validates low-stock thresholds and verified-review content", () => {
    const product = { title: "Test product", price: 12, stock: 4, lowStockThreshold: 0 };
    expect(createProductSchema.safeParse(product).success).toBe(true);
    expect(createProductSchema.safeParse({ ...product, lowStockThreshold: -1 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ orderItemId: 1, rating: 5, body: "Good quality" }).success).toBe(true);
    expect(createReviewSchema.safeParse({ orderItemId: 1, rating: 6, body: "Too high" }).success).toBe(false);
  });
});
