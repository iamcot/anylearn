# 05 – Không bỏ rơi đơn chờ thanh toán

Giai đoạn 1. Trụ cột D.

## Vấn đề (từ ảnh "Đơn hàng của tôi")

- Hai đơn chờ thanh toán (#2814, #2813) + một đơn đã huỷ (#2810) cùng một khóa, cùng học sinh Bin: khách đặt lại nhiều lần,
  có thể vì không biết cách quay lại thanh toán đơn cũ.
- Đơn chờ không được nhắc; không tự huỷ → giữ chỗ ảo, số liệu bẩn.

## Task

### 05.1 Chống tạo đơn trùng
- Khi thêm giỏ/checkout: nếu đã có đơn **chờ thanh toán** cùng `item_id` + cùng người học (+ cùng ca nếu có), hỏi:
  "Bạn đã có đơn #2814 cho khóa này. **Tiếp tục thanh toán** / Tạo đơn mới".
- Hàm thuần `findDuplicatePendingOrder(pendingOrders, cartLine)` có test.

### 05.2 Lối vào đơn chờ rõ ràng
- Badge đỏ trên "Tài khoản" và một thẻ "Bạn có 2 đơn chờ thanh toán" ở `/today` và đầu trang Tài khoản (plan 06).
- Nút "Thanh toán ngay" mở thẳng `/order/[orderId]` (QR, thông tin chuyển khoản) – kiểm tra đã đúng chưa.
- Trang đơn: tách tab Đang chờ / Hoàn thành / Đã huỷ (làm cùng plan 06 nếu tiện).

### 05.3 Nhắc thanh toán
- Job (giống `ScheduleNotificationService`, hoặc thêm vào đó):
  - sau `N1` giờ (gợi ý 2h): in-app + push "Đơn #2814 đang chờ thanh toán, giữ chỗ đến …";
  - sau `N2` giờ (gợi ý 24h): ZNS + email.
- Không nhắc nếu đơn đã thanh toán/huỷ hoặc khách đã có đơn khác đã thanh toán cho cùng khóa + người học.
- Config: `order/remind_hours` (ví dụ `2,24`), `order/auto_cancel_hours` (ví dụ `72`).
- Ghi dấu đã nhắc để không gửi lặp (dedup key như `ScheduleNotificationService`).

### 05.4 Tự huỷ đơn quá hạn
- Sau `auto_cancel_hours`: huỷ đơn, hoàn điểm/voucher đã dùng (kiểm tra luật hoàn hiện có), thông báo cho khách.
- Bank transfer: nếu tiền về sau khi huỷ, `SepayWebhookService` hiện ghi `needs_review` – giữ nguyên, admin xử lý.
  Ghi rõ điều này trong thông báo huỷ ("Nếu bạn đã chuyển khoản, đơn sẽ được khôi phục").

### 05.5 Đo
- Admin dashboard: số đơn chờ, % được thanh toán sau nhắc, % tự huỷ.

## Tiêu chí xong
- Đặt lại khóa đang có đơn chờ → được hỏi tiếp tục đơn cũ.
- Đơn chờ nhận nhắc đúng mốc, tự huỷ đúng hạn, không nhắc trùng.
