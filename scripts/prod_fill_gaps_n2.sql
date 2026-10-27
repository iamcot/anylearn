-- ================================================================
-- prod_fill_gaps_n2.sql
-- Bổ sung tag, lĩnh vực, tuổi, số buổi cho các khóa còn thiếu, do Claude đọc tên và mô tả của từng khóa
-- trong gaps.tsv (xuất bằng scripts/prod_export_gaps.sql ngày 2026-10-27) rồi chọn. Mỗi dòng ghi rõ id khóa.
-- Chỉ điền khi trường đang trống; không đè dữ liệu đã có. Id tag / lĩnh vực lấy từ danh sách G1, G2 của file đó.
--
--   mysql -uROOT -p --table --default-character-set=utf8mb4 anylearn < scripts/prod_fill_gaps_n2.sql > preview2.txt
-- Chạy lần đầu để xem (kết thúc bằng ROLLBACK). Hài lòng thì đổi ROLLBACK thành COMMIT, gọi POST /admin/reindex.
-- Sao lưu: items_bak_n2, item_tags_bak_n2, items_categories_bak_n2.
-- ================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items_bak_n2 AS SELECT * FROM items;
CREATE TABLE IF NOT EXISTS item_tags_bak_n2 AS SELECT * FROM item_tags;
CREATE TABLE IF NOT EXISTS items_categories_bak_n2 AS SELECT * FROM items_categories;

SET @batch = 'n2';
START TRANSACTION;

-- Tag: (id khóa, id tag)
DROP TEMPORARY TABLE IF EXISTS tmp_n2_tags;
CREATE TEMPORARY TABLE tmp_n2_tags (item_id BIGINT NOT NULL, tag_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY (item_id, tag_id));
INSERT INTO tmp_n2_tags (item_id, tag_id) VALUES
  (88,18),
  (359,18),
  (360,18),
  (362,18),
  (363,18),
  (361,18),
  (137,18),
  (139,18),
  (653,18),
  (660,18),
  (446,18),
  (451,18),
  (452,18),
  (453,18),
  (454,18),
  (455,18),
  (456,18),
  (449,205),
  (339,57),
  (345,22),
  (347,22),
  (1530,22),
  (278,257),
  (650,257),
  (643,189),
  (476,189),
  (849,169),
  (1533,190),
  (1572,208),
  (1667,191);
DELETE t FROM tmp_n2_tags t LEFT JOIN items i ON i.id = t.item_id LEFT JOIN tags g ON g.id = t.tag_id AND g.status = 1
  WHERE i.id IS NULL OR g.id IS NULL;
SELECT 'N2 tag sẽ thêm' AS preview, i.id, i.title, GROUP_CONCAT(g.name SEPARATOR ' | ') AS tags
  FROM tmp_n2_tags t JOIN items i ON i.id = t.item_id JOIN tags g ON g.id = t.tag_id
  WHERE NOT EXISTS (SELECT 1 FROM item_tags x WHERE x.item_id = t.item_id AND x.tag_id = t.tag_id) GROUP BY i.id, i.title ORDER BY i.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
  SELECT @batch, t.item_id, 'tag', NULL, t.tag_id FROM tmp_n2_tags t
  WHERE NOT EXISTS (SELECT 1 FROM item_tags x WHERE x.item_id = t.item_id AND x.tag_id = t.tag_id);
INSERT IGNORE INTO item_tags (item_id, tag_id) SELECT item_id, tag_id FROM tmp_n2_tags;

-- Lĩnh vực (kể cả lĩnh vực đang tắt ở trang chủ): (id khóa, id lĩnh vực), chỉ cho khóa chưa có lĩnh vực nào
DROP TEMPORARY TABLE IF EXISTS tmp_n2_cats;
CREATE TEMPORARY TABLE tmp_n2_cats (item_id BIGINT NOT NULL, category_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY (item_id, category_id));
INSERT INTO tmp_n2_cats (item_id, category_id) VALUES
  (88,22),
  (137,22),
  (139,22),
  (359,22),
  (360,22),
  (361,22),
  (362,22),
  (363,22),
  (1670,22),
  (140,47),
  (141,47),
  (143,47),
  (144,47),
  (146,47),
  (149,47),
  (150,47),
  (175,47),
  (677,47),
  (678,47),
  (339,16),
  (340,16),
  (341,16),
  (343,16),
  (345,16),
  (440,21),
  (458,5),
  (459,5),
  (459,15),
  (643,53),
  (668,53),
  (674,53),
  (674,51),
  (674,52),
  (700,3),
  (702,3),
  (841,3),
  (915,3),
  (916,3),
  (727,8),
  (832,49),
  (834,49),
  (835,49),
  (836,49),
  (837,49),
  (838,49);
DELETE c FROM tmp_n2_cats c LEFT JOIN items i ON i.id = c.item_id LEFT JOIN categories g ON g.id = c.category_id
  WHERE i.id IS NULL OR g.id IS NULL OR EXISTS (SELECT 1 FROM items_categories x WHERE x.item_id = c.item_id);
SELECT 'N2 lĩnh vực sẽ thêm' AS preview, i.id, i.title, g.title AS category FROM tmp_n2_cats c JOIN items i ON i.id = c.item_id JOIN categories g ON g.id = c.category_id ORDER BY i.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value) SELECT @batch, item_id, 'category', NULL, category_id FROM tmp_n2_cats;
INSERT INTO items_categories (item_id, category_id) SELECT item_id, category_id FROM tmp_n2_cats;

-- Tuổi: (id khóa, từ, đến), chỉ khi tuổi đang trống hoặc là mặc định 0-30
DROP TEMPORARY TABLE IF EXISTS tmp_n2_ages;
CREATE TEMPORARY TABLE tmp_n2_ages (item_id BIGINT NOT NULL PRIMARY KEY, a_from INT NOT NULL, a_to INT NOT NULL);
INSERT INTO tmp_n2_ages (item_id, a_from, a_to) VALUES
  (445,10,19),
  (615,3,6),
  (722,3,6),
  (723,3,6),
  (137,11,18),
  (139,11,18);
DELETE t FROM tmp_n2_ages t JOIN items i ON i.id = t.item_id WHERE NOT ((i.ages_min IS NULL AND i.ages_max IS NULL) OR (i.ages_min = 0 AND i.ages_max = 30));
SELECT 'N2 tuổi sẽ điền' AS preview, i.id, i.title, i.ages_min AS old_min, i.ages_max AS old_max, t.a_from, t.a_to FROM tmp_n2_ages t JOIN items i ON i.id = t.item_id ORDER BY i.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
  SELECT @batch, t.item_id, 'ages', CONCAT_WS('-', i.ages_min, i.ages_max), CONCAT(t.a_from, '-', t.a_to) FROM tmp_n2_ages t JOIN items i ON i.id = t.item_id;
UPDATE items i JOIN tmp_n2_ages t ON t.item_id = i.id SET i.ages_min = t.a_from, i.ages_max = t.a_to;

-- Số buổi / chu kỳ: (id khóa, kiểu, số lượng), chỉ khi số lượng đang trống
DROP TEMPORARY TABLE IF EXISTS tmp_n2_sessions;
CREATE TEMPORARY TABLE tmp_n2_sessions (item_id BIGINT NOT NULL PRIMARY KEY, c_type VARCHAR(20) NOT NULL, c_amount INT NOT NULL);
INSERT INTO tmp_n2_sessions (item_id, c_type, c_amount) VALUES
  (137,'session',1),
  (139,'session',1),
  (278,'session',1),
  (650,'session',1),
  (440,'session',1),
  (405,'session',1),
  (442,'session',1),
  (1572,'session',1),
  (1602,'session',1),
  (1609,'session',1),
  (1667,'session',1),
  (1668,'session',1),
  (1669,'session',1),
  (1670,'session',1),
  (458,'session',10),
  (895,'month',2),
  (417,'month',3),
  (421,'month',3),
  (666,'day',30);
DELETE t FROM tmp_n2_sessions t JOIN items i ON i.id = t.item_id WHERE i.cycle_amount IS NOT NULL AND i.cycle_amount > 0;
SELECT 'N2 số buổi sẽ điền' AS preview, i.id, i.title, i.cycle_type AS old_type, t.c_type, t.c_amount FROM tmp_n2_sessions t JOIN items i ON i.id = t.item_id ORDER BY i.id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value)
  SELECT @batch, t.item_id, 'sessions', CONCAT(COALESCE(i.cycle_type, ''), ':', COALESCE(i.cycle_amount, '')), CONCAT(t.c_type, ':', t.c_amount) FROM tmp_n2_sessions t JOIN items i ON i.id = t.item_id;
UPDATE items i JOIN tmp_n2_sessions t ON t.item_id = i.id SET i.cycle_type = t.c_type, i.cycle_amount = t.c_amount;

SELECT field, COUNT(*) AS rows_changed FROM item_autofill_log WHERE batch = @batch GROUP BY field ORDER BY field;

-- Đổi ROLLBACK thành COMMIT khi đã xem xong các bảng xem trước.
ROLLBACK;

-- Hoàn tác sau khi đã COMMIT (chạy từng khối):
-- DELETE FROM item_tags;        INSERT INTO item_tags        SELECT * FROM item_tags_bak_n2;
-- DELETE FROM items_categories; INSERT INTO items_categories SELECT * FROM items_categories_bak_n2;
-- UPDATE items i JOIN items_bak_n2 b ON b.id = i.id SET i.ages_min = b.ages_min, i.ages_max = b.ages_max, i.cycle_type = b.cycle_type, i.cycle_amount = b.cycle_amount;
