const request = require("supertest");
const app = require("../src/app");

describe("Health & observability endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("pulsemarket-api");
  });

  it("GET /api returns service metadata", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toMatch(/PulseMarket/);
  });

  it("GET /metrics returns Prometheus text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http_requests_total");
  });

  it("unknown routes return 404 in the standard error shape", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBeDefined();
  });
});
