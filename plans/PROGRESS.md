# PROGRESS – Lộ trình tăng trưởng anyLEARN

Đọc `plans/00-overview.md` trước. Mỗi phiên: chọn task kế tiếp ở bảng dưới, làm xong thì đổi trạng thái, thêm ghi chú
vào "Nhật ký" (mới nhất ở trên).

Trạng thái: `todo` · `doing` · `done` · `blocked` (ghi lý do) · `skip` (ghi lý do)

## Quyết định của chủ sản phẩm

| Ngày | Quyết định |
|---|---|
| 25/10/2026 | Cam kết giá bằng hoặc rẻ hơn tại trường (đã deal với đối tác) → được nói công khai (plan 10.1). |
| 25/10/2026 | Thử hạn anyPoint, chỉ cho thành viên mua hàng (`role = 'member'`); điểm của đối tác không hết hạn vì là tiền trả đối tác (plan 02.5). |
| 25/10/2026 | Làm thêm cộng đồng: review (plan 09) và nhóm chat người cùng lớp (plan 11). |
| 25/10/2026 | Khách chưa đăng nhập: hỏi tìm cho con hay bản thân, lưu tên/biệt danh + năm sinh vào `localStorage`, khi đăng ký tự tạo tài khoản con và chọn bé (plan 04.7). |
| 25/10/2026 | 04.7 làm ở **giai đoạn 1**. Lúc đầu chỉ cần năm sinh; checkout bắt buộc nhập ngày sinh đầy đủ của người học trước khi thanh toán (FE khoá nút + backend chặn tạo đơn). |

## Câu hỏi đang chờ chủ sản phẩm

- [ ] Thời hạn điểm (gợi ý 12 tháng) và ngày bắt đầu áp dụng (plan 02.5).
- [ ] Điểm từ đơn dùng được ngay hay sau khi lớp bắt đầu (plan 02).
- [ ] Câu chữ chính sách hoàn tiền trong "Lời hứa anyLEARN" (plan 10.1).
- [ ] Hệ số điểm theo hạng thành viên có chấp nhận chi phí không (plan 10.2).
- [ ] Trả góp: cách đối tác nhận tiền theo kỳ (plan 10.4).
- [ ] Đồng ý thêm thư viện Java gửi Web Push (plan 13.4)?
- [ ] App cũ trên store: còn hoạt động không, công nghệ gì, còn khóa ký / tài khoản store / Firebase không; chọn gỡ, thay bằng bản bọc web, hay giữ (plan 13.0, 13.8).
- [ ] Chat lớp: giáo viên có được vào nhóm không; nội quy và điều khoản cộng đồng (plan 11).

## Bảng task

### Giai đoạn 1 – thắng nhanh + nền dữ liệu

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 12.1–12.6 | Sửa lỗi UI mobile | todo | |
| 04.7 | Hỏi "Tìm cho ai?" khi chưa đăng nhập + tự tạo con khi đăng ký + bắt buộc ngày sinh đầy đủ ở checkout | todo | Dùng bộ lọc `age` có sẵn, không chờ plan 03 |
| 01.1 | `search_logs` + ghi log + click | todo | |
| 01.2 | Form "Tìm giúp tôi" (`course_requests`) | todo | |
| 01.3 | Admin xử lý yêu cầu | todo | |
| 01.4 | Dashboard xu hướng | todo | |
| 13.0 | Kiểm kê app cũ trên store + `users.notif_token` | todo | Cần chủ sản phẩm cung cấp thông tin |
| 13.1 | Manifest + icon | todo | Tham khảo CLR `src/app/manifest.ts` |
| 13.2 | Service worker (cache tĩnh, offline, cập nhật) | todo | |
| 13.3 | Mời cài app đúng lúc (Android + hướng dẫn iOS) | todo | |
| 13.4 | Backend Web Push (VAPID, `push_subscriptions`, `PushService`) | todo | Chờ đồng ý thư viện |
| 13.5 | FE xin quyền đúng cách + đăng ký push | todo | Bỏ xin quyền tự động lúc đăng nhập |
| 13.6 | SW nhận push, chống trùng với SSE, badge | todo | |
| 13.7 | Đo cài app / push | todo | |
| 02.1 | API điểm dự kiến nhận | todo | |
| 02.2 | "+X điểm" ở PDP/giỏ/đơn | todo | |
| 02.3 | Công tắc dùng điểm ở checkout | todo | |
| 02.4 | Trang anyPoint timeline + `/info/anypoint` | todo | |
| 05.1 | Chống đơn trùng | todo | |
| 05.2 | Lối vào đơn chờ | todo | |
| 05.3 | Nhắc thanh toán | todo | |
| 05.4 | Tự huỷ đơn quá hạn | todo | |
| 05.5 | Đo đơn chờ | todo | |
| 10.1 | Lời hứa anyLEARN | todo | |

### Giai đoạn 2 – khám phá

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 03.1 | Khảo sát độ đầy đủ dữ liệu khóa học | todo | |
| 03.2 | Migration thuộc tính | todo | |
| 03.3 | Admin nhập liệu + cảnh báo thiếu | todo | |
| 03.4 | Index MeiliSearch | todo | |
| 03.5 | API search bộ lọc mới | todo | |
| 04.1 | Chip chọn người học | todo | |
| 04.2 | Chip lọc nhanh + bộ lọc đầy đủ | todo | |
| 04.3 | Trang chủ mobile gọn | todo | |
| 04.4 | Bộ sưu tập | todo | |
| 04.5 | Trang chuyên gia + "Ngẫu nhiên" | todo | |
| 01.5 | Khảo sát sở thích khi thêm con | todo | |
| 09.1 | Review xác thực | todo | |
| 09.2 | Review tiêu chí + ảnh | todo | |
| 09.3 | Hiển thị review PDP/đối tác | todo | |

### Giai đoạn 3 – giữ chân

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 07.1 | Khung lifecycle message | todo | Mở rộng `ScheduleNotificationService` |
| 07.2 | Xác nhận + trước khai giảng | todo | |
| 07.3 | Phát hiện vắng học | todo | |
| 07.4 | Khảo sát giữa khóa | todo | |
| 07.5 | Gia hạn 1 chạm | todo | |
| 07.6 | Nhắc học phí theo kỳ | todo | |
| 08.1 | Lộ trình khóa học | todo | |
| 08.2 | Engine gợi ý theo luật | todo | |
| 08.3 | Hiển thị gợi ý | todo | |
| 08.4 | Đo gợi ý | todo | |
| 06.1 | `/account` dạng menu + "Cần làm ngay" | todo | |
| 06.2 | Trang từng con | todo | |
| 06.3 | Đơn hàng chia tab | todo | |
| 06.4 | Cài đặt thông báo | todo | |
| 06.5 | Ưu đãi gom một chỗ | todo | |
| 02.5 | Hạn điểm cho member (lô điểm) | todo | Chờ chốt thời hạn |
| 02.6 | Nhắc điểm sắp hết hạn | todo | |
| 09.4 | Đối tác trả lời + báo cáo review | todo | |
| 09.5 | Nhắc viết review | todo | |
| 09.6 | Thưởng điểm review | todo | |
| 11.1 | Chat MVP backend | todo | |
| 11.2 | Chat MVP FE | todo | |
| 11.3 | Thông báo chat | todo | |
| 11.4 | Kiểm duyệt chat | todo | |

### Giai đoạn 4 – mở rộng

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 04.6 | So sánh khóa học | todo | |
| 08.5 | Ưu đãi gia đình (gợi ý) | todo | Cùng 10.3 |
| 10.2 | Hạng thành viên | todo | |
| 10.3 | Gói gia đình | todo | |
| 10.4 | Trả góp / đóng theo kỳ | todo | Chờ chủ sản phẩm |
| 11.5 | Chat mở rộng | todo | |
| 13.8 | Thay app cũ trên store bằng bản bọc web (TWA / Capacitor), cùng package/bundle id | todo | Theo kết quả 13.0; có thể kéo lên sớm |

## Nhật ký

### 25/10/2026 – app cũ trên store
- Chủ sản phẩm cho biết đã từng có app trên store. DB có `users.notif_token` (từ portal), backend v2 không dùng.
- Plan 13: thêm 13.0 kiểm kê app cũ; 13.4 chọn FCM nếu còn app store; 13.8 đổi thành phát hành bản cập nhật cho app cũ.

### 25/10/2026 – thêm plan 13 (PWA + push)
- Hiện trạng: `public/sw.js` chỉ xử lý click; thông báo trình duyệt chỉ chạy khi tab mở (qua SSE); chưa có manifest,
  chưa có Web Push; `useNotifications` tự xin quyền lúc đăng nhập (cần bỏ).
- Plan 13 vào giai đoạn 1, làm trước 05 (nhắc thanh toán dùng push).

### 25/10/2026 – 04.7 lên giai đoạn 1
- Chủ sản phẩm chốt: 04.7 làm ngay giai đoạn 1; năm sinh trước, ngày sinh đầy đủ bắt buộc ở checkout.
- Plan 04.7 thêm: form ngày sinh ở checkout, backend trả `LEARNER_DOB_REQUIRED` khi tạo đơn thiếu ngày sinh.

### 25/10/2026 – bổ sung 04.7
- Thêm task 04.7 theo yêu cầu: hỏi khách chưa đăng nhập tìm cho ai, lưu `localStorage` (`anylearn.guestLearners`),
  đăng ký xong tự gọi `POST /user/children` và chọn bé; đăng nhập thì so khớp, hỏi trước khi thêm.
- Năm sinh gửi dạng `yyyy-01-01` + cột mới `users.dob_year_only` (API con hiện chỉ nhận ngày đầy đủ).

### 25/10/2026 – lập kế hoạch
- Phân tích hiện trạng từ 5 ảnh chụp mobile (PDP chọn người học, giỏ hàng, trang chủ, đơn hàng, trang QR) và code.
- Phát hiện trong code: chưa log từ khoá tìm kiếm; bộ lọc chỉ 4 nhóm (`config/searchFilters.ts`); `PointsEngine` đã tính
  điểm người mua nhưng PDP không hiện; `ScheduleNotificationService` đã nhắc buổi học và gia hạn; `/today/community` là
  `ComingSoon`; `item_reviews` chỉ có rating + comment.
- Tạo plan 00–12 và file này. Chưa code tính năng nào.
- Migration mới bắt đầu từ `V16` (số lớn nhất hiện tại là `V15__bank_webhook_events.sql`).
