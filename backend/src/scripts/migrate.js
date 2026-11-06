/**
 * Creates the database (if missing) and applies the baseline and marketplace migrations.
 *
 *   npm run migrate
 *
 * Reads the SQL from ../database so the schema has a single source of truth.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const config = require("../config");

const DB_DIR = path.join(__dirname, "../../../database");

function readSql(name) {
  return fs.readFileSync(path.join(DB_DIR, name), "utf8");
}

async function ensureDatabase() {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: "postgres", // connect to the maintenance DB
  });
  await client.connect();
  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [config.db.database]
  );
  if (rows.length === 0) {
    // Identifier cannot be parameterised; quote it safely.
    await client.query(`CREATE DATABASE "${config.db.database}"`);
    console.log(`[migrate] created database "${config.db.database}"`);
  } else {
    console.log(`[migrate] database "${config.db.database}" already exists`);
  }
  await client.end();
}

async function applyMigration() {
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
  await client.connect();
  console.log("[migrate] applying 01_migration.sql ...");
  await client.query(readSql("01_migration.sql"));
  console.log("[migrate] schema is up to date ✅");
  await client.end();
}

(async () => {
  try {
    await ensureDatabase();
    await applyMigration();
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
    await client.connect();
    console.log("[migrate] applying 04_marketplace_expansion.sql ...");
    await client.query(readSql("04_marketplace_expansion.sql"));
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("[migrate] FAILED:", err.message);
    process.exit(1);
  }
})();
