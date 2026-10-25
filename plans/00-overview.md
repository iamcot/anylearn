# 00 – Tổng quan lộ trình tăng trưởng anyLEARN

Đọc file này trước khi làm bất kỳ plan nào trong `plans/`. Tiến độ ghi ở `plans/PROGRESS.md`.

## Định vị

anyLEARN là **trang booking khóa học** của các đối tác (trường, trung tâm, CLB, gia sư, chuyên gia), không tự dạy.
Sản phẩm: học phí các cấp, ngoại khóa offline, online, mã code ứng dụng.
Khách chính: **phụ huynh có con nhỏ** (một tài khoản, nhiều con `users.is_child = 1`); phụ: sinh viên, người đi làm trẻ.

Luồng hiện có: tìm kiếm → PDP → chọn người học & ca → giỏ → thanh toán (QR SePay tự duyệt) → `/today`.

## Quyết định đã chốt với chủ sản phẩm (25/10/2026)

1. **Giá:** anyLEARN cam kết giá **bằng hoặc rẻ hơn** giá tại trường (đã deal với đối tác). Được phép nói công khai.
2. **anyPoint hết hạn:** chưa có, muốn thử. Chỉ áp dụng cho **thành viên mua hàng** (`users.role = 'member'`), **không** áp
   dụng cho điểm của đối tác vì điểm cũng là đơn vị trả lại cho đối tác (xem `PointsEngine.authorPoints`).
3. **Cộng đồng:** làm thêm review và **nhóm chat của người cùng lớp**.
4. **Khách chưa đăng nhập:** hỏi "tìm cho con hay bản thân"; nếu cho con thì hỏi tên/biệt danh + năm sinh, lưu
   `localStorage`; khi tạo tài khoản tự tạo tài khoản con và chọn sẵn bé (plan 04.7). **Làm ở giai đoạn 1.** Chỉ cần năm
   sinh lúc đầu; vào checkout mới bắt buộc ngày sinh đầy đủ trước khi thanh toán.

## 4 trụ cột + cộng đồng

| Trụ cột | Mục tiêu | Plan |
|---|---|---|
| A. Khám phá | Khách tìm được khóa học theo MỌI khía cạnh (tuổi con, gần nhà, giờ rảnh, giá, người dạy, xu hướng, ngẫu nhiên) | 03, 04 |
| B. Lắng nghe nhu cầu | Biết khách tìm gì mà chưa có → đi tìm đối tác đúng chỗ | 01 |
| C. Lý do đặt qua anyLEARN | Lời hứa giá, hoàn tiền, anyPoint dễ hiểu, hạng thành viên | 02, 10 |
| D. Hậu mãi | Không bỏ rơi đơn chờ, nhắc lịch/gia hạn, lộ trình, up-sell, cross-sell | 05, 07, 08 |
| E. Cộng đồng | Review đáng tin, chat lớp học, giữ chân bằng quan hệ | 09, 11 |
| Nền | Khu vực cá nhân gọn, sửa lỗi UI mobile, PWA + push | 06, 12, 13 |

## Danh sách plan

| # | File | Giai đoạn | Tóm tắt |
|---|---|---|---|
| 01 | `01-search-insights.md` | 1 | Log tìm kiếm, form "Tìm giúp tôi", dashboard xu hướng cho BD |
| 02 | `02-anypoint-clarity.md` | 1 | Hiện "+X điểm", công tắc dùng điểm, trang lịch sử điểm, điểm hết hạn (member) |
| 03 | `03-course-attributes.md` | 2 | Chuẩn hoá thuộc tính khóa học (tuổi, vị trí, khung giờ, học thử, loại đối tác) |
| 04 | `04-discovery-ui.md` | 1 (04.7) + 2 | Chip chọn con, hỏi "tìm cho ai" khi chưa đăng nhập (tự tạo con khi đăng ký), bộ lọc mới, trang chủ mobile gọn, bộ sưu tập, trang chuyên gia, so sánh |
| 05 | `05-pending-order-recovery.md` | 1 | Nhắc đơn chờ thanh toán, chống đơn trùng, tự huỷ |
| 06 | `06-account-restructure.md` | 3 | Tái cấu trúc trang Tài khoản, trang riêng từng con |
| 07 | `07-enrollment-lifecycle.md` | 3 | Vòng đời đăng ký: trước khai giảng → đang học → gia hạn → kết thúc, qua ZNS/push |
| 08 | `08-upsell-crosssell.md` | 3 | Lộ trình khóa tiếp theo, gợi ý anh chị em, khung giờ trống, theo mùa |
| 09 | `09-reviews.md` | 2–3 | Review xác thực, ảnh, đối tác trả lời, nhắc review, thưởng điểm |
| 10 | `10-membership-promise.md` | 1 + 4 | Lời hứa anyLEARN (giai đoạn 1), hạng thành viên, gói gia đình, trả góp (giai đoạn 4) |
| 11 | `11-class-chat.md` | 3–4 | Nhóm chat người cùng lớp, kiểm duyệt, an toàn trẻ em |
| 12 | `12-mobile-ui-fixes.md` | 1 | Lỗi UI thấy trong ảnh chụp mobile |
| 13 | `13-pwa-push.md` | 1 + 4 | Cài như app (manifest, service worker), Web Push tới điện thoại khi app đóng; TWA/store để sau |

## Thứ tự làm đề xuất

- **Giai đoạn 1 (2–4 tuần) – thắng nhanh + nền dữ liệu:** 12 → 04.7 → 01 → 13 → 02 → 05 → 10 (phần lời hứa).
  13 (push) làm trước 05 vì nhắc thanh toán cần kênh push.
- **Giai đoạn 2 (1–2 tháng) – khám phá:** 03 → 04 → 09 (phần nền review).
- **Giai đoạn 3 (2–3 tháng) – giữ chân:** 07 → 08 → 06 → 09 (phần còn lại) → 11 (MVP).
- **Giai đoạn 4 – mở rộng:** 10 (hạng, gói gia đình, trả góp), 11 (đầy đủ), so sánh khóa học.

Mỗi plan chia nhỏ thành task có mã (ví dụ `01.2`). Một phiên làm **một hoặc vài task**, xong thì đánh dấu ở PROGRESS.md.

## Chỉ số theo dõi (KPI)

| Chỉ số | Lấy từ |
|---|---|
| % lượt tìm kiếm có kết quả, % có click | `search_logs` (plan 01) |
| Số yêu cầu "Tìm giúp tôi" và số chuyển thành đối tác/khóa mới | `course_requests` (plan 01) |
| Xem PDP → thêm giỏ → thanh toán | `item_events` + `orders` |
| % đơn chờ thanh toán bị bỏ | `orders` (plan 05) |
| % đơn có dùng điểm, số điểm hết hạn/tháng | `transactions` (plan 02) |
| Tỉ lệ gia hạn, số khóa / gia đình / năm | `user_course_enrollments`, `orders` |
| Số review / đơn hoàn thành | `item_reviews` (plan 09) |

## Quy ước chung cho mọi plan

- Theo `CLAUDE.md` ở gốc repo (4 app, 1 DB). Backend: Spring Boot, migration Flyway mới ở
  `anylearn_backend_v2/src/main/resources/db/migration` (số tiếp theo sau `V15`; luôn kiểm tra số lớn nhất trước khi tạo,
  **không sửa migration cũ**). FE: `anylearn_v2` (Next.js). Admin: `anylearn_admin` (antd).
- Mọi tham số nghiệp vụ (số giờ nhắc, hạn điểm, ngưỡng hạng…) đặt trong bảng `configurations` hoặc config, không hardcode.
- Endpoint mới thêm mẫu gọi vào thư mục `http/`.
- Chuỗi giao diện tiếng Việt có dấu. Tiền là VND số nguyên; nơi trả tiền ghi đủ số (`1.500.000đ`), không viết "1.5 triệu".
- Logic thuần (tính điểm, hạn điểm, gợi ý, chống trùng đơn) có unit test.
- Tính năng chưa sẵn sàng để sau feature flag (`anylearn_v2/src/lib/features.ts`, kiểu `NEXT_PUBLIC_*`).
- Sau mỗi task: `./mvnw test`, `npm test`/`npm run lint`/`npm run build` ở app có sửa, cập nhật `plans/PROGRESS.md`.
