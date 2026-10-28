# Plan 17: Bán khóa học video

Mục tiêu: admin dựng khóa học video (chương, bài, video trên Bunny Stream), chọn bài xem thử; người học xem trong app, học tiếp từ chỗ dừng, đặt lịch tự học để được nhắc, và gần xong thì được gợi ý khóa tiếp theo.

## 0. Hiện trạng (đọc từ code)

- Khóa video = `items.subtype = 'video'` (`ItemConstants.SUBTYPE_VIDEO`). Đã không cần địa chỉ (`ItemAddressRules`), không cần lớp (`ItemAttributeGaps`). Mua bình thường qua giỏ hàng: duyệt đơn tạo `user_course_enrollments` (không lớp → `status = active`, người học là tài khoản hoặc bé).
- Ba bảng của portal cũ còn trong V1, có entity + repository nhưng **không code nào đọc/ghi**:
  - `item_video_chapters` (item_id, chapter_no, title, description varchar(191) NOT NULL, status).
  - `item_video_lessons` (item_id, chapter_id, lesson_no, title, description varchar(191), `length` text, status, `is_free`, `type`, `type_value` text).
  - `item_video_lesson_user_links` (lesson_id, user_id, `checkpoint` varchar, `complete`), không có khóa duy nhất.
- Chủ sản phẩm đã chọn giữ "video bài giảng" (PROGRESS 26/10/2026).
- Bunny Stream đã có (plan 15.9, 16): `BunnyStreamClient.createUpload` + TUS từ trình duyệt (`anylearn_admin` `UploadTray`, `videoUploads.js`), link phát `https://{cdn}/{videoId}/playlist.m3u8`, FE phát HLS (`lib/explore/media.ts`, `hls.js`).

## 1. Dùng lại 3 bảng: có, sửa bằng migration V66

Hai bảng chương / bài khớp đúng ý (chương → bài, `is_free`, thứ tự), chỉ thiếu chỗ cho video Bunny và mô tả dài. Bảng tiến độ có ý đúng nhưng thiếu khóa duy nhất và vị trí dạng số, nên sửa luôn. Không đổi tên bảng (entity đã có).

V66 (chỉ ALTER, bảng gần như rỗng; nếu prod có dòng cũ của portal thì giữ, chỉ đổi kiểu cột):

- `item_video_chapters`: `description` → TEXT NULL; thêm index (item_id, chapter_no).
- `item_video_lessons`:
  - `description` → TEXT NULL.
  - thêm `video_id` varchar(64) (guid Bunny), `duration_seconds` int NULL (Bunny trả về sau khi xử lý xong), `poster_url`, `video_status` (uploading / processing / ready / failed).
  - `type` giữ: `video` (Bunny) | `link` (YouTube / link ngoài, `type_value` là link) | `text` (bài đọc, `type_value` là nội dung). `length` cũ bỏ đọc.
  - thêm `attachments` JSON NULL (tài liệu kèm: tên + link) — tùy chọn.
- `item_video_lesson_user_links` (tiến độ):
  - thêm `learner_id` bigint (người học: tài khoản hoặc bé, như enrollment), `item_id`, `position_seconds` int, `watched_seconds` int (tổng thời gian thật đã xem, để chặn tua), `completed_at`; `checkpoint` cũ bỏ đọc.
  - `user_id` = tài khoản đang xem (phụ huynh), giữ để biết ai bấm.
  - UNIQUE (learner_id, item_video_lesson_id).

## 2. Admin (back office)

- Trang khóa học (`ItemDetail.jsx`), khi `subtype = video` có tab **"Nội dung video"**:
  - Danh sách chương (kéo lên/xuống, thêm, sửa tên + mô tả, ẩn).
  - Trong chương: các bài (tiêu đề, mô tả, loại, video, thời lượng, ảnh bìa, công tắc **"Xem thử miễn phí"**, ẩn/hiện, thứ tự).
  - Tải video: dùng lại khay tải `UploadTray` (TUS lên Bunny, có %, đổi trang vẫn chạy). Tải xong bài ở `processing`; backend hỏi Bunny (`GET /library/{id}/videos/{guid}`) để lấy thời lượng + trạng thái, bài chỉ phát được khi `ready`.
  - Tóm tắt trên đầu tab: số chương, số bài, tổng thời lượng, số bài xem thử, bài lỗi/đang xử lý.
- API `/admin/items/{id}/video/*`: `GET` cây chương-bài; `POST/PUT/DELETE chapters`, `POST/PUT/DELETE lessons`, `PUT order` (thứ tự cả cây), `POST lessons/{id}/upload` (tạo video Bunny + chữ ký TUS), `POST lessons/{id}/refresh` (hỏi lại Bunny). Xóa bài → xóa video Bunny (`deleteVideoOf`).
- Khóa video chưa có bài nào phát được → hiện trong "Thiếu thuộc tính" (`ItemAttributeGaps`) và không mở bán được (cảnh báo khi duyệt).

## 3. Bảo vệ video trả phí

- Video bán tiền không được để link `playlist.m3u8` công khai như clip Khám phá.
- Cách làm: **một thư viện Bunny riêng cho khóa học** có bật Token Authentication (CDN token). Server chỉ trả link đã ký, hạn vài giờ, khi người xem có quyền (bài free, hoặc tài khoản / bé có enrollment `active` của khóa). Clip Khám phá vẫn ở thư viện cũ, không bị ảnh hưởng.
- Env mới: `BUNNY_COURSE_LIBRARY_ID`, `BUNNY_COURSE_API_KEY`, `BUNNY_COURSE_CDN_HOST`, `BUNNY_COURSE_TOKEN_KEY` (thêm đủ 3 chỗ theo "Production env checklist"). Trống = dùng thư viện Khám phá và không ký (chỉ hợp cho dev).
- Không DRM (Bunny có MediaCage nhưng tốn tiền và phức tạp; để sau nếu thấy bị chia sẻ). Thêm watermark mờ SĐT cuối của người xem đè trên player để ngại quay màn hình.

## 4. Quyền xem

- Bài `is_free = 1`: ai cũng xem (khách chưa đăng nhập cũng được, chỉ không lưu tiến độ).
- Bài còn lại: tài khoản có enrollment `active` của khóa cho chính mình hoặc cho một bé của mình; admin và đối tác của khóa xem được hết.
- Thời hạn: mặc định **trọn đời**. Nếu khóa có `cycle_type`/`cycle_amount` thì enrollment có `end_date` như hiện nay, hết hạn thì khóa lại (chỉ còn bài free) và hiện nút "Gia hạn" (dùng lại `RenewalService`).
- Luật thuần `VideoAccessRules` (có test).

## 5. Người học

### 5.1 Trang khóa học (PDP) loại video

- Khối **"Nội dung khóa học"**: các chương (mở/gập), mỗi bài có tiêu đề, thời lượng, nhãn "Học thử" + nút **"Học thử"** cho bài free, ổ khóa cho bài trả phí. Tổng: "8 chương · 42 bài · 6 giờ 30 phút".
- Đã mua: nút đăng ký đổi thành **"Học tiếp: Bài 5 – …"** (hoặc "Bắt đầu học"), thanh % hoàn thành, mỗi bài có dấu ✓ đã xong.
- `GET /api/items/{id}/video-outline?learnerId=` (công khai: cây chương-bài không kèm link; có đăng nhập thì thêm tiến độ và `canWatch`).

### 5.2 Trang học `/learn/[itemId]?lesson=&learner=`

- Toàn trang, nút back: player HLS trên cùng, dưới là tiêu đề + mô tả + tài liệu, rồi danh sách bài (bài đang học tô màu). Trên phone, danh sách bài là tab "Bài học".
- Mở trang không có `lesson` → vào bài đang dở (hoặc bài chưa xong đầu tiên), tua tới `position_seconds`.
- Hết bài → đếm 5 giây rồi sang bài kế ("Bài tiếp theo").
- Chọn người học khi tài khoản mua cho nhiều bé (giống `/account/schedule`).
- `GET /api/learn/lessons/{id}/play?learnerId=` → `{url (đã ký), poster, positionSeconds, durationSeconds}` hoặc 403 kèm lý do (cần mua / hết hạn).

### 5.3 Học tiếp từ chỗ dừng

- Player gửi `POST /api/learn/progress {lessonId, learnerId, positionSeconds, watchedDelta}` mỗi 15 giây, khi tạm dừng, khi rời trang (`sendBeacon`).
- Bài **xong** khi xem tới ≥ 90% thời lượng **và** tổng thời gian xem thật ≥ 70% (không tính tua) — luật thuần `VideoProgressRules` (có test). Bài loại text/link: bấm "Đánh dấu đã học".
- % khóa = số bài xong / số bài đang hiện.

### 5.4 Danh sách khóa video của tôi

- `/account` thêm mục **"Khóa học video"** (`/account/videos`): thẻ từng khóa (ảnh, tên, người học, % thanh tiến độ, "Học tiếp bài …", lịch tự học nếu có). Lọc theo bé như trang khác.
- `/today`: thẻ **"Học tiếp"** cho khóa video đang dở (tối đa 2), và nếu hôm nay là ngày trong lịch tự học thì hiện như một buổi học ("20:00 · Tự học video · Khóa X").
- `GET /api/learn/my-courses?learnerId=`.

### 5.5 Lịch tự học + nhắc

- Trên trang khóa của tôi / trang học: **"Đặt lịch học"**: chọn các thứ trong tuần + giờ (vd T3, T5, T7 lúc 20:00), số bài mỗi buổi (gợi ý, không bắt buộc).
- Bảng mới `video_study_plans` (learner_id, item_id, weekdays, time, lessons_per_session, enabled, account user_id), UNIQUE (learner_id, item_id).
- Nhắc: job 15 phút (cùng chỗ `ScheduleNotificationService` hoặc job riêng) gửi `video_study_reminder` (chuông + push, topic `schedule` để người dùng tắt được trong "Thông báo") **lúc tới giờ**, kèm link `/learn/{itemId}`; bỏ qua nếu hôm đó đã học ≥ 1 bài. Mỗi buổi gửi 1 lần (dedup qua `lifecycle_messages`-style key `video-study:{planId}:{date}`).
- Không có lịch: sau 7 ngày không mở khóa đang dở thì nhắc nhẹ 1 lần (`video_idle`), tắt được trong Vận hành.

### 5.6 Gần xong → gợi ý khóa mới

- Khi % khóa vượt `video/suggest_percent` (mặc định 80%) và khi xong 100%: một lần mỗi mốc, gửi thông báo + thẻ gợi ý trên trang học và `/account/videos`.
- Nguồn gợi ý: bước kế của lộ trình (pathway) nếu khóa nằm trong lộ trình, rồi khóa khác của cùng đối tác, rồi cùng tag/lĩnh vực; dùng lại `RecommendationService` với `context = video_done` (đếm view/click như các thẻ gợi ý khác).
- Học xong 100%: chúc mừng, mời đánh giá (đã có review), (sau này) chứng nhận.

## 6. Cài đặt (Cài đặt > Vận hành)

`video/suggest_percent` (80), `video/complete_percent` (90), `video/min_watch_percent` (70), `video/idle_remind_days` (7, 0 = tắt), `video/play_link_hours` (4).

## 7. Chia việc

| # | Việc | Ghi chú |
|---|---|---|
| 17.1 | V66 + entity + `VideoCourseService` + API admin + tab "Nội dung video" + upload Bunny | |
| 17.2 | Quyền xem + link ký (thư viện riêng, env) | cần chủ sản phẩm tạo thư viện Bunny thứ 2 |
| 17.3 | PDP khối nội dung + nút học thử + trang `/learn` + lưu tiến độ | |
| 17.4 | `/account/videos` + thẻ `/today` | |
| 17.5 | Lịch tự học + nhắc | |
| 17.6 | Gợi ý khi gần xong | |
| 17.7 | `docs/huong-dan-admin.md`, `CLAUDE.md`, `http/learn.http` | |

## 8. Câu hỏi cho chủ sản phẩm

1. Video trả phí đặt ở **thư viện Bunny riêng có ký link** (đề xuất) hay dùng chung thư viện Khám phá (đơn giản, nhưng ai có link là xem được)?
2. Thời hạn xem: **trọn đời** (đề xuất), hoặc theo `cycle` của khóa nếu admin nhập?
3. Tiến độ tính theo **người học** (bé), phụ huynh mua cho 2 bé thì mỗi bé một tiến độ (đề xuất)?
4. Đối tác có tự tải video lên không, hay chỉ admin (đề xuất: chỉ admin trước)?
