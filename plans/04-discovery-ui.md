# 04 – Giao diện khám phá khóa học (mobile trước)

Giai đoạn 2 (04.1–04.5), giai đoạn 4 (04.6). Trụ cột A. Cần plan 03 xong phần API.

## Vấn đề (từ ảnh chụp mobile)

- Trang chủ rất dài, nhiều khối giống nhau, không cá nhân hoá theo tuổi con.
- Bộ lọc nằm trong panel, ít lựa chọn, khu vực chỉ có 2 thành phố.
- Không có lối vào theo "gần tôi", "cuối tuần", "học thử", "chuyên gia", "ngẫu nhiên".

## Task

### 04.1 Chip chọn người học ("Cho Bin · 15 tuổi")
- Đầu trang chủ và trang search, khi đã đăng nhập và có con: hàng chip `Tất cả | Bin 15t | Su 9t | Tôi`.
- Chọn chip → mọi danh sách lọc theo tuổi người đó (`ageFor`). Nhớ lựa chọn trong `localStorage`.
- Chưa đăng nhập: chip độ tuổi chung (3–5, 6–10, 11–15, 16+).

### 04.2 Chip lọc nhanh + bộ lọc đầy đủ
- Dưới ô tìm kiếm: chip cuộn ngang `Gần tôi · Cuối tuần · Tối trong tuần · Học thử miễn phí · Đang giảm giá · Online`.
- "Gần tôi": xin quyền vị trí; từ chối thì dùng địa chỉ đã lưu (`user_locations`) hoặc chọn quận.
- Panel bộ lọc: thêm quận/huyện (theo tỉnh), khung giờ, loại đối tác, thanh trượt giá, tag kỹ năng.
- Cập nhật `config/searchFilters.ts` và `lib/search/query.ts`; giữ URL query để chia sẻ link được.
- Thẻ khóa học: thêm khoảng cách, khung giờ, badge "Học thử", "+X điểm" (plan 02).

### 04.3 Trang chủ mobile gọn (≈ 6 khối)
1. Chip chọn con (04.1).
2. Ô tìm kiếm + chip nhanh (04.2).
3. "Dành cho Bin": khóa hợp tuổi, gần nhà, chưa mua (sắp theo popularity).
4. "Đang hot gần bạn" (popularity theo khu vực, đã có `PopularityRollupService`).
5. Bộ sưu tập theo mùa (04.4), dạng thẻ ngang.
6. Đối tác / chuyên gia nổi bật.
- Bỏ hoặc gộp các khối lặp; footer mobile thu gọn (plan 12).
- Đo trước/sau: tỉ lệ click từ trang chủ, độ sâu cuộn.

### 04.4 Bộ sưu tập (collections) do biên tập
- Bảng `collections (id, slug, title, subtitle, cover, season_from, season_to, sort, is_active)` và
  `collection_items (collection_id, item_id, sort)`; hoặc collection theo **bộ lọc lưu sẵn** (`filter_json`).
- Admin tạo/sửa. FE: `/collections/[slug]`.
- Ví dụ: "Chuẩn bị vào lớp 6", "Hè không màn hình", "Cuối tuần cả nhà", "Thi IELTS 6.5", "Chuyên gia nổi tiếng".

### 04.5 Trang chuyên gia / đối tác + "Ngẫu nhiên"
- Trang hồ sơ đối tác/chuyên gia đẹp hơn (`AuthorProfileCard` đã có): giới thiệu, thành tích, review (plan 09),
  các khóa đang mở, nút "Theo dõi" (nhận thông báo khi mở lớp mới, bảng `follows`).
- "Thử điều mới cho con": nút trên trang chủ mở danh sách ngẫu nhiên hợp tuổi, lọc theo khu vực (random có seed theo ngày).

### 04.6 So sánh khóa học (giai đoạn 4)
- Chọn tối đa 3 khóa → bảng so sánh: giá, giá/buổi, số buổi, lịch, khoảng cách, đánh giá, học thử, điểm nhận.

## Tiêu chí xong (giai đoạn 2)
- Phụ huynh có 2 con chọn chip từng con và thấy danh sách khác nhau, đúng tuổi.
- Tìm được "bóng đá, quận 7, cuối tuần, có học thử" bằng chip/bộ lọc, link chia sẻ được.
- Trang chủ mobile ≤ 6 khối chính.
