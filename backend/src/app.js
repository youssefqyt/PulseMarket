const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const config = require("./config");
const logger = require("./config/logger");
const { healthCheck } = require("./config/db");
const redis = require("./config/redis");
const { metricsMiddleware, render: renderMetrics } = require("./config/metrics");
const { apiLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/common");
const routes = require("./routes");
const paymentController = require("./controllers/payment.controller");

const app = express();

// ---- Security & platform middleware -------------------------------
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(","),
    credentials: true,
  })
);
app.post(
  "/api/payments/webhook",
  apiLimiter,
  express.raw({ type: "application/json", limit: "1mb" }),
  paymentController.webhook
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ---- Observability --------------------------------------------------
if (config.env !== "test") {
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      logger.info("http_request", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - start) / 1e6,
      });
    });
    next();
  });
}
app.use(metricsMiddleware);

// ---- Rate limiting --------------------------------------------------
app.use("/api", apiLimiter);

// ---- Health & observability ----------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "pulsemarket-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (req, res) => {
  const dbOk = await healthCheck();
  const redisOk = redis.isConnected();
  const ready = dbOk; // DB is required; Redis is best-effort
  res.status(ready ? 200 : 503).json({
    api: true,
    database: dbOk ? "connected" : "disconnected",
    redis: redisOk ? "connected" : "disconnected",
  });
});

app.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(renderMetrics());
});

// ---- API ------------------------------------------------------------
app.use("/api", routes);

// ---- Fallbacks ------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
