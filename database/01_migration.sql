-- ============================================================
--  PulseMarket - Step 01 : Schema migration
--
--  Run this while connected to the "pulsemarket" database.
--  It is idempotent enough to re-run on a fresh database.
-- ============================================================

-- Required for UUID-ish helpers and bcrypt password hashing (crypt/gen_salt).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
--  users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120)  NOT NULL,
    email         VARCHAR(180)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'seller', 'admin')),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL,
    slug       VARCHAR(80)  NOT NULL UNIQUE,
    icon       VARCHAR(40),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    seller_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
    title       VARCHAR(180)  NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url   TEXT,
    stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller   ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);

-- Full-text-ish search helper (simple trigram-free ILIKE index on title)
CREATE INDEX IF NOT EXISTS idx_products_title_lower ON products (lower(title));

-- ------------------------------------------------------------
--  favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ------------------------------------------------------------
--  cart_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ------------------------------------------------------------
--  orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    buyer_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           VARCHAR(20)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
    payment_method   VARCHAR(50)   NOT NULL DEFAULT 'card',
    total            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    shipping_address TEXT,
    phone            VARCHAR(50),
    delivery_notes   TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Idempotent column additions for existing installations
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
UPDATE orders SET payment_method = 'card' WHERE payment_method IS NULL;
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'card';
ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);

-- ------------------------------------------------------------
--  user_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    user_id               INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    currency              VARCHAR(3)  NOT NULL DEFAULT 'USD'
                          CHECK (currency IN ('USD', 'EUR', 'TND', 'GBP')),
    language              VARCHAR(2)  NOT NULL DEFAULT 'en'
                          CHECK (language IN ('en', 'fr', 'ar')),
    push_notifications    BOOLEAN     NOT NULL DEFAULT TRUE,
    email_notifications   BOOLEAN     NOT NULL DEFAULT TRUE,
    sms_notifications     BOOLEAN     NOT NULL DEFAULT FALSE,
    default_address       TEXT        NOT NULL DEFAULT '',
    phone                 VARCHAR(50) NOT NULL DEFAULT '',
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
--  order_items
--  (price/title are snapshotted so history is immutable)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER       REFERENCES products(id) ON DELETE SET NULL,
    seller_id  INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    title      VARCHAR(180)  NOT NULL,
    price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity   INTEGER       NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ------------------------------------------------------------
--  refresh_tokens
--  (store a hash of the token, never the raw value)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

-- ------------------------------------------------------------
--  notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(180) NOT NULL,
    body       TEXT,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ------------------------------------------------------------
--  updated_at auto-touch trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated    ON users;
CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated   ON orders;
CREATE TRIGGER trg_orders_updated   BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
