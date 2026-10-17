/**
 * Loads 02_seed.sql into the database.
 *
 *   npm run seed
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const config = require("../config");

const SEED_FILE = path.join(__dirname, "../../../database/02_seed.sql");

(async () => {
  const client = new Client(
    config.db.connectionString
      ? { connectionString: config.db.connectionString }
      : {
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
        }
  );
  try {
    await client.connect();
    console.log("[seed] loading 02_seed.sql ...");
    await client.query(fs.readFileSync(SEED_FILE, "utf8"));
    console.log("[seed] demo data inserted ✅");
    console.log("[seed] login with: buyer@pulsemarket.dev / Password123!");
    process.exit(0);
  } catch (err) {
    console.error("[seed] FAILED:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
