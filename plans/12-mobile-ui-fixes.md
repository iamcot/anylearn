# 12 – Sửa lỗi UI mobile (thắng nhanh)

Giai đoạn 1. Từ ảnh chụp mobile ngày 25/10/2026 (PDP chọn người học, giỏ hàng, trang chủ, đơn hàng, trang QR).

## Task

### 12.1 Nút "N" đè logo
- Nút tròn "N" góc trái trên đè lên logo ở mọi trang. Nhiều khả năng là Next.js dev indicator (đang chạy `next dev`).
- Xác minh trên bản build production. Nếu đúng là dev indicator: tắt bằng `devIndicators: false` trong `next.config` cho
  môi trường demo, hoặc chỉ demo bằng `next start`. Nếu là phần tử của app: sửa vị trí.

### 12.2 Thanh "Bắt đầu học · Thắng test k…" bị cắt
- Thanh dưới header (`/today` bar) cắt tên khóa. Cho xuống 2 dòng hoặc hiện tên rút gọn + bấm để xem; tránh cắt giữa từ.

### 12.3 Footer quá dài trên mobile
- Footer chiếm ~40% chiều dài mọi trang. Mobile: nhóm "Dành cho phụ huynh", "Điều khoản & Chính sách" thành accordion
  (đóng mặc định); giữ liên hệ + mạng xã hội.

### 12.4 Hiển thị tiền ở nơi thanh toán
- Giỏ hàng/checkout đang ghi "1.5 triệu" ở tổng tiền. Nơi trả tiền ghi đủ: `1.500.000đ`. Danh sách/thẻ khóa học được rút gọn.
- Kiểm tra hàm format tiền trong `anylearn_v2/src/lib` có test (`npm test`); thêm biến thể `full`.

### 12.5 Checkout
- Phương thức "Quét mã QR qua VNPay (giảm 1%) (trên 100 triệu)" khó hiểu → viết lại câu, ẩn nếu đơn không đủ điều kiện.
- Thứ tự tổng tiền: Tạm tính / anyPoint / Mã giảm giá / Tổng thanh toán (gộp với plan 02.3).

### 12.6 PDP chọn người học
- Nút "Sửa" của từng con là chữ nhỏ màu xám, khó bấm (< 44px). Làm thành nút icon đủ lớn.
- Nút "+ Thêm con" ổn; sau khi thêm con nên tự chọn con vừa thêm.

## Tiêu chí xong
- Chụp lại 5 màn hình như ảnh gốc ở viewport 390px, không còn các lỗi trên.
