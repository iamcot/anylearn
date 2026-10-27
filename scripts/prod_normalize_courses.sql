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
--     item_locations, item_schedules (chỉ thêm ca mới), users.partner_type. Mọi dòng điền tự động được ghi vào item_autofill_log.
--   * Sau khi COMMIT: vào admin Cài đặt > Vận hành bấm "Chạy lại chỉ mục tìm kiếm" (POST /admin/reindex).
--
-- Chỉ điền khi luật rõ ràng (deterministic). Điều không chắc chắn (hình thức lạ, loại đối tác của member / admin,
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
-- Chữ (literal) và kết quả hàm trong bảng tạm lấy collation của kết nối; ép về collation của bảng items để khỏi lỗi 1267 (utf8mb4_unicode_ci vs utf8mb4_0900_ai_ci).
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
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

-- B5. Độ tuổi còn trống (hoặc còn là mặc định 0-30 = không giới hạn): lấy từ tên hoặc mô tả ngắn khi có câu "6-12 tuổi", "0-3 tuổi" hoặc "từ 5 tuổi" (0 đến 18)
DROP TEMPORARY TABLE IF EXISTS tmp_ages;
CREATE TEMPORARY TABLE tmp_ages AS
SELECT id, title, ages_from, ages_to, old_text FROM (
  SELECT id, title, old_text,
    CAST(REGEXP_SUBSTR(COALESCE(range_text, from_text), '[0-9]{1,2}') AS UNSIGNED) AS ages_from,
    CASE WHEN range_text IS NOT NULL THEN CAST(REGEXP_SUBSTR(range_text, '[0-9]{1,2}', 1, 2) AS UNSIGNED) END AS ages_to
  FROM (
    SELECT id, title, old_text,
      REGEXP_SUBSTR(txt, '[0-9]{1,2} ?(-|–|đến|tới) ?[0-9]{1,2} ?tuổi') AS range_text,
      REGEXP_SUBSTR(txt, 'từ [0-9]{1,2} tuổi')                          AS from_text
    FROM (SELECT id, title, CONCAT(title, ' ', COALESCE(short_content, '')) AS txt,
                 CASE WHEN ages_min IS NULL AND ages_max IS NULL THEN NULL ELSE '0-30' END AS old_text
          FROM items WHERE (ages_min IS NULL AND ages_max IS NULL) OR (ages_min = 0 AND ages_max = 30)) src
  ) found
  WHERE range_text IS NOT NULL OR from_text IS NOT NULL
) q
WHERE ages_from BETWEEN 0 AND 18 AND (ages_to IS NULL OR (ages_to BETWEEN ages_from AND 18));
SELECT 'B5 xem lại độ tuổi sẽ điền' AS preview, t.id, t.title, t.old_text AS old_ages, t.ages_from, t.ages_to FROM tmp_ages t ORDER BY t.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'ages', old_text, CONCAT(ages_from, '-', COALESCE(ages_to, '')) FROM tmp_ages;
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

-- B9. Loại đối tác (chỉ tài khoản chưa có loại): đoán theo vai trò và tên, xem bảng xem trước rồi sửa tay chỗ sai.
--     role = 'school': tên có "trung tâm" / "center" → center; "CLB" / "câu lạc bộ" / "club" → club; còn lại → school.
--     role = 'teacher' → tutor (gia sư / giáo viên cá nhân; chuyên gia thì đổi tay thành expert).
--     member / admin và đối tác bán mã code (app) cần chọn tay: xem bảng cuối.
DROP TEMPORARY TABLE IF EXISTS tmp_ptype;
CREATE TEMPORARY TABLE tmp_ptype AS
SELECT id, name, role, partner_type AS old_type,
  CASE WHEN role = 'teacher' THEN 'tutor'
       WHEN LOWER(name) REGEXP 'trung tâm|center|centre' THEN 'center'
       WHEN LOWER(name) REGEXP 'clb|câu lạc bộ|club' THEN 'club'
       ELSE 'school' END AS new_type
FROM users WHERE role IN ('school', 'teacher') AND (partner_type IS NULL OR partner_type = '');
SELECT 'B9 xem lại loại đối tác sẽ đặt' AS preview, new_type, role, COUNT(*) AS partners, GROUP_CONCAT(name ORDER BY name SEPARATOR ' | ') AS names
FROM tmp_ptype GROUP BY new_type, role;
INSERT INTO item_autofill_log (batch, user_id, field, old_value, new_value)
SELECT @batch, id, 'partner_type', old_type, new_type FROM tmp_ptype;
UPDATE users u JOIN tmp_ptype t ON t.id = u.id SET u.partner_type = t.new_type;
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

-- B11. Ca học linh hoạt: khóa đang bật, không phải bản test, không phải khóa thu phí / video / kỹ thuật số, CHƯA có ca học nào.
--      Đọc tên + mô tả (bỏ thẻ HTML). Nếu bài viết có câu giới thiệu lịch rõ ràng thì tạo MỘT ca kiểu "Linh hoạt"
--      (schedule_type = 'open': học viên chọn ngày bắt đầu sau, luôn cho đăng ký):
--        * thứ trong tuần: "T2, T4, T6", "Thứ 2 - Thứ 6", "thứ 3 và thứ 5" (một danh sách HOẶC một khoảng, không trộn; chủ nhật chưa đọc)
--        * giờ học: "18:00-19:30", "18h - 19h30" (giờ bắt đầu 5 đến 21, kết thúc sau bắt đầu)
--        * hoặc có từ báo hiệu lịch linh hoạt ("linh hoạt", "linh động", "sắp xếp lịch", "theo thỏa thuận", "học bất cứ lúc nào"...)
--      Không đọc được gì thì không tạo ca. Địa chỉ của ca lấy từ địa chỉ chính của khóa nếu có.
DROP TEMPORARY TABLE IF EXISTS tmp_n;
CREATE TEMPORARY TABLE tmp_n (n INT NOT NULL PRIMARY KEY);
INSERT INTO tmp_n (n) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

DROP TEMPORARY TABLE IF EXISTS tmp_sched_found;
CREATE TEMPORARY TABLE tmp_sched_found AS
SELECT item_id, title, user_location_id,
  REGEXP_SUBSTR(txt, '\\b(thứ|t) ?[2-7]( ?(,|-|–|và|/|đến) ?(thứ |t)?[2-7])*')                                        AS day_text,
  REGEXP_SUBSTR(txt, '[0-9]{1,2}(h|:)[0-9]{0,2} ?(-|–|đến) ?[0-9]{1,2}(h|:)[0-9]{0,2}')                               AS time_text,
  (txt REGEXP 'linh hoạt|linh động|linh hoat|sắp xếp (lịch|giờ|ca)|xếp lịch|thỏa thuận|thoả thuận|tùy chọn (giờ|lịch|ca)|chọn (giờ|lịch|ca) học|bất cứ lúc nào|bất kỳ lúc nào|nhận học viên liên tục|khai giảng liên tục') AS flexible
FROM (
  SELECT i.id AS item_id, i.title, i.user_location_id,
         LEFT(REGEXP_REPLACE(REGEXP_REPLACE(CONCAT(i.title, ' ', COALESCE(i.short_content, ''), ' ', COALESCE(i.content, '')), '<[^>]+>', ' '), '&nbsp;', ' '), 8000) AS txt
  FROM items i
  WHERE i.is_test = 0 AND i.status = 1 AND COALESCE(i.is_paymentfee, 0) = 0
    AND COALESCE(i.subtype, '') NOT IN ('digital', 'video')
    AND NOT EXISTS (SELECT 1 FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1)
) src;

DROP TEMPORARY TABLE IF EXISTS tmp_sched_days;
CREATE TEMPORARY TABLE tmp_sched_days AS
SELECT f.item_id, GROUP_CONCAT(ELT(n.n - 1, 'mon', 'tue', 'wed', 'thu', 'fri', 'sat') ORDER BY n.n) AS weekdays
FROM tmp_sched_found f JOIN tmp_n n ON n.n BETWEEN 2 AND 7
WHERE f.day_text IS NOT NULL
  AND NOT (f.day_text REGEXP '(-|–|đến)' AND f.day_text REGEXP ',|và|/')
  -- khoảng "thứ 2 - 6" = đúng 2 con số và có dấu nối; "thứ 2 - 4 - 6" (3 con số) là danh sách 2, 4, 6
  AND ( (f.day_text REGEXP '(-|–|đến)' AND LENGTH(REGEXP_REPLACE(f.day_text, '[^2-7]', '')) = 2
          AND n.n BETWEEN CAST(REGEXP_SUBSTR(f.day_text, '[2-7]', 1, 1) AS UNSIGNED) AND CAST(REGEXP_SUBSTR(f.day_text, '[2-7]', 1, 2) AS UNSIGNED))
     OR (NOT (f.day_text REGEXP '(-|–|đến)' AND LENGTH(REGEXP_REPLACE(f.day_text, '[^2-7]', '')) = 2)
         AND f.day_text REGEXP CONCAT('[^0-9]', n.n, '([^0-9]|$)')) )
GROUP BY f.item_id;

DROP TEMPORARY TABLE IF EXISTS tmp_sched_times;
CREATE TEMPORARY TABLE tmp_sched_times AS
SELECT item_id,
  CONCAT(LPAD(h1, 2, '0'), ':', LPAD(m1, 2, '0')) AS time_start,
  CONCAT(LPAD(h2, 2, '0'), ':', LPAD(m2, 2, '0')) AS time_end
FROM (
  SELECT item_id,
    CAST(REGEXP_SUBSTR(t1, '^[0-9]{1,2}') AS UNSIGNED) AS h1, COALESCE(CAST(REGEXP_SUBSTR(t1, '[0-9]{2}$') AS UNSIGNED), 0) AS m1,
    CAST(REGEXP_SUBSTR(t2, '^[0-9]{1,2}') AS UNSIGNED) AS h2, COALESCE(CAST(REGEXP_SUBSTR(t2, '[0-9]{2}$') AS UNSIGNED), 0) AS m2
  FROM (
    SELECT item_id,
      REGEXP_SUBSTR(time_text, '[0-9]{1,2}(h|:)[0-9]{0,2}', 1, 1) AS t1,
      REGEXP_SUBSTR(time_text, '[0-9]{1,2}(h|:)[0-9]{0,2}', 1, 2) AS t2
    FROM tmp_sched_found WHERE time_text IS NOT NULL
  ) tok
) hm
WHERE h1 BETWEEN 5 AND 21 AND h2 BETWEEN 6 AND 22 AND m1 < 60 AND m2 < 60 AND h1 * 60 + m1 < h2 * 60 + m2;

DROP TEMPORARY TABLE IF EXISTS tmp_sched;
CREATE TEMPORARY TABLE tmp_sched AS
SELECT f.item_id, f.title, f.user_location_id, d.weekdays, t.time_start, t.time_end, f.flexible, f.day_text, f.time_text
FROM tmp_sched_found f
LEFT JOIN tmp_sched_days d ON d.item_id = f.item_id
LEFT JOIN tmp_sched_times t ON t.item_id = f.item_id
WHERE d.weekdays IS NOT NULL OR t.time_start IS NOT NULL OR f.flexible = 1;

SELECT 'B11 xem lại ca học linh hoạt sẽ tạo' AS preview, s.item_id, s.title, s.day_text AS matched_days, s.time_text AS matched_time,
       s.weekdays, s.time_start, s.time_end, s.flexible AS says_flexible, s.user_location_id
FROM tmp_sched s ORDER BY s.item_id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, item_id, 'schedule', NULL, CONCAT(COALESCE(weekdays, ''), ' ', COALESCE(time_start, ''), '-', COALESCE(time_end, '')) FROM tmp_sched;
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, user_location_id, status)
SELECT item_id, 'Ca linh hoạt', 'open', weekdays, time_start, time_end, NULLIF(user_location_id, 0), 1 FROM tmp_sched;

-- B13. Số buổi: khóa có kiểu chu kỳ "buổi" (hoặc chưa có kiểu) nhưng chưa có số lượng, tên ghi rõ "12 buổi" / "24 Buổi".
--      Bỏ qua tên ghi tần suất ("2 buổi/tuần", "mỗi tuần 3 buổi") hoặc có nhiều con số buổi khác nhau (không chắc là tổng số buổi).
DROP TEMPORARY TABLE IF EXISTS tmp_sessions;
CREATE TEMPORARY TABLE tmp_sessions AS
SELECT id, title, CAST(REGEXP_SUBSTR(REGEXP_SUBSTR(LOWER(title), '[0-9]{1,3} ?buổi'), '[0-9]{1,3}') AS UNSIGNED) AS n
FROM items
WHERE is_test = 0 AND (cycle_amount IS NULL OR cycle_amount <= 0) AND (cycle_type IS NULL OR cycle_type = 'session')
  AND COALESCE(subtype, '') NOT IN ('digital', 'video')
  AND LOWER(title) REGEXP '[0-9]{1,3} ?buổi'
  AND LOWER(title) NOT REGEXP '[0-9] ?buổi ?(/|một|mỗi|trên) ?(tuần|thang|tháng|ngày)|(mỗi|một|1) tuần [0-9]+ buổi'
  AND REGEXP_SUBSTR(LOWER(title), '[0-9]{1,3} ?buổi', 1, 2) IS NULL;
DELETE FROM tmp_sessions WHERE n IS NULL OR n < 1 OR n > 200;
SELECT 'B13 xem lại số buổi sẽ điền' AS preview, id, title, n FROM tmp_sessions ORDER BY id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, i.id, 'sessions', CONCAT(COALESCE(i.cycle_type, ''), ':', COALESCE(i.cycle_amount, '')), CONCAT('session:', t.n) FROM tmp_sessions t JOIN items i ON i.id = t.id;
UPDATE items i JOIN tmp_sessions t ON t.id = i.id SET i.cycle_type = 'session', i.cycle_amount = t.n;

-- B14. Làm sạch ngày/giờ bắt đầu ở cấp khóa học (items.date_start, time_start, time_end, date_end).
--      Các trường này vô nghĩa: date_start bị code tự dời +15/+30 ngày mỗi lần xem khóa, time_start/time_end hiếm khi có.
--      Ngày khai giảng thật nằm ở ca học (item_schedules). Cần V47 (date_start cho phép NULL) đã chạy trước khi chạy khối này.
--      Khóa có ngày khai giảng tương lai mà chưa có ca nào: liệt kê để đối tác chuyển sang ca học (dữ liệu cũ vẫn còn trong items_bak_n1).
SELECT 'B14 khóa đang bật có ngày bắt đầu nhưng chưa có ca học (đối tác cần tạo ca)' AS preview, i.id, i.title, i.date_start, i.user_id
FROM items i
WHERE i.status = 1 AND i.user_status = 1 AND i.is_test = 0 AND i.date_start >= CURDATE()
  AND NOT EXISTS (SELECT 1 FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1)
ORDER BY i.date_start, i.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
SELECT @batch, id, 'item_dates', CONCAT_WS('|', date_start, time_start, time_end, date_end), NULL
FROM items WHERE date_start IS NOT NULL OR time_start IS NOT NULL OR time_end IS NOT NULL OR date_end IS NOT NULL;
UPDATE items SET date_start = NULL, time_start = NULL, time_end = NULL, date_end = NULL
WHERE date_start IS NOT NULL OR time_start IS NOT NULL OR time_end IS NOT NULL OR date_end IS NOT NULL;

-- B12. Báo cáo cuối: những gì đã tự điền và những gì còn thiếu cho khóa đang hiển thị
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

-- Đổi ROLLBACK thành COMMIT khi đã xem xong các bảng xem trước (B5, B7, B8, B9, B10, B11, B13, B14) và hài lòng.
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
-- UPDATE items i JOIN items_bak_n1 b ON b.id = i.id SET i.date_start = b.date_start, i.time_start = b.time_start, i.time_end = b.time_end, i.date_end = b.date_end;  -- B14
-- Ca học linh hoạt đã tạo (B11) là các dòng mới, xóa theo nhật ký:
-- DELETE s FROM item_schedules s JOIN item_autofill_log l ON l.item_id = s.item_id AND l.batch = 'n1' AND l.field = 'schedule'
--  WHERE s.title = 'Ca linh hoạt' AND s.schedule_type = 'open';
-- Các bảng *_bak_n1 và item_autofill_log có thể xóa sau khi kiểm tra xong (DROP TABLE).
