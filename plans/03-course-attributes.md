# 03 – Chuẩn hoá thuộc tính khóa học

Giai đoạn 2. Trụ cột A. Là nền cho plan 04 (khám phá) và 08 (gợi ý).

## Vấn đề

Bộ lọc hiện tại (`anylearn_v2/src/config/searchFilters.ts`) chỉ có: hình thức (offline/online/mã code), học phí 3 mức,
độ tuổi 4 mức, khu vực (TP.HCM, Hà Nội). Muốn tìm theo "gần nhà", "tối trong tuần", "có học thử", "do chuyên gia X dạy"
thì dữ liệu khóa học phải có các thuộc tính đó, đầy đủ và thống nhất.

## Thuộc tính cần có cho mỗi khóa học

| Thuộc tính | Lưu ở đâu (kiểm tra cột có sẵn trước) | Ghi chú |
|---|---|---|
| Tuổi tối thiểu / tối đa | `items` (có thể đã có `ages_min/ages_max`) | Bắt buộc với khóa cho trẻ |
| Tỉnh, quận, phường, toạ độ | `user_locations` của đối tác / địa điểm của `item_schedules` | Toạ độ để tính "gần tôi" |
| Khung giờ | Suy ra từ `item_schedules` (weekdays, time_start) | sáng/chiều/tối × ngày thường/cuối tuần |
| Hình thức | `items.subtype` / cột hiện có | offline / online / digital |
| Loại đối tác | role của tác giả + nhãn | trường, trung tâm, CLB, gia sư, chuyên gia |
| Có học thử miễn phí | item extra/hoạt động trải nghiệm (đã có "Học thử" ở PDP) | cờ boolean để lọc |
| Đang khuyến mãi | giá sale / voucher gắn item | |
| Tag kỹ năng | bảng tag (đã có `Tag`, `ItemCategory`) | thể thao, ngoại ngữ, STEM, nghệ thuật, học thuật, kỹ năng sống… |
| Giá / buổi | tính từ giá và số buổi | để so sánh khóa khác thời lượng |
| Khai giảng gần nhất | `item_schedules` | "Khai giảng tuần này" |

## Task

### 03.1 Khảo sát dữ liệu
- Query thống kê % khóa đang bán có đủ từng thuộc tính. Ghi kết quả vào PROGRESS.md.
- Quyết định cột nào thêm mới, cột nào dùng lại. **Không đổi nghĩa cột cũ** (portal cũ còn đọc chung DB).

### 03.2 Migration + entity
- Thêm cột/bảng còn thiếu (ví dụ `items.has_free_trial`, `items.partner_type`, toạ độ ở địa điểm, `items.sessions_count`).
- Giá trị suy ra được (khung giờ, khai giảng gần nhất, giá/buổi) **tính khi index MeiliSearch**, không lưu trùng.

### 03.3 Admin + đối tác nhập liệu
- Form item trong `anylearn_admin`: nhóm "Thuộc tính tìm kiếm", trường bắt buộc có dấu *.
- Cảnh báo "Khóa này thiếu X thuộc tính, sẽ ít được tìm thấy" + trang danh sách khóa thiếu thuộc tính để đội vận hành bổ sung.

### 03.4 Index MeiliSearch
- Thêm vào document: `ageMin, ageMax, provinceCode, districtCode, _geo {lat,lng}, timeSlots[], partnerType, hasFreeTrial,
  onSale, tags[], pricePerSession, nextStartDate, popularity`.
- Khai báo `filterableAttributes`, `sortableAttributes` (gồm `_geo`, `nextStartDate`, `pricePerSession`).
- Reindex toàn bộ một lần; cập nhật khi item/schedule đổi.

### 03.5 API search nhận bộ lọc mới
- Query params: `ageFor=<learnerId>` (backend tự tính tuổi), `age`, `district`, `near=lat,lng&radiusKm`, `timeSlot`,
  `partnerType`, `freeTrial`, `onSale`, `tag`, `priceMin/priceMax`, `startWithin`.
- Response mỗi khóa thêm `distanceKm` khi có `near`.
- Test cho phần dựng filter MeiliSearch (hàm thuần).

## Tiêu chí xong
- ≥ 90% khóa đang bán có tuổi, khu vực, hình thức, tag.
- API search lọc được theo quận, khung giờ, học thử, khoảng cách.
