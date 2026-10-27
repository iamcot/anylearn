-- ================================================================
-- prod_fix_caps_n3.sql
-- Đổi tên khóa học đang viết HOA TOÀN BỘ về cách viết bình thường (137 khóa). Claude đọc từng tên (danh sách G4 của
-- scripts/prod_export_gaps.sql, ngày 2026-10-27): chữ đầu viết hoa, còn lại viết thường, giữ viết hoa cho thương hiệu và
-- từ viết tắt (IELTS, MC, VIP, SNA, KickEnglish, Tynker...), tên tiếng Anh dùng kiểu Title Case.
-- Chỉ đổi khi tên hiện tại vẫn đúng bằng tên cũ trong danh sách (không đè tên đã sửa tay).
--
--   mysql -uROOT -p --table --default-character-set=utf8mb4 anylearn < scripts/prod_fix_caps_n3.sql > preview3.txt
-- Chạy lần đầu để xem (kết thúc bằng ROLLBACK). Hài lòng thì đổi ROLLBACK thành COMMIT, rồi gọi POST /admin/reindex.
-- Sao lưu: items_bak_n3. Mọi thay đổi ghi vào item_autofill_log (batch n3, field title).
-- ================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items_bak_n3 AS SELECT * FROM items;

SET @batch = 'n3';
START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_n3_titles;
CREATE TEMPORARY TABLE tmp_n3_titles (item_id BIGINT NOT NULL PRIMARY KEY, old_title VARCHAR(500) NOT NULL, new_title VARCHAR(500) NOT NULL);
INSERT INTO tmp_n3_titles (item_id, old_title, new_title) VALUES
  (41,'SUMMER CAMP','Summer Camp'),
  (42,'MC CƠ BẢN','MC cơ bản'),
  (45,'SUMMER CAMP','Summer Camp'),
  (63,'SPEAKING WELL - KỸ NĂNG NÓI CHUYỆN TỰ TIN','Speaking Well - kỹ năng nói chuyện tự tin'),
  (64,'SPEAKING WELL - KỸ NĂNG NÓI CHUYỆN TỰ TIN','Speaking Well - kỹ năng nói chuyện tự tin'),
  (68,'KỸ NĂNG GIAO TIẾP VÀ THUYẾT PHỤC KHÁCH HÀNG','Kỹ năng giao tiếp và thuyết phục khách hàng'),
  (88,'CON TỰ LẬP - BA MẸ NHÀN','Con tự lập - ba mẹ nhàn'),
  (98,'KHÓA NHẢY HIỆN ĐẠI - FREESTYLE DANCE CHO BÉ','Khóa nhảy hiện đại - Freestyle Dance cho bé'),
  (99,'KHÓA HỌC MỸ THUẬT SÁNG TẠO DÀNH CHO TRẺ EM','Khóa học mỹ thuật sáng tạo dành cho trẻ em'),
  (102,'HÀNH TRÌNH VỠ LÒNG TIẾNG ANH CÙNG CON','Hành trình vỡ lòng tiếng Anh cùng con'),
  (103,'THUYẾT TRÌNH & KỂ CHUYỆN TIẾNG ANH CÙNG CON','Thuyết trình & kể chuyện tiếng Anh cùng con'),
  (104,'HÀNH TRÌNH TRỞ THÀNH BỐ MẸ SIÊU NHÂN','Hành trình trở thành bố mẹ siêu nhân'),
  (125,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL" VÉ VIP','Workshop "tư duy dạy con từ Israel" vé VIP'),
  (129,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL"','Workshop "tư duy dạy con từ Israel"'),
  (130,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL"','Workshop "tư duy dạy con từ Israel"'),
  (136,'KHOÁ SÁNG TẠO CONTENT “KHÁC MỚI HAY”','Khoá sáng tạo content “khác mới hay”'),
  (137,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL"','Workshop "tư duy dạy con từ Israel"'),
  (138,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL" VÉ VIP','Workshop "tư duy dạy con từ Israel" vé VIP'),
  (139,'WORKSHOP "TƯ DUY DẠY CON TỪ ISRAEL" VÉ VIP','Workshop "tư duy dạy con từ Israel" vé VIP'),
  (151,'KHOÁ SÁNG TẠO CONTENT “KHÁC MỚI HAY”','Khoá sáng tạo content “khác mới hay”'),
  (274,'SUMMER CAMP','Summer Camp'),
  (287,'LẬP TRÌNH TYNKER ONLINE','Lập trình Tynker online'),
  (288,'THẾ GIỚI MINECRAFT CỦA BÉ','Thế giới Minecraft của bé'),
  (289,'SIÊU NHÂN LẬP TRÌNH WEBSITE','Siêu nhân lập trình website'),
  (291,'LẬP TRÌNH GAME & ỨNG DỤNG','Lập trình Game & ứng dụng'),
  (312,'SUPER SUMMER CAMP (TUẦN 3)','Super Summer Camp (tuần 3)'),
  (313,'LẬP TRÌNH ROBLOX','Lập trình Roblox'),
  (321,'PUBLIC SPEAKING KID - ONLINE 4','Public Speaking Kid - online 4'),
  (348,'LUYỆN GIỌNG NÓI - PHÁT ÂM CHUẨN','Luyện giọng nói - phát âm chuẩn'),
  (349,'NGHỆ THUẬT SỬ DỤNG NGÔN TỪ','Nghệ thuật sử dụng ngôn từ'),
  (350,'NGHỆ THUẬT LÀM CHỦ NGÔN NGỮ CƠ THỂ','Nghệ thuật làm chủ ngôn ngữ cơ thể'),
  (351,'03 BÍ KÍP THÀNH CÔNG TRONG GIAO TIẾP','03 bí kíp thành công trong giao tiếp'),
  (352,'KỸ NĂNG THUYẾT TRÌNH CHUYÊN NGHIỆP TRƯỚC CÔNG CHÚNG','Kỹ năng thuyết trình chuyên nghiệp trước công chúng'),
  (353,'NGHỆ THUẬT DẪN CHƯƠNG TRÌNH CHUYÊN NGHIỆP & GIAO TIẾP ĐỈNH CAO','Nghệ thuật dẫn chương trình chuyên nghiệp & giao tiếp đỉnh cao'),
  (355,'BẢN LĨNH TRƯỚC ĐÁM ĐÔNG & TRÊN SÂN KHẤU','Bản lĩnh trước đám đông & trên sân khấu'),
  (356,'KỸ NĂNG XỬ LÝ TÌNH HUỐNG TRƯỚC ĐÁM ĐÔNG & TRÊN SÂN KHẤU','Kỹ năng xử lý tình huống trước đám đông & trên sân khấu'),
  (357,'NGHỆ THUẬT DẪN CHƯƠNG TRÌNH & TỰ TIN GIAO TIẾP (ĐÀO TẠO 01 - 01)','Nghệ thuật dẫn chương trình & tự tin giao tiếp (đào tạo 01 - 01)'),
  (407,'MASTER YOUR VOICE','Master Your Voice'),
  (417,'TIẾNG ANH THIẾU NIÊN KHÓA 3 THÁNG','Tiếng anh thiếu niên khóa 3 tháng'),
  (418,'LỚP IELTS BAND 5.0-6.5 KHÓA 6 THÁNG','Lớp IELTS Band 5.0-6.5 khóa 6 tháng'),
  (419,'LỚP IELTS BAND 4.0-5.0 KHÓA 6 THÁNG','Lớp IELTS Band 4.0-5.0 khóa 6 tháng'),
  (421,'TIẾNG ANH THIẾU NHI KHÓA 3 THÁNG','Tiếng anh thiếu nhi khóa 3 tháng'),
  (422,'TIẾNG ANH THIẾU NHI KHÓA 6 THÁNG','Tiếng anh thiếu nhi khóa 6 tháng'),
  (423,'TIẾNG ANH THIẾU NHI KHÓA 12 THÁNG','Tiếng anh thiếu nhi khóa 12 tháng'),
  (424,'TIẾNG ANH THIẾU NIÊN KHÓA 6 THÁNG','Tiếng anh thiếu niên khóa 6 tháng'),
  (425,'TIẾNG ANH THIẾU NIÊN KHÓA 12 THÁNG','Tiếng anh thiếu niên khóa 12 tháng'),
  (426,'LỚP IELTS BAND 4.0-5.0 KHÓA 3 THÁNG','Lớp IELTS Band 4.0-5.0 khóa 3 tháng'),
  (427,'LỚP IELTS BAND 5.0-6.5 KHÓA 3 THÁNG','Lớp IELTS Band 5.0-6.5 khóa 3 tháng'),
  (438,'TUYỆT CHIÊU NUÔI DẠY CON THÀNH TÀI','Tuyệt chiêu nuôi dạy con thành tài'),
  (439,'TUYỆT CHIÊU NUÔI DẠY CON THÀNH TÀI','Tuyệt chiêu nuôi dạy con thành tài'),
  (446,'BÍ QUYẾT GIÚP CON TẬP TRUNG HỌC TẬP','Bí quyết giúp con tập trung học tập'),
  (449,'SỐNG ƯỚC MƠ VÀ KHÁT VỌNG','Sống ước mơ và khát vọng'),
  (460,'CHA MẸ HIỀN TÀI','Cha mẹ hiền tài'),
  (463,'KICKENGLISH VIP - GÓI 3 THÁNG','KickEnglish VIP - gói 3 tháng'),
  (464,'KICKENGLISH VIP - GÓI 1 NĂM','KickEnglish VIP - gói 1 năm'),
  (465,'KICKENGLISH VIP - GÓI TRỌN ĐỜI','KickEnglish VIP - gói trọn đời'),
  (466,'KICKKIDS VIP - GÓI 1 NĂM','KickKids VIP - gói 1 năm'),
  (467,'KICKKIDS VIP - GÓI 3 NĂM','KickKids VIP - gói 3 năm'),
  (468,'KICKKIDS VIP - GÓI 5 NĂM','KickKids VIP - gói 5 năm'),
  (480,'CHA MẸ HIỀN TÀI','Cha mẹ hiền tài'),
  (483,'ƯƠM MẦM HIỀN TÀI','Ươm mầm hiền tài'),
  (486,'ANH VĂN THIẾU NHI ONLINE','Anh văn thiếu nhi online'),
  (488,'LUYỆN THI ONLINE CAMBRIDGE ENGLISH: STARTERS, MOVERS FLYERS','Luyện thi online Cambridge English: Starters, Movers Flyers'),
  (490,'IELTS ONLINE 1 KÈM 1','IELTS online 1 kèm 1'),
  (538,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (539,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (543,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (544,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (545,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (546,'TRẠI HÈ E2 2022 - BIỆT ĐỘI THÁM HIỂM THIÊN NHIÊN SIÊU ĐẲNG','Trại hè E2 2022 - biệt đội thám hiểm thiên nhiên siêu đẳng'),
  (555,'KHÓA HỌC PIANO','Khóa học piano'),
  (557,'KHOÁ HỌC ĐÀN PIANO','Khoá học đàn piano'),
  (558,'KHOÁ HỌC ĐÀN PIANO SƠ CẤP','Khoá học đàn piano sơ cấp'),
  (559,'KHÓA HỌC ĐÀN GUITAR SƠ CẤP','Khóa học đàn guitar sơ cấp'),
  (560,'KHÓA HỌC ĐÀN GUITAR','Khóa học đàn guitar'),
  (562,'WANDER SCIENCE - PHÉP MÀU KHOA HỌC','Wander Science - phép màu khoa học'),
  (593,'GIÚP CON THÀNH CÔNG TRONG MÔI TRƯỜNG GIÁO DỤC QUỐC TẾ','Giúp con thành công trong môi trường giáo dục quốc tế'),
  (595,'TRẢI NGHIỆM TRẠI HÈ KHÁM PHÁ THIÊN NHIÊN HOÀN TOÀN MIỄN PHÍ','Trải nghiệm trại hè khám phá thiên nhiên hoàn toàn miễn phí'),
  (600,'EAGLE CAMP – MUÔN NGÀN HOẠT ĐỘNG, HỌC VẠN ĐIỀU HAY! (TIỂU HỌC - 6 TUẦN)','Eagle Camp – muôn ngàn hoạt động, học vạn điều hay! (tiểu học - 6 tuần)'),
  (607,'TRẢI NGHIỆM TRẠI HÈ KHÁM PHÁ THIÊN NHIÊN HOÀN TOÀN MIỄN PHÍ','Trải nghiệm trại hè khám phá thiên nhiên hoàn toàn miễn phí'),
  (608,'TRẢI NGHIỆM TRẠI HÈ KHÁM PHÁ THIÊN NHIÊN HOÀN TOÀN MIỄN PHÍ','Trải nghiệm trại hè khám phá thiên nhiên hoàn toàn miễn phí'),
  (609,'TRẢI NGHIỆM TRẠI HÈ KHÁM PHÁ THIÊN NHIÊN HOÀN TOÀN MIỄN PHÍ','Trải nghiệm trại hè khám phá thiên nhiên hoàn toàn miễn phí'),
  (610,'SNA - SUMMER EAGLE CAMP 6 WEEKS (PRIMARY) (2022-2023)','SNA - Summer Eagle Camp 6 weeks (Primary) (2022-2023)'),
  (613,'SPACE EXPLORATION CAMP 2022 - 4 WEEKS (GRADE 1 - 7)','Space Exploration Camp 2022 - 4 weeks (Grade 1 - 7)'),
  (614,'SPACE EXPLORATION CAMP','Space Exploration Camp'),
  (616,'SNA - SUMMER EAGLE CAMP 6 WEEKS (SECONDARY) (2022-2023)','SNA - Summer Eagle Camp 6 weeks (Secondary) (2022-2023)'),
  (617,'GÓI ĐẦU TƯ GIÁO DỤC 5 NĂM (TIỂU HỌC) (2022-2023)','Gói đầu tư giáo dục 5 năm (tiểu học) (2022-2023)'),
  (618,'GÓI ĐẦU TƯ GIÁO DỤC 5 NĂM (TRUNG HỌC) (2022-2023)','Gói đầu tư giáo dục 5 năm (trung học) (2022-2023)'),
  (619,'GÓI ĐẦU TƯ GIÁO DỤC 7 NĂM (2022-2023)','Gói đầu tư giáo dục 7 năm (2022-2023)'),
  (620,'GÓI ĐẦU TƯ GIÁO DỤC 12 NĂM (2022-2023)','Gói đầu tư giáo dục 12 năm (2022-2023)'),
  (625,'SPACE EXPLORATION CAMP 2022 - 1 WEEK (GRADE 1 - 6)','Space Exploration Camp 2022 - 1 week (Grade 1 - 6)'),
  (626,'SPACE EXPLORATION CAMP','Space Exploration Camp'),
  (643,'KHAI GIẢNG LỚP KHÁM PHÁ THẾ GIỚI ÂM NHẠC CHO BÉ TỪ 4-8 TUỔI NGÀY 02/07/2022.','Khai giảng lớp khám phá thế giới âm nhạc cho bé từ 4-8 tuổi ngày 02/07/2022.'),
  (653,'KHO TÀNG 8 CÂU CHUYỆN KINH ĐIỂN VỀ DẠY CON DO THÁI','Kho tàng 8 câu chuyện kinh điển về dạy con Do Thái'),
  (660,'BỘ 10 VIDEO DẠY CON XUẤT CHÚNG CỦA NGƯỜI DO THÁI','Bộ 10 video dạy con xuất chúng của người Do Thái'),
  (769,'LẬP TRÌNH & CHẾ TẠO ROBOT','Lập trình & chế tạo robot'),
  (857,'GLASS PAINTING','Glass Painting'),
  (859,'CHÉP TRANH','Chép tranh'),
  (896,'MC KID ONLINE - 3 THÁNG','MC Kid online - 3 tháng'),
  (902,'CHA MẸ HỌC - CON THÀNH TÀI','Cha mẹ học - con thành tài'),
  (1069,'PYTHON CĂN BẢN','Python căn bản'),
  (1070,'PYTHON CĂN BẢN DÀNH CHO HỌC SINH','Python căn bản dành cho học sinh'),
  (1116,'KHOÁ HỌC LẬP TRÌNH GAME VỚI UNITY','Khoá học lập trình Game với Unity'),
  (1117,'KHOÁ HỌC TRỞ THÀNH LẬP TRÌNH VIÊN FRONT-END','Khoá học trở thành lập trình viên Front-end'),
  (1150,'LEAD THE FUTURE 17/06','Lead the Future 17/06'),
  (1165,'LEAD THE FUTURE 24/06','Lead the Future 24/06'),
  (1166,'LEAD THE FUTURE 3 THÁNG','Lead the Future 3 tháng'),
  (1167,'LEAD THE FUTURE 01/07','Lead the Future 01/07'),
  (1176,'LỚP TOÁN 7 CỦNG CỐ KIẾN THỨC ÔN THI VÀO CẤP 3','Lớp Toán 7 củng cố kiến thức ôn thi vào cấp 3'),
  (1177,'LỚP TOÁN 8.1 ÔN THI CẤP 3 - MỤC TIÊU 9 ĐIỂM TOÁN','Lớp Toán 8.1 ôn thi cấp 3 - mục tiêu 9 điểm toán'),
  (1178,'LỚP TOÁN 8.2 ÔN THI CẤP 3- MỤC TIÊU 9 ĐIỂM','Lớp Toán 8.2 ôn thi cấp 3- mục tiêu 9 điểm'),
  (1179,'LỚP TOÁN 9- ÔN THI CẤP 3- MỤC TIÊU 9 ĐIỂM','Lớp Toán 9- ôn thi cấp 3- mục tiêu 9 điểm'),
  (1196,'LEAD THE FUTURE 6 THÁNG','Lead the Future 6 tháng'),
  (1215,'LỄ RA MẮT LEAD THE FUTURE','Lễ ra mắt Lead the Future'),
  (1323,'LEAD THE FUTURE THĂM LÀNG TRẺ EM SOS','Lead the Future thăm làng trẻ em SOS'),
  (1388,'FOUNDATION OF 3D ARTIST','Foundation of 3D Artist'),
  (1389,'GRAPHIC DESIGN FOUNDATION','Graphic Design Foundation'),
  (1390,'THIẾT KẾ NHẬN DIỆN THƯƠNG HIỆU','Thiết kế nhận diện thương hiệu'),
  (1391,'3D BLENDER PRODUCT ADVERTISING','3D Blender Product Advertising'),
  (1392,'THIẾT KẾ TRUYỀN THÔNG QUẢNG CÁO','Thiết kế truyền thông quảng cáo'),
  (1393,'ARTIST FOUNDATION','Artist Foundation'),
  (1394,'HỌA SĨ MINH HỌA PHONG CÁCH COMIC','Họa sĩ minh họa phong cách Comic'),
  (1395,'HỌA SĨ VẼ MINH HỌA 2D','Họa sĩ vẽ minh họa 2D'),
  (1396,'THIẾT KẾ NHÂN VẬT PHONG CÁCH ANIME','Thiết kế nhân vật phong cách Anime'),
  (1397,'HỌA SĨ THIẾT KẾ GAME ART 2D','Họa sĩ thiết kế Game Art 2D'),
  (1401,'DIGITAL PAINTING FUNDAMENTAL','Digital Painting Fundamental'),
  (1402,'VẼ HOA TRANG TRÍ BẰNG MÀU GOUACHE & LÀM GIẤY THỦ CÔNG','Vẽ hoa trang trí bằng màu Gouache & làm giấy thủ công'),
  (1403,'KHÁM PHÁ KỸ THUẬT VẼ TRANH PHONG CẢNH MÀU GOUACHE','Khám phá kỹ thuật vẽ tranh phong cảnh màu Gouache'),
  (1404,'3D GAME EVIRONMENT MODELING & TEXTURE','3D Game Evironment Modeling & Texture'),
  (1405,'3D GAME ART CHARACTER PORTRAIT','3D Game Art Character Portrait'),
  (1409,'BUỔI HỌC TRẢI NGHIỆM LỚP MODEL KID','Buổi học trải nghiệm lớp Model Kid'),
  (1410,'KHÓA HỌC PROFESSIONAL MODEL','Khóa học Professional Model'),
  (1422,'ADOBE PHOTOSHOP TOOLS FOR DESIGN','Adobe Photoshop Tools for Design'),
  (1423,'THIẾT KẾ ĐỒ HỌA 2D: CÔNG CỤ & THIẾT KẾ STICKER','Thiết kế đồ họa 2D: công cụ & thiết kế sticker'),
  (1424,'ADOBE PHOTOSHOP TOOLS FOR DIGITAL PAINTING','Adobe Photoshop Tools for Digital Painting'),
  (1477,'HỌC VÀ LUYỆN THI IELTS','Học và luyện thi IELTS'),
  (1685,'KHÓA HỌC MC CHUYÊN NGHIỆP – DẪN CHƯƠNG TRÌNH BẰNG NỘI LỰC','Khóa học MC chuyên nghiệp – dẫn chương trình bằng nội lực');

-- chỉ đổi khi tên hiện tại còn đúng là tên cũ (so sánh chính xác chữ hoa)
DELETE t FROM tmp_n3_titles t LEFT JOIN items i ON i.id = t.item_id WHERE i.id IS NULL OR CAST(i.title AS BINARY) <> CAST(t.old_title AS BINARY);
SELECT 'N3 tên sẽ đổi' AS preview, t.item_id, t.old_title, t.new_title FROM tmp_n3_titles t ORDER BY t.item_id;
INSERT INTO item_autofill_log (batch, item_id, field, old_value, new_value) SELECT @batch, item_id, 'title', LEFT(old_title, 255), LEFT(new_title, 255) FROM tmp_n3_titles;
UPDATE items i JOIN tmp_n3_titles t ON t.item_id = i.id SET i.title = t.new_title;

SELECT field, COUNT(*) AS rows_changed FROM item_autofill_log WHERE batch = @batch GROUP BY field;

-- Đổi ROLLBACK thành COMMIT khi đã xem xong bảng xem trước.
ROLLBACK;

-- Hoàn tác sau khi đã COMMIT:
-- UPDATE items i JOIN items_bak_n3 b ON b.id = i.id SET i.title = b.title;
