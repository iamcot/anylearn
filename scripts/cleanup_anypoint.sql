-- ================================================================
-- cleanup_anypoint.sql
-- Dọn sạch toàn bộ dữ liệu anyPoint để test engine từ đầu
-- ⚠️  CHỈ chạy trên DEV/local — KHÔNG chạy trên production
-- ================================================================

-- 1. Xóa transactions anyPoint (tất cả type liên quan đến engine)
DELETE FROM transactions;

-- 2. Reset wallet_c về 0
UPDATE users SET wallet_c = 0;

-- ── Verify ──────────────────────────────────────────────────────
SELECT COUNT(*) AS remaining_anypoint_txs
FROM transactions
WHERE type IN ('partner','commission','commission_add','exchange','withdraw','foundation','net_revenue');
-- Kỳ vọng: 0

SELECT COUNT(*) AS users_nonzero_wallet_c
FROM users WHERE wallet_c != 0;
-- Kỳ vọng: 0
