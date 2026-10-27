-- ================================================================
-- prod_export_gaps.sql  (CHỈ ĐỌC, không sửa dữ liệu)
-- Xuất các khóa đang hiển thị còn thiếu tuổi / lĩnh vực / tag / số buổi, kèm đoạn mô tả, để người (hoặc Claude)
-- đọc rồi soạn file cập nhật. Chạy SAU khi đã chạy prod_normalize_courses.sql.
--
--   mysql -uROOT -p --batch --raw --default-character-set=utf8mb4 anylearn < scripts/prod_export_gaps.sql > gaps.tsv
-- Mỗi truy vấn bắt đầu bằng dòng tiêu đề cột: G1 = danh sách lĩnh vực, G2 = danh sách tag, G3 = các khóa cần bổ sung.
-- ================================================================
SET NAMES utf8mb4;

-- G1. Lĩnh vực (categories) đang dùng
SELECT c.id AS category_id, c.title, (SELECT COUNT(*) FROM items_categories ic WHERE ic.category_id = c.id) AS items
FROM categories c WHERE c.status = 1 ORDER BY c.title;

-- G2. Tag (chỉ tag đang bật)
SELECT t.id AS tag_id, t.name, t.tag_group FROM tags t WHERE t.status = 1 ORDER BY t.tag_group, t.sort_order, t.name;

-- G3. Khóa đang hiển thị thiếu ít nhất một trong: tuổi, lĩnh vực, tag, số buổi
SELECT
  i.id, i.title, i.subtype, i.price, i.cycle_type, i.cycle_amount, i.ages_min, i.ages_max,
  (SELECT GROUP_CONCAT(c.id ORDER BY c.id) FROM items_categories ic JOIN categories c ON c.id = ic.category_id WHERE ic.item_id = i.id) AS category_ids,
  (SELECT GROUP_CONCAT(t.id ORDER BY t.id) FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.status = 1) AS tag_ids,
  (i.ages_min IS NULL AND i.ages_max IS NULL) AS gap_ages,
  NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id) AS gap_category,
  NOT EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.status = 1) AS gap_tags,
  (COALESCE(i.subtype,'') NOT IN ('digital','video') AND (i.cycle_type IS NULL OR i.cycle_amount IS NULL OR i.cycle_amount <= 0)) AS gap_sessions,
  LEFT(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(COALESCE(i.short_content, ''), ' ', COALESCE(i.content, '')), '<[^>]+>', ' '), '&nbsp;', ' '), '[[:space:]]+', ' ')), 600) AS description
FROM items i
JOIN users u ON u.id = i.user_id
WHERE i.is_test = 0 AND i.status = 1 AND i.user_status = 1 AND COALESCE(i.is_paymentfee, 0) = 0
  AND (
    (i.ages_min IS NULL AND i.ages_max IS NULL)
    OR NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id)
    OR NOT EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.status = 1)
    OR (COALESCE(i.subtype,'') NOT IN ('digital','video') AND (i.cycle_type IS NULL OR i.cycle_amount IS NULL OR i.cycle_amount <= 0))
  )
ORDER BY i.id;
