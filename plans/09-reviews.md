# 09 – Review đáng tin

Giai đoạn 2 (09.1–09.3), giai đoạn 3 (09.4–09.6). Trụ cột E.

## Hiện trạng (code)

- `item_reviews (item_id, user_id, rating, comment, created_at, updated_at)`; FE có `ReviewsSection`, `RatingForm`,
  `OrderItemRating` (nút "Đánh giá" trong đơn hoàn thành). Có `UserReview` (review người dùng/đối tác).
- Chưa có: dấu "đã học thật", ảnh, đối tác trả lời, review theo tiêu chí, nhắc viết review, thưởng điểm.

## Mục tiêu

Phụ huynh tin review trên anyLEARN hơn nhóm Facebook: **chỉ người đã đăng ký mới review được**, có tiêu chí cụ thể,
đối tác được trả lời.

## Task

### 09.1 Review xác thực
- Chỉ cho review khi có đơn `delivered` của khóa đó (hoặc enrollment). Hiện nhãn **"Đã học tại anyLEARN"**.
- Thêm cột (migration mới): `order_id`, `learner_id`, `is_verified`, `status` (`published` / `hidden` / `pending`).
- Một review / khóa / người học; cho sửa.

### 09.2 Review theo tiêu chí + ảnh
- Tiêu chí 1–5: Giáo viên, Cơ sở vật chất, Tiến bộ của con, Đúng giá trị. `rating` chung = trung bình (giữ cột cũ).
- Bảng `item_review_scores (review_id, criterion, score)` và `item_review_media (review_id, url, type)`, upload qua `S3Service`.
- Gợi ý nhanh dạng chip ("Giáo viên nhiệt tình", "Lớp đông", …) để viết nhanh trên điện thoại.

### 09.3 Hiển thị ở PDP và trang đối tác
- Tóm tắt: điểm trung bình, số review, điểm từng tiêu chí, ảnh từ phụ huynh.
- Lọc: có ảnh, theo sao, theo độ tuổi con.
- Trang đối tác/chuyên gia: tổng hợp review mọi khóa.

### 09.4 Đối tác trả lời + báo cáo
- Cột `partner_reply`, `partner_replied_at`. Đối tác trả lời từ trang quản lý (admin/partner).
- Nút "Báo cáo review" → admin duyệt ẩn/hiện. Không cho đối tác xoá review.

### 09.5 Nhắc viết review
- Mốc từ plan 07: sau 50% số buổi (review sớm) và khi kết thúc khóa. Thẻ "Review chờ viết" ở "Cần làm ngay" (plan 06).

### 09.6 Thưởng điểm cho review
- Review hợp lệ có ≥ 50 ký tự: +X điểm; có ảnh: +Y điểm (config `review/points_text`, `review/points_media`).
- Điểm ghi vào `transactions` + `wallet_c` (và `point_lots` nếu đã bật plan 02.5). Một lần / review.
- Chống lạm dụng: chỉ review xác thực; admin ẩn review thì thu hồi điểm.

## Tiêu chí xong
- Người chưa mua không review được; review có nhãn xác thực, tiêu chí, ảnh.
- Đối tác trả lời được; phụ huynh nhận điểm sau khi viết review.
