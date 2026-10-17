const request = require("supertest");
const app = require("../src/app");

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

  it("rejects product creation without a token", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ title: "Thing", price: 10 });
    expect(res.status).toBe(401);
  });
});
