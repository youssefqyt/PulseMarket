const app = require("./app");
const config = require("./config");
const logger = require("./config/logger");
const { pool, healthCheck } = require("./config/db");
const redis = require("./config/redis");

async function start() {
  // Connect to Redis (optional in development).
  await redis.initRedis();

  const dbOk = await healthCheck();
  if (dbOk) {
    logger.info("database connected");
  } else {
    logger.warn("database NOT reachable - check your PostgreSQL settings in .env");
  }

  // Bind every interface so emulators and phones on the local network can reach the API.
  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(`PulseMarket API running on port ${config.port}`, {
      env: config.env,
      url: `http://localhost:${config.port}`,
    });
    console.log(`\n  PulseMarket API  ->  http://localhost:${config.port}`);
    console.log(`  Health           ->  http://localhost:${config.port}/health`);
    console.log(`  Ready            ->  http://localhost:${config.port}/ready`);
    console.log(`  Metrics          ->  http://localhost:${config.port}/metrics\n`);
  });

  // ---- Graceful shutdown -------------------------------------------
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await redis.closeRedis();
      await pool.end();
      logger.info("shutdown complete");
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
