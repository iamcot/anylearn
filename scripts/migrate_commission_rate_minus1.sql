-- Migration: commission_rate = -1 → 1.0
-- Lý do: -1 là magic number cũ với nghĩa "không phân phối anyPoint, công ty giữ hết".
--        Nghĩa đúng cho "thu hộ toàn bộ cho đối tác" là 1.0 (100%).
--        Sau migration, -1 sẽ không còn được sử dụng.
--
-- Chạy trên prod: kiểm tra trước (SELECT), rồi mới UPDATE.

-- 1. Xem danh sách items bị ảnh hưởng
SELECT id, title, commission_rate
FROM items
WHERE commission_rate = -1
ORDER BY id;

-- 2. Chạy migration
UPDATE items
SET commission_rate = 1.0
WHERE commission_rate = -1;

-- 3. Verify
SELECT COUNT(*) AS still_minus_one FROM items WHERE commission_rate = -1;
-- Kỳ vọng: 0
