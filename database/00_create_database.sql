-- ============================================================
--  PulseMarket - Step 00
--  Create the database.
--
--  Run this ONCE while connected to the default "postgres"
--  database (pgAdmin -> postgres -> Query Tool, or psql).
-- ============================================================

-- Create the application database.
-- (Postgres has no "CREATE DATABASE IF NOT EXISTS", so if it
--  already exists you will get an error — that is safe to ignore.)
CREATE DATABASE pulsemarket
    WITH ENCODING 'UTF8'
    TEMPLATE template0;
