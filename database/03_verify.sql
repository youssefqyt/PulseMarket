# ============================================================
#  PulseMarket - Step 03 : Verification
#
#  Run this after 01_migration.sql and 02_seed.sql to prove
#  the database is set up correctly. Every query should return
#  a sensible count.
# ============================================================

SELECT 'users'         AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'categories',  COUNT(*) FROM categories
UNION ALL SELECT 'products',    COUNT(*) FROM products
UNION ALL SELECT 'favorites',   COUNT(*) FROM favorites
UNION ALL SELECT 'cart_items',  COUNT(*) FROM cart_items
UNION ALL SELECT 'orders',      COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
UNION ALL SELECT 'notifications',  COUNT(*) FROM notifications
ORDER BY table_name;

-- Preview the seeded catalog joined with its category + seller.
SELECT p.id, p.title, c.name AS category, u.email AS seller, p.price, p.stock
FROM products p
JOIN categories c ON c.id = p.category_id
JOIN users u      ON u.id = p.seller_id
ORDER BY p.id;
