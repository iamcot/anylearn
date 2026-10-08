-- ================================================================
-- cleanup_orders.sql
-- Dọn sạch orders + order_details + pending_reg để test checkout
-- ⚠️  CHỈ chạy trên DEV/local
-- ================================================================

-- Thứ tự: transactions → order_details → orders → item_user_actions

-- 1. Xóa transactions gắn với order_details
DELETE t FROM transactions t
JOIN order_details od ON t.order_id = od.id
WHERE t.type IN ('partner','commission','commission_add','exchange','foundation','net_revenue');

-- 2. Xóa transactions gắn với orders (exchange dùng order.id)
DELETE t FROM transactions t
JOIN orders o ON t.order_id = o.id
WHERE t.type = 'exchange';

-- 3. Xóa pending_reg và reg actions
DELETE FROM item_user_actions
WHERE type IN ('pending_reg', 'reg');

-- 4. Xóa order_details
DELETE FROM order_details;

-- 5. Xóa orders
DELETE FROM orders;

-- 6. Reset wallet_c
UPDATE users SET wallet_c = 0;

-- ── Verify ──────────────────────────────────────────────────────
SELECT COUNT(*) AS orders         FROM orders;
SELECT COUNT(*) AS order_details  FROM order_details;
SELECT COUNT(*) AS anypoint_txs   FROM transactions WHERE type IN ('partner','commission','exchange','foundation','net_revenue');
SELECT COUNT(*) AS pending_reg    FROM item_user_actions WHERE type IN ('pending_reg','reg');
SELECT COUNT(*) AS wallet_nonzero FROM users WHERE wallet_c != 0;
-- Tất cả kỳ vọng: 0
