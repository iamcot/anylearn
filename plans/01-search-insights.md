# 01 – Lắng nghe nhu cầu tìm kiếm (Search insights)

Giai đoạn 1. Trụ cột B.

## Vấn đề

- Hệ thống **không lưu từ khoá tìm kiếm**. Không biết khách tìm gì, tìm gì mà không có.
- Tìm không ra kết quả → trang trống → khách rời đi, anyLEARN mất cả khách lẫn tín hiệu nhu cầu.
- Đội BD tìm đối tác theo cảm tính.

## Mục tiêu

1. Ghi lại mọi lượt tìm kiếm và kết quả.
2. Biến "không có kết quả" thành **yêu cầu tìm giúp** (lead) có người xử lý.
3. Dashboard xu hướng trong admin để quyết định tìm đối tác nào, ở đâu, cho độ tuổi nào.

## Task

### 01.1 Bảng `search_logs` + ghi log
- Migration mới:
  ```sql
  CREATE TABLE search_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    session_key VARCHAR(64) NULL,          -- id ẩn danh trên trình duyệt (cookie) cho khách chưa đăng nhập
    keyword VARCHAR(255) NULL,
    keyword_normalized VARCHAR(255) NULL,  -- viết thường, bỏ dấu, gộp khoảng trắng
    mode VARCHAR(20) NULL,                 -- course / school / teacher
    category VARCHAR(100) NULL,
    filters JSON NULL,                     -- {hinhthuc, price, age, location, ...}
    result_count INT NOT NULL DEFAULT 0,
    clicked_item_id BIGINT NULL,
    clicked_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_search_logs_created (created_at),
    INDEX idx_search_logs_kw (keyword_normalized)
  );
  ```
- Backend: trong endpoint search (`MeilisearchService` / controller search) ghi log **bất đồng bộ** (`@Async`), không làm chậm tìm kiếm. Trả `searchLogId` trong response.
- FE: khi click kết quả, gọi `POST /v2/api/search/click {searchLogId, itemId}`.
- Hàm thuần `normalizeKeyword` (bỏ dấu tiếng Việt, lowercase) có test.
- Không log khi chỉ đổi trang (page > 1) để không đếm trùng.

### 01.2 Form "Tìm giúp tôi" (`course_requests`)
- Migration:
  ```sql
  CREATE TABLE course_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    contact_name VARCHAR(100), contact_phone VARCHAR(20) NOT NULL,
    learner_id BIGINT NULL,                 -- con nào (nếu đăng nhập)
    subject VARCHAR(255) NOT NULL,          -- môn/kỹ năng mong muốn
    learner_age INT NULL,
    province_code VARCHAR(10), district_code VARCHAR(10),
    budget_max BIGINT NULL,                 -- VND/tháng
    preferred_time VARCHAR(50) NULL,        -- weekday_evening / weekend / summer / flexible
    mode VARCHAR(20) NULL,                  -- offline / online / any
    note TEXT NULL,
    source_search_log_id BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new / contacting / matched / no_partner / closed
    matched_item_id BIGINT NULL,
    admin_note TEXT NULL,
    created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL
  );
  ```
- FE: hiện ở
  - trang search khi `result_count = 0` (điền sẵn từ khoá, tuổi con đang chọn, khu vực),
  - cuối trang search (dòng nhỏ "Không thấy khóa phù hợp? Để anyLEARN tìm giúp"),
  - trang chủ (một khối nhỏ).
- Gửi xong: thông báo "anyLEARN sẽ liên hệ trong 48 giờ" + gửi notification cho admin.
- Chống spam: tối đa N yêu cầu / số điện thoại / ngày (config).

### 01.3 Admin xử lý yêu cầu
- Trang `anylearn_admin` "Yêu cầu tìm khóa học": danh sách, lọc theo trạng thái/khu vực/độ tuổi, đổi trạng thái, ghi chú,
  gán `matched_item_id`.
- Khi chuyển `matched`: gửi notification + ZNS cho khách kèm link khóa học.

### 01.4 Dashboard xu hướng (admin)
- Endpoint `/v2/admin/insights/search?from&to`:
  - top từ khoá (số lượt, % có kết quả, % click),
  - **top từ khoá không có kết quả**,
  - nhu cầu theo khu vực × độ tuổi × lĩnh vực (gộp `search_logs.filters` + `course_requests`),
  - danh mục có nhiều lượt xem PDP nhưng ít đơn (từ `item_events`).
- Trang admin "Xu hướng nhu cầu": bảng + biểu đồ cột đơn giản, xuất CSV.
- Query nặng: tính sẵn mỗi đêm vào bảng tổng hợp nếu chậm (đo trước).

### 01.5 Khảo sát sở thích khi thêm con (tuỳ chọn)
- Khi thêm con (`/account/children`): 3 câu tuỳ chọn "Con thích gì?", "Muốn con học thêm gì?", "Ngân sách/tháng".
- Lưu bảng `learner_interests (learner_id, tag, source)`; dùng cho plan 04 (gợi ý) và 01.4.

## Tiêu chí xong
- Mỗi lượt tìm có 1 dòng log; click được ghi.
- Tìm "cờ vua quận 7" không ra kết quả → thấy form, gửi được, admin thấy và xử lý được.
- Admin xem được top 20 từ khoá không có kết quả trong 30 ngày.

## Ghi chú
- Không lưu IP. `session_key` là id ngẫu nhiên, không phải dữ liệu cá nhân.
- Có thể xoá log cũ hơn 12 tháng (job dọn dẹp, làm sau).
