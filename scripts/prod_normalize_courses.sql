-- ================================================================
-- prod_normalize_courses.sql
-- Tự điền các trường còn thiếu và chuẩn hóa dữ liệu khóa học trên prod.
--
-- AN TOÀN:
--   * Chạy file prod_export_courses.sql trước và lưu kết quả để đối chiếu.
--   * Cần MySQL 8.0 trở lên (dùng REGEXP_REPLACE / REGEXP_SUBSTR). Kiểm tra: SELECT VERSION();
--   * Phần A tạo bảng sao lưu (DDL nên không rollback được) và bảng nhật ký item_autofill_log.
--   * Phần B chạy trong MỘT giao dịch và KẾT THÚC BẰNG ROLLBACK. Chạy lần đầu để xem các bảng xem trước.
--     Hài lòng thì đổi dòng cuối ROLLBACK thành COMMIT rồi chạy lại từ phần B.
--   * Chạy trong giờ ít người dùng. Dữ liệu sửa là các cột của items, item_tags, items_categories,
--     item_locations, users.partner_type. Mọi dòng điền tự động được ghi vào item_autofill_log.
--   * Sau khi COMMIT: vào admin Cài đặt > Vận hành bấm "Chạy lại chỉ mục tìm kiếm" (POST /admin/reindex).
--
-- Chỉ điền khi luật rõ ràng (deterministic). Điều không chắc chắn (hình thức lạ, loại đối tác của giáo viên,
-- khóa có nhiều địa chỉ) chỉ được liệt kê ở bảng xem trước để người làm nội dung quyết định.
-- ================================================================

-- ---------------------------------------------------------------
-- A. Sao lưu và nhật ký (chạy một lần; đổi hậu tố _bak_n1 nếu chạy lần sau)
-- ---------------------------------------------------------------
CREATE TABLE items_bak_n1          AS SELECT * FROM items;
CREATE TABLE item_tags_bak_n1      AS SELECT * FROM item_tags;
CREATE TABLE items_categories_bak_n1 AS SELECT * FROM items_categories;
CREATE TABLE item_locations_bak_n1 AS SELECT * FROM item_locations;
CREATE TABLE users_partner_type_bak_n1 AS SELECT id, partner_type FROM users;

CREATE TABLE IF NOT EXISTS item_autofill_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch      VARCHAR(20)  NOT NULL,
  item_id    BIGINT       NULL,
  user_id    BIGINT       NULL,
  field      VARCHAR(40)  NOT NULL,
  old_value  VARCHAR(255) NULL,
  new_value  VARCHAR(255) NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_batch_field (batch, field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- B. Chuẩn hóa và điền (một giao dịch, mặc định ROLLBACK)
-- ---------------------------------------------------------------
SET @batch = 'n1';
START TRANSACTION;

-- B1. Tên khóa học: bỏ khoảng trắng đầu/cuối và khoảng trắng liên tiếp
SELECT COUNT(*) AS b1_titles_to_clean FROM items WHERE title <> TRIM(title) OR title LIKE '%  %';
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'title', LEFT(title, 255), LEFT(TRIM(REGEXP_REPLACE(title, '[[:space:]]+', ' ')), 255)
FROM items WHERE title <> TRIM(title) OR title LIKE '%  %';
UPDATE items SET title = TRIM(REGEXP_REPLACE(title, '[[:space:]]+', ' '))
WHERE title <> TRIM(title) OR title LIKE '%  %';

-- B2. Hình thức (subtype) và kiểu chu kỳ (cycle_type): chữ thường, bỏ khoảng trắng; đổi các cách viết tiếng Việt quen thuộc
UPDATE items SET subtype = LOWER(TRIM(subtype)) WHERE subtype IS NOT NULL AND subtype <> LOWER(TRIM(subtype));
UPDATE items SET cycle_type = CASE LOWER(TRIM(cycle_type))
    WHEN 'buổi' THEN 'session' WHEN 'buoi' THEN 'session' WHEN 'sessions' THEN 'session'
    WHEN 'ngày' THEN 'day'     WHEN 'ngay'  THEN 'day'     WHEN 'days'     THEN 'day'
    WHEN 'tuần' THEN 'week'    WHEN 'tuan'  THEN 'week'    WHEN 'weeks'    THEN 'week'
    WHEN 'tháng' THEN 'month'  WHEN 'thang' THEN 'month'   WHEN 'months'   THEN 'month'
    WHEN 'năm' THEN 'year'     WHEN 'nam'   THEN 'year'    WHEN 'years'    THEN 'year'
    ELSE LOWER(TRIM(cycle_type)) END
WHERE cycle_type IS NOT NULL;
-- Còn giá trị lạ sau khi chuẩn hóa (sửa tay):
SELECT 'subtype' AS field, COALESCE(subtype, '(NULL)') AS value, COUNT(*) AS items
FROM items WHERE is_test = 0 AND (subtype IS NULL OR subtype NOT IN ('online','offline','digital','extra','video','preschool')) GROUP BY subtype
UNION ALL
SELECT 'cycle_type', cycle_type, COUNT(*) FROM items
WHERE is_test = 0 AND cycle_type IS NOT NULL AND cycle_type NOT IN ('session','day','week','month','year') GROUP BY cycle_type;

-- B3. Độ tuổi nhập ngược (tối thiểu > tối đa): đổi chỗ
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'ages_swapped', CONCAT(ages_min, '-', ages_max), CONCAT(ages_max, '-', ages_min) FROM items WHERE ages_min > ages_max;
UPDATE items i JOIN (SELECT id, ages_min AS a, ages_max AS b FROM items WHERE ages_min > ages_max) s ON s.id = i.id
SET i.ages_min = s.b, i.ages_max = s.a;

-- B4. Giá gốc nhỏ hơn giá bán không có nghĩa là giảm giá: bỏ giá gốc
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'org_price', org_price, NULL FROM items WHERE org_price IS NOT NULL AND org_price < price;
UPDATE items SET org_price = NULL WHERE org_price IS NOT NULL AND org_price < price;

-- B5. Độ tuổi còn trống: lấy từ tên hoặc mô tả ngắn khi có câu "6-12 tuổi" hoặc "từ 5 tuổi" (1 đến 18)
DROP TEMPORARY TABLE IF EXISTS tmp_ages;
CREATE TEMPORARY TABLE tmp_ages AS
SELECT id, title, ages_from, ages_to FROM (
  SELECT id, title,
    CAST(REGEXP_SUBSTR(COALESCE(range_text, from_text), '[0-9]{1,2}') AS UNSIGNED) AS ages_from,
    CASE WHEN range_text IS NOT NULL THEN CAST(REGEXP_SUBSTR(range_text, '[0-9]{1,2}', 1, 2) AS UNSIGNED) END AS ages_to
  FROM (
    SELECT id, title,
      REGEXP_SUBSTR(txt, '[0-9]{1,2} ?(-|–|đến|tới) ?[0-9]{1,2} ?tuổi') AS range_text,
      REGEXP_SUBSTR(txt, 'từ [0-9]{1,2} tuổi')                          AS from_text
    FROM (SELECT id, title, CONCAT(title, ' ', COALESCE(short_content, '')) AS txt
          FROM items WHERE ages_min IS NULL AND ages_max IS NULL) src
  ) found
  WHERE range_text IS NOT NULL OR from_text IS NOT NULL
) q
WHERE ages_from BETWEEN 1 AND 18 AND (ages_to IS NULL OR (ages_to BETWEEN ages_from AND 18));
SELECT 'B5 xem lại độ tuổi sẽ điền' AS preview, t.id, t.title, t.ages_from, t.ages_to FROM tmp_ages t ORDER BY t.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'ages', NULL, CONCAT(ages_from, '-', COALESCE(ages_to, '')) FROM tmp_ages;
UPDATE items i JOIN tmp_ages t ON t.id = i.id SET i.ages_min = t.ages_from, i.ages_max = t.ages_to;

-- B6. Lĩnh vực: khóa chưa có danh mục mà cột cũ items.item_category_id trỏ tới một danh mục còn tồn tại
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, i.id, 'category', NULL, c.title FROM items i JOIN categories c ON c.id = i.item_category_id AND c.status = 1
WHERE i.item_category_id > 0 AND NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id);
INSERT INTO items_categories (category_id, item_id, created_at, updated_at)
SELECT c.id, i.id, NOW(), NOW() FROM items i JOIN categories c ON c.id = i.item_category_id AND c.status = 1
WHERE i.item_category_id > 0 AND NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id);

-- B7. Lĩnh vực theo từ khóa: khóa vẫn chưa có danh mục, tên khóa chứa tên đúng MỘT danh mục (tên dài từ 4 ký tự).
--     Bảng so sánh chữ không phân biệt hoa thường và dấu (collation unicode_ci). Xem bảng trước khi COMMIT.
DROP TEMPORARY TABLE IF EXISTS tmp_cat;
CREATE TEMPORARY TABLE tmp_cat AS
SELECT i.id AS item_id, MIN(c.id) AS category_id, MIN(c.title) AS category_title
FROM items i JOIN categories c ON c.status = 1 AND CHAR_LENGTH(c.title) >= 4 AND i.title LIKE CONCAT('%', c.title, '%')
WHERE NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id)
GROUP BY i.id HAVING COUNT(DISTINCT c.id) = 1;
SELECT 'B7 xem lại danh mục sẽ điền' AS preview, t.item_id, i.title, t.category_title FROM tmp_cat t JOIN items i ON i.id = t.item_id ORDER BY t.item_id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value) SELECT @batch, item_id, 'category_by_title', NULL, category_title FROM tmp_cat;
INSERT INTO items_categories (category_id, item_id, created_at, updated_at) SELECT category_id, item_id, NOW(), NOW() FROM tmp_cat;

-- B8. Tag: khóa chưa có tag nào, tên khóa chứa tên một tag đang bật (tên dài từ 4 ký tự), tối đa 5 tag mỗi khóa.
--     Chỉ dùng tag đã có trong từ điển Tags (không tạo tag mới).
DROP TEMPORARY TABLE IF EXISTS tmp_tags;
CREATE TEMPORARY TABLE tmp_tags AS
SELECT item_id, tag_id, tag_name FROM (
  SELECT i.id AS item_id, t.id AS tag_id, t.name AS tag_name,
         ROW_NUMBER() OVER (PARTITION BY i.id ORDER BY CHAR_LENGTH(t.name) DESC, t.id) AS rn
  FROM items i JOIN tags t ON t.status = 1 AND CHAR_LENGTH(t.name) >= 4 AND i.title LIKE CONCAT('%', t.name, '%')
  WHERE NOT EXISTS (SELECT 1 FROM item_tags it WHERE it.item_id = i.id)
) q WHERE rn <= 5;
SELECT 'B8 xem lại tag sẽ điền' AS preview, t.item_id, i.title, GROUP_CONCAT(t.tag_name SEPARATOR ' | ') AS tags
FROM tmp_tags t JOIN items i ON i.id = t.item_id GROUP BY t.item_id, i.title ORDER BY t.item_id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value) SELECT @batch, item_id, 'tag', NULL, tag_name FROM tmp_tags;
INSERT IGNORE INTO item_tags (item_id, tag_id) SELECT item_id, tag_id FROM tmp_tags;

-- B9. Loại đối tác: tài khoản role = 'school' chưa có loại thì đặt "school" (Trường học).
--     Giáo viên (role = 'teacher') và đối tác bán mã code (app) cần chọn tay: xem bảng bên dưới.
INSERT INTO item_autofill_log (batch, user_id, field, old_value, new_value)
SELECT @batch, id, 'partner_type', partner_type, 'school' FROM users WHERE role = 'school' AND (partner_type IS NULL OR partner_type = '');
UPDATE users SET partner_type = 'school' WHERE role = 'school' AND (partner_type IS NULL OR partner_type = '');
SELECT 'B9 đối tác còn thiếu loại (chọn tay)' AS preview, u.id, u.name, u.role,
       GROUP_CONCAT(DISTINCT i.subtype ORDER BY i.subtype) AS subtypes, COUNT(DISTINCT i.id) AS items
FROM users u JOIN items i ON i.user_id = u.id AND i.is_test = 0
WHERE u.partner_type IS NULL OR u.partner_type = '' GROUP BY u.id, u.name, u.role ORDER BY items DESC;

-- B10. Địa chỉ: khóa học trực tiếp (offline / extra / preschool) chưa có địa chỉ, đối tác có đúng MỘT địa chỉ đang dùng có toạ độ
--      và không phải đối tác "app": gắn địa chỉ đó (giống cách admin tự áp dụng khi lưu khóa). Nhiều địa chỉ thì để người làm nội dung chọn.
DROP TEMPORARY TABLE IF EXISTS tmp_addr;
CREATE TEMPORARY TABLE tmp_addr AS
SELECT i.id AS item_id, MIN(l.id) AS location_id
FROM items i
JOIN users u ON u.id = i.user_id AND COALESCE(u.partner_type, '') <> 'app'
JOIN user_locations l ON l.user_id = i.user_id AND l.status = 1 AND l.lat IS NOT NULL AND l.lng IS NOT NULL
WHERE i.subtype IN ('offline', 'extra', 'preschool')
  AND NOT EXISTS (SELECT 1 FROM item_locations il WHERE il.item_id = i.id)
  AND (i.user_location_id IS NULL OR i.user_location_id = 0)
  AND NOT EXISTS (SELECT 1 FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1 AND s.user_location_id IS NOT NULL)
GROUP BY i.id HAVING COUNT(*) = 1;
SELECT 'B10 xem lại địa chỉ sẽ gắn' AS preview, a.item_id, i.title, a.location_id FROM tmp_addr a JOIN items i ON i.id = a.item_id ORDER BY a.item_id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value) SELECT @batch, item_id, 'address', NULL, location_id FROM tmp_addr;
INSERT IGNORE INTO item_locations (item_id, user_location_id) SELECT item_id, location_id FROM tmp_addr;
UPDATE items i JOIN tmp_addr a ON a.item_id = i.id SET i.user_location_id = a.location_id;

-- B11. Báo cáo cuối: những gì đã tự điền và những gì còn thiếu cho khóa đang hiển thị
SELECT field, COUNT(*) AS rows_changed FROM item_autofill_log WHERE batch = @batch GROUP BY field ORDER BY field;
SELECT
  COUNT(*)                                                                    AS live_items,
  SUM(i.ages_min IS NULL AND i.ages_max IS NULL)                              AS still_no_ages,
  SUM(NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id)) AS still_no_category,
  SUM(NOT EXISTS (SELECT 1 FROM item_tags it WHERE it.item_id = i.id))        AS still_no_tags,
  SUM(COALESCE(i.subtype,'') NOT IN ('digital','video') AND (i.cycle_type IS NULL OR i.cycle_amount IS NULL OR i.cycle_amount <= 0)) AS still_no_sessions,
  SUM(u.partner_type IS NULL OR u.partner_type = '')                          AS still_no_partner_type
FROM items i JOIN users u ON u.id = i.user_id
WHERE i.is_test = 0 AND i.status = 1 AND i.user_status = 1 AND u.status = 1 AND u.is_signed = 99;

-- Đổi ROLLBACK thành COMMIT khi đã xem xong các bảng xem trước (B5, B7, B8, B9, B10) và hài lòng.
ROLLBACK;
-- COMMIT;

-- ---------------------------------------------------------------
-- C. Hoàn tác sau khi đã COMMIT (nếu cần): khôi phục từ bảng sao lưu
--    (chạy từng khối, kiểm tra số dòng trước)
-- ---------------------------------------------------------------
-- UPDATE items i JOIN items_bak_n1 b ON b.id = i.id
--    SET i.title = b.title, i.subtype = b.subtype, i.cycle_type = b.cycle_type, i.ages_min = b.ages_min, i.ages_max = b.ages_max,
--        i.org_price = b.org_price, i.user_location_id = b.user_location_id;
-- DELETE FROM item_tags;       INSERT INTO item_tags       SELECT * FROM item_tags_bak_n1;
-- DELETE FROM items_categories; INSERT INTO items_categories SELECT * FROM items_categories_bak_n1;
-- DELETE FROM item_locations;  INSERT INTO item_locations  SELECT * FROM item_locations_bak_n1;
-- UPDATE users u JOIN users_partner_type_bak_n1 b ON b.id = u.id SET u.partner_type = b.partner_type;
-- Các bảng *_bak_n1 và item_autofill_log có thể xóa sau khi kiểm tra xong (DROP TABLE).
