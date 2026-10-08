-- ============================================================
-- Reset wallet_c và xóa tất cả giao dịch điểm
-- Chạy TRƯỚC khi launch tính năng anyPoint mới
-- ⚠️  KHÔNG chạy trên production đang có data thật
-- ============================================================

-- 1. Xóa tất cả transactions liên quan đến wallet_c
DELETE FROM transactions
WHERE type IN ('partner', 'commission', 'commission_add', 'exchange', 'withdraw', 'foundation');

-- 2. Reset wallet_c về 0 cho tất cả user
UPDATE users SET wallet_c = 0;

-- 3. Kiểm tra sau khi reset (chạy để confirm)
SELECT COUNT(*) AS remaining_wallet_c_txs
FROM transactions
WHERE type IN ('partner', 'commission', 'commission_add', 'exchange', 'withdraw', 'foundation');

SELECT COUNT(*) AS users_with_nonzero_wallet_c
FROM users WHERE wallet_c != 0;
