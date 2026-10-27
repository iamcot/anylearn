-- Demo data for /today. Local DB only. Safe to run again: it deletes its own rows first.
-- Demo rows are tagged by phone prefix 0999000 (users), title prefix [DEMO] (items, locations).
-- Test accounts: ?api_token=demo_parent_token (parent, 2 kids) and ?api_token=demo_student_token (no kids).

SET @today = CURDATE();
SET @wd0 = LOWER(LEFT(DAYNAME(@today), 3));
SET @wd1 = LOWER(LEFT(DAYNAME(@today + INTERVAL 1 DAY), 3));
SET @wd3 = LOWER(LEFT(DAYNAME(@today + INTERVAL 3 DAY), 3));

DELETE FROM recommendation_events WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM recommendation_dismissals WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM pathway_steps WHERE pathway_id IN (SELECT id FROM pathways WHERE slug LIKE 'demo-%');
DELETE FROM pathways WHERE slug LIKE 'demo-%';
DELETE FROM collection_items WHERE collection_id IN (SELECT id FROM collections WHERE slug LIKE 'demo-%');
DELETE FROM collections WHERE slug LIKE 'demo-%';
DELETE FROM learner_interests WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM lifecycle_messages WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM enrollment_feedback WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM session_attendances WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM schedule_requests WHERE learner_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM item_user_actions WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM notifications WHERE route = '/admin/schedule-requests' AND content LIKE 'Demo %';
DELETE FROM order_details WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '0999000%');
DELETE FROM user_course_enrollments WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '0999000%')
   OR item_id IN (SELECT id FROM items WHERE title LIKE '[DEMO]%');
DELETE FROM item_schedules WHERE item_id IN (SELECT id FROM items WHERE title LIKE '[DEMO]%');
DELETE FROM items WHERE title LIKE '[DEMO]%';
DELETE FROM user_locations WHERE title LIKE '[DEMO]%';
DELETE FROM users WHERE phone LIKE '0999000%';

-- People
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc, api_token)
VALUES ('Demo Mẹ Bin', '09990000001', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOPARENT', 'member', 1, 1, 1, 'demo_parent_token');
SET @parent = LAST_INSERT_ID();
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc, is_child, user_id)
VALUES ('Bin', '09990000011', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOBIN', 'member', 1, 1, 1, 1, @parent);
SET @bin = LAST_INSERT_ID();
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc, is_child, user_id)
VALUES ('Su', '09990000012', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOSU', 'member', 1, 1, 1, 1, @parent);
SET @su = LAST_INSERT_ID();
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc, api_token)
VALUES ('Demo Sinh viên', '09990000002', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOSTUDENT', 'member', 1, 1, 1, 'demo_student_token');
SET @student = LAST_INSERT_ID();
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc)
VALUES ('Cô Lan', '09990000101', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOLAN', 'teacher', 1, 1, 1);
SET @lan = LAST_INSERT_ID();
INSERT INTO users (name, phone, password, refcode, role, status, is_test, update_doc)
VALUES ('Thầy Minh', '09990000102', '$2a$10$ritZijv9BLe8rsJPS8J4LeDebrugFBftPPZ7bhwDd/NluBz3fgfFS', 'DEMOMINH', 'teacher', 1, 1, 1);
SET @minh = LAST_INSERT_ID();

-- Place
INSERT INTO user_locations (user_id, title, address, latitude, longitude, ward_code, district_code, province_code, ward_path, status, is_head)
VALUES (@lan, '[DEMO] Cơ sở Quận 3', '294 Điện Biên Phủ, Phường 7, Quận 3, TP.HCM', '10.7769', '106.6867', '1', '1', '79', 'demo', 1, 0);
SET @place = LAST_INSERT_ID();

-- Items: 4 classes, 1 extra, 1 fee item
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id)
VALUES ('[DEMO] Tiếng Anh giao tiếp 2', 'class', 'offline', @lan, 1, 1, 1, 3600000, @today - INTERVAL 60 DAY, 'session', 12, @place);
SET @eng = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount)
VALUES ('[DEMO] Kỹ năng sống: Làm chủ cảm xúc', 'class', 'online', @minh, 1, 1, 1, 1400000, @today - INTERVAL 60 DAY, 'session', 7);
SET @life = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, location)
VALUES ('[DEMO] Dã ngoại Củ Chi', 'class', 'extra', @lan, 1, 1, 1, 450000, @today - INTERVAL 60 DAY, 'Địa đạo Củ Chi, Huyện Củ Chi, TP.HCM');
SET @trip = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id)
VALUES ('[DEMO] Vẽ sáng tạo', 'class', 'offline', @minh, 1, 1, 1, 1500000, @today - INTERVAL 60 DAY, 'session', 10, @place);
SET @paint = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id)
VALUES ('[DEMO] Piano cơ bản', 'class', 'offline', @minh, 1, 1, 1, 1200000, @today - INTERVAL 60 DAY, 'session', 4, @place);
SET @piano = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, is_paymentfee, nolimit_time)
VALUES ('[DEMO] Học phí lớp 3A', 'class', 'offline', @lan, 1, 1, 1, 2500000, @today - INTERVAL 60 DAY, 'month', 1, 1, '1');
SET @fee = LAST_INSERT_ID();
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount)
VALUES ('[DEMO] IELTS Writing', 'class', 'online', @minh, 1, 1, 1, 4800000, @today - INTERVAL 60 DAY, 'session', 8);
SET @ielts = LAST_INSERT_ID();

-- Schedules (today's weekday = @wd0, tomorrow = @wd1)
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, location_note, user_location_id)
VALUES (@eng, 'Lớp tối', 'recurring', CONCAT(@wd0, ',', @wd3), '17:30', '19:00', 'Phòng 204', @place);
SET @s_eng = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, meeting_url, meeting_id, meeting_passcode)
VALUES (@life, 'Ca tối', 'recurring', @wd0, '19:45', '21:00', 'https://zoom.us/j/1234567890', '123 456 7890', 'abc123');
SET @s_life = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, event_date, time_start, time_end, gather_time, bring_items, location_note)
VALUES (@trip, 'Chuyến đi', 'event', @today + INTERVAL 2 DAY, '08:00', '16:00', '07:30', 'Nước uống, nón, kem chống nắng, giày thể thao', 'Cổng chính');
SET @s_trip = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, location_note, user_location_id)
VALUES (@paint, 'Ca sáng', 'recurring', @wd1, '09:00', '10:30', 'Phòng vẽ', @place);
SET @s_paint = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, location_note, user_location_id)
VALUES (@piano, 'Ca chiều', 'recurring', @wd1, '15:00', '16:00', 'Phòng 101', @place);
SET @s_piano = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, time_start, time_end, meeting_url, meeting_id, meeting_passcode)
VALUES (@ielts, 'Ca tối', 'recurring', @wd0, '20:00', '21:30', 'https://zoom.us/j/9876543210', '987 654 3210', 'ielts99');
SET @s_ielts = LAST_INSERT_ID();

-- Bin: onsite 8/12, online 5/7 (renew shows), extra in 2 days, fee due in 5 days
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status) VALUES
 (@bin, @eng,  @s_eng,  @today - INTERVAL 28 DAY, @today + INTERVAL 10 DAY, 'active'),
 (@bin, @life, @s_life, @today - INTERVAL 35 DAY, @today + INTERVAL 7 DAY,  'active'),
 (@bin, @trip, @s_trip, @today + INTERVAL 2 DAY,  @today + INTERVAL 2 DAY,  'active'),
 (@bin, @fee,  NULL,    @today - INTERVAL 25 DAY, @today + INTERVAL 5 DAY,  'active');

-- Su: free today, next class tomorrow; piano used up (4/4); fee overdue
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status) VALUES
 (@su, @paint, @s_paint, @today - INTERVAL 12 DAY, @today + INTERVAL 60 DAY, 'active'),
 (@su, @piano, @s_piano, @today - INTERVAL 30 DAY, @today - INTERVAL 6 DAY,  'active'),
 (@su, @fee,   NULL,     @today - INTERVAL 65 DAY, @today - INTERVAL 3 DAY,  'active');

-- Student (no kids): one online class, fee paid far ahead (card hidden)
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status) VALUES
 (@student, @ielts, @s_ielts, @today - INTERVAL 7 DAY,  @today + INTERVAL 42 DAY, 'active'),
 (@student, @fee,   NULL,     @today - INTERVAL 20 DAY, @today + INTERVAL 40 DAY, 'active');

-- Parent as a learner: fee payment waiting for confirmation, nothing else
INSERT INTO orders (user_id, amount, quantity, status, payment) VALUES (@parent, 2500000, 1, 'pay_pending', 'bank_transfer');
SET @order = LAST_INSERT_ID();
INSERT INTO order_details (order_id, user_id, item_id, unit_price, paid_price, quanity, status)
VALUES (@order, @parent, @fee, 2500000, 2500000, 1, 'pay_pending');

-- ── Plan 07 (lifecycle reminders) ───────────────────────────────────────────
-- Bin: [DEMO] Tiếng Anh giao tiếp 2 is past 50% (survey), [DEMO] Kỹ năng sống has 2 sessions left (renew + early bonus),
--      the fee item is due in 5 days (fee reminder). Su: piano used up and the fee is overdue.
-- Added below: Bin starts a class tomorrow (D-1), Su starts one in 3 days (D-3), Su missed her last 2 sessions of a maths class.
SET @wdm1 = LOWER(LEFT(DAYNAME(@today - INTERVAL 1 DAY), 3));
SET @wdm3 = LOWER(LEFT(DAYNAME(@today - INTERVAL 3 DAY), 3));

INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id)
VALUES ('[DEMO] Guitar nhập môn', 'class', 'offline', @minh, 1, 1, 1, 1800000, @today + INTERVAL 1 DAY, 'session', 8, @place);
SET @guitar = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, date_start, time_start, time_end, gather_time, bring_items, location_note, user_location_id)
VALUES (@guitar, 'Ca chiều', 'recurring', @wd1, @today + INTERVAL 1 DAY, '15:00', '16:30', '14:45', 'Đàn guitar (nếu có), sổ ghi chép', 'Phòng 101, tầng 1', @place);
SET @s_guitar = LAST_INSERT_ID();
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status)
VALUES (@bin, @guitar, @s_guitar, @today + INTERVAL 1 DAY, @today + INTERVAL 60 DAY, 'active');

INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount)
VALUES ('[DEMO] Cờ vua cơ bản', 'class', 'online', @lan, 1, 1, 1, 900000, @today + INTERVAL 3 DAY, 'session', 8);
SET @chess = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, date_start, time_start, time_end, meeting_url, gather_time, bring_items)
VALUES (@chess, 'Ca tối', 'recurring', @wd3, @today + INTERVAL 3 DAY, '19:00', '20:00', 'https://zoom.us/j/5555555555', '18:50', 'Bàn cờ, máy tính có camera');
SET @s_chess = LAST_INSERT_ID();
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status)
VALUES (@su, @chess, @s_chess, @today + INTERVAL 3 DAY, @today + INTERVAL 60 DAY, 'active');

INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id)
VALUES ('[DEMO] Toán tư duy', 'class', 'offline', @lan, 1, 1, 1, 2400000, @today - INTERVAL 10 DAY, 'session', 12, @place);
SET @math = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, date_start, time_start, time_end, location_note, user_location_id)
VALUES (@math, 'Ca tối', 'recurring', CONCAT(@wdm1, ',', @wdm3), @today - INTERVAL 10 DAY, '18:00', '19:30', 'Phòng 202', @place);
SET @s_math = LAST_INSERT_ID();
INSERT INTO user_course_enrollments (user_id, item_id, schedule_id, start_date, end_date, status)
VALUES (@su, @math, @s_math, @today - INTERVAL 10 DAY, @today + INTERVAL 40 DAY, 'active');
-- attended the older sessions (5 to 10 days ago), missed the 2 latest (3 days ago and yesterday)
INSERT INTO session_attendances (learner_id, item_schedule_id, session_date, status, source, joined_at)
SELECT @su, @s_math, d, 'attended', 'manual', NOW()
FROM (SELECT @today - INTERVAL n DAY AS d FROM (SELECT 5 n UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) x) days
WHERE LOWER(LEFT(DAYNAME(d), 3)) IN (@wdm1, @wdm3);

-- Local testing settings: send at any hour, a bonus for renewing early. Change them in the back office afterwards.
DELETE FROM configurations WHERE `key` IN ('lifecycle/send_from_hour', 'lifecycle/send_to_hour', 'lifecycle/early_renew_bonus_points');
INSERT INTO configurations (`key`, `value`, `type`, created_at, updated_at) VALUES
 ('lifecycle/send_from_hour', '0', 'text', NOW(), NOW()),
 ('lifecycle/send_to_hour', '24', 'text', NOW(), NOW()),
 ('lifecycle/early_renew_bonus_points', '50', 'text', NOW(), NOW());

-- To receive the emails, put your address on the parent (the demo accounts have none):
--   UPDATE users SET email = 'you@example.com' WHERE api_token = 'demo_parent_token';

-- ── Plan 08 (suggestions) ───────────────────────────────────────────────────
-- Birth dates make age filters and "Su 7 tuổi" texts work.
UPDATE users SET dob = @today - INTERVAL 9 YEAR, dob_year_only = 0 WHERE id = @bin;
UPDATE users SET dob = @today - INTERVAL 7 YEAR, dob_year_only = 0 WHERE id = @su;

-- Pathway "Tiếng Anh": step 1 is Bin's running class, step 2 is new. Expect on /today (Bin): "Bin đang học Tiếng Anh giao tiếp 2, bước tiếp theo ... là Tiếng Anh giao tiếp 3".
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id, ages_min, ages_max)
VALUES ('[DEMO] Tiếng Anh giao tiếp 3', 'class', 'offline', @lan, 1, 1, 1, 3900000, @today + INTERVAL 20 DAY, 'session', 12, @place, 6, 12);
SET @eng3 = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, date_start, time_start, time_end, location_note, user_location_id)
VALUES (@eng3, 'Lớp tối', 'recurring', @wd1, @today + INTERVAL 20 DAY, '18:00', '19:30', 'Phòng 204', @place);
INSERT INTO pathways (slug, title, subtitle, is_active) VALUES ('demo-tieng-anh', '[DEMO] Tiếng Anh giao tiếp', 'Từ giao tiếp 2 đến giao tiếp 3', 1);
SET @pathway = LAST_INSERT_ID();
INSERT INTO pathway_steps (pathway_id, item_id, step_no, note) VALUES (@pathway, @eng, 1, NULL), (@pathway, @eng3, 2, 'Dành cho bé đã xong giao tiếp 2');

-- A paid order of Bin's guitar class: open /order/<id>?status=success as the parent and Su gets suggestions from Thầy Minh (Bin's partner).
INSERT INTO orders (user_id, amount, quantity, status, payment) VALUES (@parent, 1800000, 1, 'delivered', 'bank_transfer');
SET @order2 = LAST_INSERT_ID();
INSERT INTO order_details (order_id, user_id, item_id, unit_price, paid_price, quanity, status)
VALUES (@order2, @bin, @guitar, 1800000, 1800000, 1, 'delivered');
SELECT CONCAT('Demo paid order for the sibling suggestions: /order/', @order2, '?status=success') AS hint;

-- Suggestions only show courses of live partners (active + approved contract, is_signed 99), so mark the two demo partners.
UPDATE users SET is_signed = 99 WHERE id IN (@lan, @minh);

-- Source "season": a collection in season with a new art course (ages 6-12, nobody owns it). Expect "Đang vào mùa: ..." for a child with a free slot.
INSERT INTO items (title, type, subtype, user_id, status, user_status, is_test, price, date_start, cycle_type, cycle_amount, user_location_id, ages_min, ages_max)
VALUES ('[DEMO] Hè vẽ tranh', 'class', 'offline', @minh, 1, 1, 1, 1500000, @today + INTERVAL 10 DAY, 'session', 8, @place, 6, 12);
SET @art = LAST_INSERT_ID();
INSERT INTO item_schedules (item_id, title, schedule_type, weekdays, date_start, time_start, time_end, location_note, user_location_id)
VALUES (@art, 'Lớp sáng', 'recurring', @wd3, @today + INTERVAL 10 DAY, '09:00', '10:30', 'Phòng 101', @place);
INSERT INTO collections (slug, title, subtitle, season_from, season_to, sort_order, is_active)
VALUES ('demo-he-vui', '[DEMO] Hè vui', 'Khóa hè cho bé', @today - INTERVAL 5 DAY, @today + INTERVAL 60 DAY, 0, 1);
INSERT INTO collection_items (collection_id, item_id, sort_order) VALUES (LAST_INSERT_ID(), @art, 0);

-- Source "interest": Su likes art and english (survey of plan 01.5).
INSERT INTO learner_interests (learner_id, tag, source) VALUES (@su, 'art', 'likes'), (@su, 'english', 'likes');

-- To see a "Không quan tâm" effect: dismiss a card as the parent, it stays hidden 30 days. Reset:
--   DELETE FROM recommendation_dismissals WHERE user_id = (SELECT id FROM users WHERE api_token = 'demo_parent_token');
-- Meilisearch based sources (interest) need the courses indexed: POST /admin/reindex once after this seed.
