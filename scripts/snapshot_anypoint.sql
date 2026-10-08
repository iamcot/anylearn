-- ================================================================
-- snapshot_anypoint.sql
-- Xem trạng thái anyPoint hiện tại trước/sau khi test
-- An toàn: chỉ SELECT, không thay đổi data
-- ================================================================

-- Tổng quan wallet_c
SELECT
    role,
    COUNT(*)               AS users,
    SUM(wallet_c)          AS total_wallet_c,
    SUM(wallet_c) * 1000   AS equivalent_vnd
FROM users
GROUP BY role
ORDER BY total_wallet_c DESC;

-- Breakdown transactions theo type + status
SELECT
    type,
    status,
    COUNT(*)       AS count,
    SUM(amount)    AS total_amount
FROM transactions
WHERE type IN ('partner','commission','commission_add','exchange','withdraw','foundation','net_revenue')
GROUP BY type, status
ORDER BY type, status;

-- Pending chưa duyệt
SELECT
    t.type,
    COUNT(*)    AS count,
    SUM(amount) AS pending_amount
FROM transactions t
WHERE t.status = 0
  AND t.type IN ('partner','commission','withdraw')
GROUP BY t.type;

-- Doanh thu ròng cty đã duyệt (VND)
SELECT COALESCE(SUM(amount), 0) AS company_revenue_vnd
FROM transactions
WHERE type = 'net_revenue' AND status = 1;

-- Quỹ foundation đã duyệt (anyPoints)
SELECT COALESCE(SUM(amount), 0) AS foundation_points
FROM transactions
WHERE type = 'foundation' AND status = 1;

-- Kiểm toán nhanh: wallet_c vs sum giao dịch
SELECT
    u.id,
    u.name,
    u.role,
    u.wallet_c,
    COALESCE(SUM(CASE WHEN t.type IN ('partner','commission','commission_add','exchange','withdraw') THEN t.amount ELSE 0 END), 0) AS tx_sum,
    u.wallet_c - COALESCE(SUM(CASE WHEN t.type IN ('partner','commission','commission_add','exchange','withdraw') THEN t.amount ELSE 0 END), 0) AS delta
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id AND t.status = 1
GROUP BY u.id, u.name, u.role, u.wallet_c
HAVING delta != 0;
-- Kỳ vọng: 0 rows nếu hệ thống nhất quán
