# 11 – Nhóm chat người cùng lớp (cộng đồng)

Giai đoạn 3 (MVP), giai đoạn 4 (đầy đủ). Trụ cột E.

## Mục tiêu

- Phụ huynh cùng lớp trao đổi (đưa đón chung, hỏi bài, đồ cần mang) **ngay trong anyLEARN** thay vì nhóm Zalo riêng →
  khách quay lại app thường xuyên, anyLEARN là nơi gắn kết lớp học.
- Đối tác/giáo viên thông báo cho cả lớp (đổi phòng, nghỉ học).

## Hiện trạng

- `/today/community` đang là `ComingSoon` ("Cộng đồng mẹ"), sau flag `NEXT_PUBLIC_TODAY_COMMUNITY`.
- Có `NotificationSseService` (SSE) để đẩy realtime; có `social_posts` (tối thiểu).

## Phạm vi nhóm

- **Một nhóm / ca học** (`item_schedule_id`), tự tạo khi có enrollment đầu tiên.
- Thành viên: **tài khoản phụ huynh** (hoặc học viên người lớn) có enrollment còn hiệu lực trong ca đó; đối tác và giáo viên
  của khóa (vai trò `moderator`). Tài khoản con (`is_child`) **không** vào chat.
- Hết khóa: còn đọc được 30 ngày rồi rời nhóm tự động (config).

## An toàn và quyền riêng tư (bắt buộc)

- Không hiện số điện thoại, email của thành viên. Tên hiển thị dạng "Mẹ Bin" (tự chọn khi vào nhóm lần đầu).
- Báo cáo tin nhắn, chặn người, admin/moderator ẩn tin và tạm khóa thành viên.
- Lọc từ cấm cơ bản (danh sách trong config). Cảnh báo khi gửi ảnh có thể chứa trẻ em: chỉ thành viên nhóm xem được,
  link ảnh có ký hạn.
- Cấm quảng cáo/chèo kéo sang trung tâm khác: luật nhóm hiện ở đầu nhóm; admin xử lý báo cáo.
- Điều khoản sử dụng cần bổ sung phần cộng đồng → **chủ sản phẩm duyệt câu chữ**.

## Dữ liệu

```sql
CREATE TABLE chat_rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_schedule_id BIGINT NOT NULL UNIQUE,
  item_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_locked TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);
CREATE TABLE chat_members (
  room_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',   -- member / moderator
  display_name VARCHAR(100) NOT NULL,
  last_read_message_id BIGINT NULL,
  muted_until DATETIME NULL, banned TINYINT NOT NULL DEFAULT 0,
  joined_at DATETIME NOT NULL, left_at DATETIME NULL,
  PRIMARY KEY (room_id, user_id)
);
CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'text',     -- text / image / announcement / system
  body TEXT NULL, media_url VARCHAR(500) NULL,
  reply_to_id BIGINT NULL,
  is_hidden TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  INDEX idx_chat_messages_room (room_id, id)
);
CREATE TABLE chat_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, message_id BIGINT NOT NULL, reporter_id BIGINT NOT NULL,
  reason VARCHAR(255), status VARCHAR(20) NOT NULL DEFAULT 'open', created_at DATETIME NOT NULL
);
```

## Task

### 11.1 MVP backend
- Đồng bộ thành viên từ `user_course_enrollments` (khi enrollment tạo/kết thúc + job đối soát mỗi đêm).
- API: danh sách phòng của tôi (kèm số tin chưa đọc), lấy tin (phân trang theo `id` lùi), gửi tin, đánh dấu đã đọc,
  báo cáo. Kiểm tra quyền thành viên ở **mọi** endpoint.
- Realtime: đẩy tin mới qua SSE hiện có (`NotificationSseService`) theo kênh phòng; client fallback poll 10 giây.
  Server 2 core/4GB: không thêm WebSocket broker riêng ở MVP.
- Rate limit gửi tin (ví dụ 20 tin/phút/người, config).

### 11.2 MVP FE
- `/today/community` → danh sách nhóm lớp; `/today/community/[roomId]` → màn chat mobile-first (input dính đáy,
  tin nhắn theo ngày, ảnh, trả lời tin).
- Lần đầu vào: chọn tên hiển thị + đồng ý nội quy.
- Badge số tin chưa đọc ở bottom tab "Cộng đồng".
- Trang ca học/PDP của khóa đã mua: nút "Nhóm lớp".

### 11.3 Thông báo
- Push/in-app khi có tin mới (gộp: tối đa 1 thông báo / phòng / 30 phút), tin `announcement` của moderator luôn báo.
- Tôn trọng cài đặt thông báo (plan 06.4), cho tắt tiếng từng nhóm.

### 11.4 Kiểm duyệt (admin + đối tác)
- Admin: trang "Báo cáo chat" xử lý báo cáo, ẩn tin, khóa thành viên/khóa phòng.
- Đối tác/giáo viên: gửi thông báo cả lớp, ghim tin.

### 11.5 Mở rộng (giai đoạn 4)
- Nhóm theo khóa (gộp nhiều ca), nhóm theo trường/khu vực ("Phụ huynh quận 7") – cần kiểm duyệt mạnh hơn.
- Tích hợp `/today/diary`: giáo viên chia sẻ ảnh buổi học vào nhóm/nhật ký.
- Hỏi đáp dạng thread dùng lại module `asks` (Q&A đã có backend).

## Tiêu chí xong (MVP)
- Hai phụ huynh có con cùng ca thấy cùng một nhóm, nhắn qua lại realtime trên điện thoại.
- Người ngoài lớp không đọc/gửi được (test quyền).
- Báo cáo → admin ẩn được tin.

## Cần hỏi lại khi làm
- Có cho giáo viên (không phải chủ đối tác) vào nhóm không, ai cấp quyền?
- Câu chữ nội quy nhóm và điều khoản.
