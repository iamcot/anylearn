# 10 – Lời hứa anyLEARN, hạng thành viên, gói gia đình, trả góp

Giai đoạn 1 (10.1), giai đoạn 4 (10.2–10.4). Trụ cột C.

## Quyết định đã chốt

- anyLEARN cam kết giá **bằng hoặc rẻ hơn** giá tại trường (đã deal với đối tác).

## Task

### 10.1 Lời hứa anyLEARN (giai đoạn 1)
Nội dung (chuỗi đặt trong config FE, dễ sửa):
1. **Giá bằng hoặc rẻ hơn tại trường** + nhận anyPoint.
2. **Hoàn tiền** nếu lớp không mở (và chính sách huỷ – lấy theo "Chính sách đổi – trả và hoàn tiền" hiện có; cần chủ
   sản phẩm xác nhận câu chữ).
3. **Mọi lịch học một nơi**: nhắc lịch, điểm danh, xin nghỉ, nhật ký.
4. **Hỗ trợ** qua Zalo trong giờ làm việc.

Hiển thị:
- PDP: dải 3–4 icon ngắn dưới nút "Thêm vào giỏ hàng".
- Giỏ hàng/checkout: một dòng "Giá đã bằng hoặc rẻ hơn tại trường. Bạn nhận +X điểm."
- Trang `/info/why-anylearn` giải thích chi tiết + FAQ "Vì sao nên đăng ký qua anyLEARN thay vì tới trường?".
- Nút "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi" → form đơn giản (bảng `price_reports`), admin xử lý
  (tăng uy tín cam kết, không bắt buộc ngay).

### 10.2 Hạng thành viên (giai đoạn 4)
- Hạng theo tổng chi tiêu 12 tháng gần nhất (đơn `delivered`): Thành viên / Bạc / Vàng / Kim cương. Ngưỡng trong config.
- Quyền lợi (config): hệ số điểm (x1 / x1.2 / x1.5 / x2), ưu tiên giữ chỗ, voucher sinh nhật con, hỗ trợ ưu tiên.
- Tính lại mỗi đêm; bảng `member_tiers (user_id, tier, spent_12m, updated_at)`. Chỉ cho `role = 'member'`.
- Hệ số điểm áp vào phần **điểm người mua** trong `PointsEngine` → cần hỏi lại chủ sản phẩm vì làm tăng chi phí điểm.
- Hiển thị ở thẻ đầu `/account` và trang anyPoint: "Còn 1.200.000đ nữa lên hạng Vàng".

### 10.3 Gói gia đình (giai đoạn 4)
- Đăng ký cho con thứ 2 trở lên (cùng tài khoản) trong N ngày: giảm X% hoặc điểm thêm (config, có thể theo đối tác).
- Tính ở giỏ hàng, hiện rõ dòng "Ưu đãi gia đình".

### 10.4 Trả góp / đóng theo kỳ (giai đoạn 4)
- Khóa dài (≥ N triệu): chia 2–3 kỳ, mỗi kỳ là một đơn con có hạn thanh toán; nhắc theo plan 07.6.
- Cần thỏa thuận với đối tác về cách nhận tiền theo kỳ → **hỏi chủ sản phẩm trước khi làm**.

## Tiêu chí xong (giai đoạn 1)
- Lời hứa xuất hiện ở PDP, checkout và có trang giải thích.
