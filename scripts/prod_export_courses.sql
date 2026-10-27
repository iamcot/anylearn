-- ================================================================
-- prod_export_courses.sql  (CHỈ ĐỌC, không sửa dữ liệu)
-- Xuất dữ liệu khóa học và các trường liên quan để xem độ đầy đủ trước khi chuẩn hóa.
--
-- Cách chạy trên server prod:
--   mysql -uROOT -p anylearn --batch --raw < scripts/prod_export_courses.sql > export_all.tsv
--   (mọi truy vấn nối nhau trong một file; mỗi cái bắt đầu bằng dòng tiêu đề cột)
-- Hoặc dán từng truy vấn Q1..Q7 vào DBeaver / TablePlus rồi "Export to CSV" để mở bằng Excel / Google Sheets.
-- ================================================================

-- Q0. Phiên bản MySQL (script chuẩn hóa cần 8.0 trở lên)
SELECT VERSION() AS mysql_version;

-- Q1. Mỗi khóa học một dòng, kèm các cờ "thiếu" (1 = thiếu) giống trang "Thiếu thuộc tính" của admin.
--     Chỉ lấy khóa không phải bản test. Cột live = 1 khi khách nhìn thấy khóa (khóa bật, đối tác bật và đã ký HĐ).
SELECT
  i.id,
  i.title,
  i.subtype,
  i.status,
  i.user_status,
  (i.status = 1 AND i.user_status = 1 AND u.status = 1 AND u.is_signed = 99) AS live,
  i.user_id        AS partner_id,
  u.name           AS partner_name,
  u.role           AS partner_role,
  u.partner_type,
  u.is_signed      AS partner_signed,
  i.price,
  i.org_price,
  i.ages_min,
  i.ages_max,
  i.cycle_type,
  i.cycle_amount,
  i.date_start,
  i.date_end,
  i.item_category_id                                                        AS legacy_category_id,
  (SELECT GROUP_CONCAT(c.title ORDER BY c.title SEPARATOR ' | ')
     FROM items_categories ic JOIN categories c ON c.id = ic.category_id WHERE ic.item_id = i.id) AS categories,
  (SELECT GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ' | ')
     FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.status = 1)  AS tags,
  (SELECT COUNT(*) FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1)                  AS schedules,
  (SELECT COUNT(*) FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1
      AND s.time_start IS NOT NULL AND s.time_start <> '')                                         AS schedules_with_time,
  (SELECT COUNT(*) FROM item_locations il JOIN user_locations l ON l.id = il.user_location_id
      WHERE il.item_id = i.id AND l.status = 1 AND l.lat IS NOT NULL AND l.lng IS NOT NULL)        AS own_branches_with_coords,
  (SELECT COUNT(*) FROM user_locations l WHERE l.user_id = i.user_id AND l.status = 1
      AND l.lat IS NOT NULL AND l.lng IS NOT NULL)                                                 AS partner_branches_with_coords,
  CHAR_LENGTH(COALESCE(i.short_content, '')) AS short_len,
  CHAR_LENGTH(COALESCE(i.content, ''))       AS content_len,
  i.seo_url,
  -- cờ thiếu
  (i.ages_min IS NULL AND i.ages_max IS NULL)                                                       AS gap_ages,
  NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id)                            AS gap_category,
  NOT EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.status = 1) AS gap_tags,
  (i.subtype IN ('offline','extra','preschool') AND
     NOT EXISTS (SELECT 1 FROM item_locations il WHERE il.item_id = i.id)
     AND (i.user_location_id IS NULL OR i.user_location_id = 0))                                    AS gap_address,
  (COALESCE(i.subtype,'') NOT IN ('digital','video') AND
     NOT EXISTS (SELECT 1 FROM item_schedules s WHERE s.item_id = i.id AND s.status = 1
                 AND s.time_start IS NOT NULL AND s.time_start <> ''))                              AS gap_schedule,
  (COALESCE(i.subtype,'') NOT IN ('digital','video') AND (i.cycle_type IS NULL OR i.cycle_amount IS NULL OR i.cycle_amount <= 0)) AS gap_sessions,
  (u.partner_type IS NULL OR u.partner_type = '')                                                   AS gap_partner_type
FROM items i
JOIN users u ON u.id = i.user_id
WHERE i.is_test = 0
ORDER BY live DESC, i.id;

-- Q2. Tóm tắt: bao nhiêu khóa đang hiển thị thiếu từng loại thông tin
SELECT
  COUNT(*)                                                                    AS live_items,
  SUM(i.ages_min IS NULL AND i.ages_max IS NULL)                              AS no_ages,
  SUM(NOT EXISTS (SELECT 1 FROM items_categories ic WHERE ic.item_id = i.id)) AS no_category,
  SUM(NOT EXISTS (SELECT 1 FROM item_tags it WHERE it.item_id = i.id))        AS no_tags,
  SUM(COALESCE(i.subtype,'') NOT IN ('digital','video') AND (i.cycle_type IS NULL OR i.cycle_amount IS NULL OR i.cycle_amount <= 0)) AS no_sessions,
  SUM(u.partner_type IS NULL OR u.partner_type = '')                          AS no_partner_type
FROM items i JOIN users u ON u.id = i.user_id
WHERE i.is_test = 0 AND i.status = 1 AND i.user_status = 1 AND u.status = 1 AND u.is_signed = 99;

-- Q3. Các giá trị lạ cần chuẩn hóa tay: hình thức (subtype) và kiểu chu kỳ (cycle_type) ngoài danh sách chuẩn
SELECT 'subtype' AS field, COALESCE(subtype, '(NULL)') AS value, COUNT(*) AS items
FROM items WHERE is_test = 0 AND (subtype IS NULL OR subtype NOT IN ('online','offline','digital','extra','video','preschool'))
GROUP BY subtype
UNION ALL
SELECT 'cycle_type', COALESCE(cycle_type, '(NULL)'), COUNT(*)
FROM items WHERE is_test = 0 AND cycle_type IS NOT NULL AND cycle_type NOT IN ('session','day','week','month','year')
GROUP BY cycle_type
ORDER BY field, items DESC;

-- Q4. Dữ liệu vô lý: tuổi ngược, giá ưu đãi cao hơn giá bán, ngày kết thúc trước ngày bắt đầu, giá 0 trên khóa có phí
SELECT i.id, i.title,
  CASE
    WHEN i.ages_min > i.ages_max THEN 'tuổi tối thiểu lớn hơn tối đa'
    WHEN i.org_price IS NOT NULL AND i.org_price < i.price THEN 'giá gốc nhỏ hơn giá bán'
    WHEN i.date_end IS NOT NULL AND i.date_end < i.date_start THEN 'ngày kết thúc trước ngày bắt đầu'
    WHEN i.price = 0 AND COALESCE(i.is_paymentfee, 0) = 0 THEN 'giá bán bằng 0'
  END AS problem,
  i.ages_min, i.ages_max, i.price, i.org_price, i.date_start, i.date_end
FROM items i
WHERE i.is_test = 0 AND (
     i.ages_min > i.ages_max
  OR (i.org_price IS NOT NULL AND i.org_price < i.price)
  OR (i.date_end IS NOT NULL AND i.date_end < i.date_start)
  OR (i.price = 0 AND COALESCE(i.is_paymentfee, 0) = 0))
ORDER BY problem, i.id;

-- Q5. Tên khóa học có khoảng trắng thừa, viết hoa toàn bộ, hoặc trùng nhau giữa các đối tác
SELECT i.id, i.title,
  (i.title <> TRIM(i.title) OR i.title LIKE '%  %')            AS extra_spaces,
  (i.title = UPPER(i.title) AND CHAR_LENGTH(i.title) > 8)      AS all_caps,
  (SELECT COUNT(*) FROM items d WHERE d.id <> i.id AND d.is_test = 0 AND LOWER(TRIM(d.title)) = LOWER(TRIM(i.title))) AS same_title_elsewhere
FROM items i
WHERE i.is_test = 0
  AND (i.title <> TRIM(i.title) OR i.title LIKE '%  %' OR (i.title = UPPER(i.title) AND CHAR_LENGTH(i.title) > 8)
       OR EXISTS (SELECT 1 FROM items d WHERE d.id <> i.id AND d.is_test = 0 AND LOWER(TRIM(d.title)) = LOWER(TRIM(i.title))))
ORDER BY i.title;

-- Q6. Lịch học (mỗi ca một dòng)
SELECT s.id AS schedule_id, s.item_id, i.title, s.title AS schedule_title, s.schedule_type, s.weekdays, s.time_start, s.time_end,
       s.event_date, s.date_start, s.date_end, s.user_location_id, s.status
FROM item_schedules s JOIN items i ON i.id = s.item_id
WHERE i.is_test = 0
ORDER BY s.item_id, s.id;

-- Q7. Đối tác có khóa học: loại đối tác và số địa chỉ có toạ độ (để quyết định loại đối tác, địa chỉ mặc định)
SELECT u.id AS partner_id, u.name, u.role, u.partner_type, u.status, u.is_signed,
  COUNT(DISTINCT i.id) AS items,
  GROUP_CONCAT(DISTINCT i.subtype ORDER BY i.subtype) AS subtypes,
  (SELECT COUNT(*) FROM user_locations l WHERE l.user_id = u.id AND l.status = 1 AND l.lat IS NOT NULL AND l.lng IS NOT NULL) AS branches_with_coords
FROM users u JOIN items i ON i.user_id = u.id AND i.is_test = 0
GROUP BY u.id, u.name, u.role, u.partner_type, u.status, u.is_signed
ORDER BY items DESC;
