-- ============================================================
--  PulseMarket - Step 02 : Seed data
--
--  Run while connected to the "pulsemarket" database,
--  AFTER 01_migration.sql.
--
--  Demo accounts (password for ALL of them is: Password123! )
--    seller@pulsemarket.dev
--    buyer@pulsemarket.dev
--    admin@pulsemarket.dev
--
--  Passwords are hashed with pgcrypto's bcrypt (gen_salt('bf')),
--  which is fully compatible with the backend's bcryptjs.
-- ============================================================

-- ------------------------------------------------------------
--  Categories
-- ------------------------------------------------------------
INSERT INTO categories (name, slug, icon) VALUES
    ('Electronics', 'electronics', 'devices'),
    ('Fashion',     'fashion',     'shirt'),
    ('Home',        'home',        'home'),
    ('Books',       'books',       'book'),
    ('Sports',      'sports',      'football'),
    ('Toys',        'toys',        'toy-brick'),
    ('Beauty',      'beauty',      'spa'),
    ('Gaming',      'gaming',      'gamepad')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
--  Users
-- ------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role)
VALUES
    ('Lina Seller', 'seller@pulsemarket.dev',
     crypt('Password123!', gen_salt('bf', 10)), 'seller'),
    ('Karim Buyer', 'buyer@pulsemarket.dev',
     crypt('Password123!', gen_salt('bf', 10)), 'user'),
    ('Admin User',  'admin@pulsemarket.dev',
     crypt('Password123!', gen_salt('bf', 10)), 'admin')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
--  Products (seller = seller@pulsemarket.dev)
-- ------------------------------------------------------------
INSERT INTO products (seller_id, category_id, title, description, price, image_url, stock)
SELECT
    (SELECT id FROM users WHERE email = 'seller@pulsemarket.dev'),
    c.id,
    p.title, p.description, p.price, p.image_url, p.stock
FROM (VALUES
    ('electronics', 'iPhone 13 Pro 256GB',
     'Excellent condition, battery health 91%, includes charger.',
     899.00, 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800', 4),
    ('electronics', 'Sony WH-1000XM4 Headphones',
     'Industry-leading noise cancelling wireless headphones.',
     249.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 12),
    ('electronics', 'Dell XPS 13 (2022)',
     'Intel i7, 16GB RAM, 512GB SSD. Light and powerful.',
     1150.00, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', 3),
    ('fashion', 'Leather Jacket - Black M',
     'Genuine leather, barely worn, size M.',
     120.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', 6),
    ('fashion', 'Running Sneakers - 42',
     'Brand new running shoes, size 42.',
     79.90, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 20),
    ('home', 'Minimalist Desk Lamp',
     'Warm light, USB powered, matte finish.',
     34.50, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 30),
    ('home', 'Ceramic Coffee Mug Set (4)',
     'Handmade ceramic mugs, dishwasher safe.',
     28.00, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 25),
    ('books', 'Clean Code - Robert C. Martin',
     'A handbook of agile software craftsmanship. Like new.',
     32.00, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', 10),
    ('sports', 'Yoga Mat Premium 6mm',
     'Non-slip, eco-friendly TPE mat with carry strap.',
     45.00, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', 15),
    ('gaming', 'PlayStation 5 DualSense Controller',
     'Official wireless controller, white, used twice.',
     59.00, 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800', 8),
    ('gaming', 'Mechanical Keyboard RGB TKL',
     'Cherry MX Red switches, hot-swappable, RGB.',
     89.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 14),
    ('beauty', 'Vitamin C Serum 30ml',
     'Brightening facial serum, sealed and new.',
     24.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 40)
) AS p(category_slug, title, description, price, image_url, stock)
JOIN categories c ON c.slug = p.category_slug
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
--  A few favorites for the demo buyer
-- ------------------------------------------------------------
INSERT INTO favorites (user_id, product_id)
SELECT
    (SELECT id FROM users WHERE email = 'buyer@pulsemarket.dev'),
    p.id
FROM products p
WHERE p.title IN ('Sony WH-1000XM4 Headphones', 'Running Sneakers - 42')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
--  A welcome notification for the demo buyer
-- ------------------------------------------------------------
INSERT INTO notifications (user_id, title, body)
SELECT id, 'Welcome to PulseMarket 🎉',
       'Browse the marketplace and add your favorite products.'
FROM users WHERE email = 'buyer@pulsemarket.dev';
