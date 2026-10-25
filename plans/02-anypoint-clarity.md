# 02 – anyPoint dễ hiểu và đáng dùng

Giai đoạn 1 (02.1–02.4), giai đoạn 3 (02.5–02.6). Trụ cột C.

## Hiện trạng (code)

- Điểm lưu ở `users.wallet_c`; `1 điểm = bonus_rate VND` (mặc định 1.000đ), cấu hình trong `CommissionConfig`.
- `PointsEngine` tính: `buyerPoints = round(price × (1 − commRate) × discount / bonusRate)` (discount mặc định 0.1),
  điểm giới thiệu theo cây bạn bè, điểm cho tác giả/đối tác (`authorPoints`).
- Checkout: ô nhập số điểm + nút "Dùng điểm" + "Dùng hết". Khách không biết **trước khi mua** sẽ nhận bao nhiêu điểm.
- Trang `/account/anypoint` có sẵn (kiểm tra lại nội dung trước khi sửa).
- Điểm **không có hạn**.

## Quyết định
- Thử hạn điểm, **chỉ cho thành viên** (`users.role = 'member'`). Điểm của đối tác (school/teacher) không bao giờ hết hạn
  vì đó là tiền trả lại cho đối tác.
- Trước khi bật hạn: thông báo cho toàn bộ thành viên ít nhất 30 ngày, điểm cũ được tính hạn từ ngày bật.

## Task

### 02.1 API "điểm dự kiến nhận"
- Endpoint `GET /v2/api/points/preview?itemId=&price=` (và trong response giỏ hàng: tổng điểm dự kiến của cả giỏ)
  dùng lại `PointsEngine` → `{ points, vndValue }`. Không trùng logic: tách hàm tính `buyerPoints` ra để PDP và lúc duyệt
  đơn dùng chung.
- Test: điểm preview = điểm thực nhận khi đơn được duyệt (cùng giá, cùng commission).

### 02.2 Hiện "+X điểm" ở PDP, giỏ hàng, trang đơn
- PDP (gần giá và nút "Thêm vào giỏ hàng"): badge **"Nhận +150 điểm (= 150.000đ)"**.
- Giỏ hàng: "Đơn này bạn sẽ nhận +X điểm".
- Trang đơn thành công: "Đã cộng X điểm, số dư Y điểm".
- Thẻ khóa học trong danh sách: chỉ hiện nếu không làm rối (thử badge nhỏ "+150đ điểm"), sau feature flag.

### 02.3 Công tắc dùng điểm ở checkout
- Thay ô nhập bằng **một công tắc**: "Dùng 270 điểm, giảm 270.000đ" (tự giới hạn theo tổng đơn và luật tối đa hiện có).
- Link nhỏ "Dùng số điểm khác" mở lại ô nhập cho người muốn tuỳ chỉnh.
- Hiện dòng giảm trừ rõ trong tổng tiền: Tạm tính / Dùng điểm / Mã giảm giá / **Tổng thanh toán** (ghi đủ số).
- Tooltip "anyPoint là gì?" → popup 3 dòng giải thích.

### 02.4 Trang anyPoint dạng timeline
- `/account/anypoint`:
  - Thẻ đầu: số dư điểm + quy đổi VND + (khi có hạn) "X điểm hết hạn ngày dd/mm".
  - "Cách nhận điểm": mua khóa, giới thiệu bạn, viết review (plan 09), … với số điểm cụ thể.
  - Lịch sử: nhận/dùng/hết hạn, mỗi dòng có lý do và link đơn (đọc từ `transactions`).
- Trang công khai `/info/anypoint` giải thích cho khách chưa đăng nhập (link từ PDP).

### 02.5 Hạn điểm cho thành viên (sau khi 02.1–02.4 chạy ổn)
- Mô hình **lô điểm** để biết điểm nào hết hạn trước (FIFO):
  ```sql
  CREATE TABLE point_lots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_transaction_id BIGINT NULL,
    points_earned BIGINT NOT NULL,
    points_remaining BIGINT NOT NULL,
    earned_at DATETIME NOT NULL,
    expires_at DATETIME NULL,         -- NULL = không hết hạn (đối tác, hoặc trước khi bật)
    INDEX idx_point_lots_user (user_id, expires_at)
  );
  ```
- Config: `points/expiry_enabled` (0/1), `points/expiry_months` (gợi ý 12), `points/expiry_start_date`.
- Khi bật: tạo một lô "số dư mở" cho mỗi member = `wallet_c` hiện tại, `expires_at = expiry_start_date + expiry_months`.
- Khi cộng điểm cho member: tạo lô mới. Khi dùng điểm: trừ lô sắp hết hạn trước. Hàm thuần `allocatePointUsage(lots, amount)`
  có test.
- Job hằng ngày: lô quá hạn → ghi `transactions` loại `points_expired`, trừ `wallet_c`, `points_remaining = 0`.
- `wallet_c` vẫn là nguồn chính cho số dư; `point_lots` chỉ để tính hạn. Có job đối soát tổng lô = `wallet_c` (log cảnh báo).
- Không áp cho `role != 'member'`.

### 02.6 Nhắc điểm sắp hết hạn
- 30 ngày và 7 ngày trước hạn: notification + ZNS "Bạn có 270.000đ điểm hết hạn ngày …, dùng cho khóa của Su?"
  kèm 2–3 gợi ý khóa (plan 08).
- Nhắc khi có điểm nhưng giỏ hàng không dùng (một lần/đơn).

## Tiêu chí xong (giai đoạn 1)
- PDP hiện đúng số điểm sẽ nhận; khớp với số điểm thực tế sau khi đơn duyệt.
- Checkout dùng điểm bằng 1 chạm.
- Trang anyPoint cho thấy lịch sử và cách nhận điểm.

## Cần hỏi lại khi làm
- Điểm từ đơn có được dùng ngay trong đơn sau không, hay sau khi lớp bắt đầu (chống mua rồi huỷ)? Kiểm tra luật hiện tại.
- Thời hạn điểm cụ thể (12 tháng?) và ngày bắt đầu áp dụng.
