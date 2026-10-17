const { Pool } = require("pg");
const config = require("./index");

/**
 * A single shared PostgreSQL connection pool for the whole process.
 */
const pool = new Pool(
  config.db.connectionString
    ? { connectionString: config.db.connectionString, max: config.db.max }
    : config.db
);

pool.on("error", (err) => {
  console.error("[db] unexpected idle client error:", err.message);
});

/**
 * Run a parameterised query.
 * ALWAYS pass user input through $1, $2 ... to avoid SQL injection.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "test" && duration > 200) {
    console.warn(`[db] slow query (${duration}ms): ${text.replace(/\s+/g, " ").slice(0, 120)}`);
  }
  return result;
}

/**
 * Run several queries inside a transaction.
 * Usage:
 *   const order = await withTransaction(async (client) => { ... });
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Lightweight connectivity probe used by /ready and /health. */
async function healthCheck() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, query, withTransaction, healthCheck };
