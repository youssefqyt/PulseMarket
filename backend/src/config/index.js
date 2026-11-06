require("dotenv").config();

/**
 * Central, validated configuration.
 * Every other module reads settings from here, never from process.env directly.
 */

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    // In production we refuse to boot with missing secrets.
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback;
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",

  db: {
    // A full connection string wins; otherwise build from parts.
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "pulsemarket",
    // Small pool good enough for local dev; tune for production.
    max: parseInt(process.env.PG_POOL_MAX || "10", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    successUrl: process.env.STRIPE_SUCCESS_URL || "pulsemarket://payment-result?result=success&session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: process.env.STRIPE_CANCEL_URL || "pulsemarket://payment-result?result=cancelled",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },

  logLevel: process.env.LOG_LEVEL || "info",
};

module.exports = config;
