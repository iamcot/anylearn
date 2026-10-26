# 08 – Up-sell, cross-sell và gợi ý

Giai đoạn 3. Trụ cột D. Cần plan 03 (thuộc tính) để gợi ý chính xác.

## Nguyên tắc

- Bắt đầu bằng **luật đơn giản, giải thích được** ("Vì Bin học bóng đá U13"), chưa cần AI.
- Mỗi gợi ý phải có **lý do hiển thị** cho phụ huynh.
- Không gợi ý khóa đã mua, khóa không hợp tuổi, khóa trùng giờ với lịch đang học.

## Các loại gợi ý

| Loại | Luật | Hiển thị ở |
|---|---|---|
| Lộ trình (up-sell) | Đối tác khai báo "khóa tiếp theo" cho mỗi khóa (U13 → U15, IELTS 5.0 → 6.5) | `/today` khi còn ≤ 3 buổi, email kết thúc khóa |
| Anh chị em (cross-sell) | Cùng đối tác/cùng địa điểm, hợp tuổi anh/chị/em, giờ gần nhau | Trang đơn thành công, trang từng con |
| Khung giờ trống | `/today` biết lịch tuần; tìm khóa gần nhà vào buổi con rảnh | `/today` (thẻ "Thứ 4 Bin đang rảnh") |
| Theo mùa | Collection theo mùa (plan 04.4): trại hè (T3–T5), năm học mới (T7–T8), Tết | Trang chủ, push theo mùa |
| Đi kèm | Đồng phục, dụng cụ, mã app liên quan (`item_extras`, `ItemSpec`) | Checkout ("Thường mua cùng") |
| Người khác cũng mua | Đồng xuất hiện trong đơn của cùng gia đình (co-purchase) | PDP |

## Task

### 08.1 Lộ trình khóa học
- Bảng `item_next_steps (item_id, next_item_id, sort, note)`; admin/đối tác khai báo.
- API `GET /v2/api/items/{id}/next`.

### 08.2 Engine gợi ý theo luật
- Service `RecommendationService` với các nguồn trên, mỗi nguồn trả `{itemId, reasonCode, reasonText, score}`.
- Hàm thuần lọc chung (tuổi, đã mua, trùng giờ, khoảng cách) có test.
- API `GET /v2/api/recommendations?learnerId=&context=today|order_success|pdp|home`.

### 08.3 Hiển thị
- `/today`: tối đa 1 thẻ gợi ý/ngày (không spam).
- Trang đơn thành công: "Su 9 tuổi cũng có lớp … cùng sân".
- PDP: "Phụ huynh khác cũng đăng ký".
- Checkout: "Thường mua cùng" (chỉ đồ đi kèm, rẻ).

### 08.4 Đo
- Ghi `item_events` type `rec_view` / `rec_click` với `reasonCode`; dashboard tỉ lệ click/mua theo loại gợi ý.
- Tắt loại gợi ý có hiệu quả kém bằng config.

### 08.5 Ưu đãi gia đình
- Đăng ký khóa thứ 2 cho con khác trong N ngày → giảm X% hoặc điểm x2 (config). Chi tiết ở plan 10.

## Tiêu chí xong
- Bin học U13 còn 3 buổi → `/today` gợi ý U15 với lý do, gia hạn/đặt được ngay.
- Đơn của Bin thành công → thấy gợi ý cho Su đúng tuổi.
