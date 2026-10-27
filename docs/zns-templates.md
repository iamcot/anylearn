# Mẫu ZNS cần đăng ký (Zalo Notification Service)

Tài liệu cho người đăng ký mẫu trên Zalo OA / ZBS. Liệt kê **tất cả tin nhắn** anyLEARN cần gửi qua ZNS, kể cả tin chưa làm
(các plan 01, 02, 05, 07). Mỗi mẫu có: mục đích, khi nào gửi, loại mẫu nên chọn, nội dung đề xuất và danh sách tham số.

## Hiện trạng

- Code gửi ZNS đã có (`ZnsService.sendTemplate(phone, templateId, data)`), nhưng **mới dùng cho OTP**. Môi trường `zalo.zns.otpTemplateId` đã có.
- Các tin khác hiện chỉ gửi **trong app (chuông + push) và email**. Khi mẫu được duyệt, gửi anyLEARN **mã mẫu (template_id)** của từng mẫu
  để nối vào đúng điểm gửi; mỗi mẫu dưới đây có sẵn "Điểm gửi trong code" để dev nối nhanh.
- Mọi tin ZNS chỉ gửi trong khung **8h–21h**, tôn trọng công tắc "Zalo" của người dùng ở Tài khoản > Thông báo (đã lưu, ZNS sẽ đọc khi nối).

## Quy tắc soạn mẫu (để ít bị Zalo từ chối)

Quy định của Zalo thay đổi theo thời gian, hãy đối chiếu lại với trang hướng dẫn ZNS hiện hành khi nộp. Những điểm hay gặp:

- Chọn đúng **loại mẫu**: *Giao dịch* (xác nhận, thanh toán, hủy đơn, nhắc hạn), *Chăm sóc khách hàng* (nhắc lịch, khảo sát, thông tin lớp),
  *Yêu cầu*/*OTP* riêng. **Không** chèn nội dung quảng cáo, khuyến mãi vào mẫu giao dịch hay CSKH. Mẫu có ưu đãi (tặng anyPoint)
  nên để trong app/email, hoặc đăng ký riêng loại *Quảng cáo* (cần người dùng đồng ý).
- Nội dung ngắn gọn, đúng một việc, tiếng Việt có dấu, không viết hoa cả câu, không emoji, không từ ngữ đe dọa ("nợ", "phạt").
- Mọi thông tin thay đổi theo từng người phải là **tham số** (viết `<tên_tham_số>`), không viết cứng tên, số tiền, ngày.
- Mỗi tham số có kiểu và độ dài tối đa (tên người ~30 ký tự, mã đơn ~30, ngày dd/MM/yyyy, số tiền, chuỗi ngắn ~30–200 tùy kiểu). Giữ giá trị tham số
  ngắn (tên khóa học dài làm tin khó đọc, nên rút gọn khi nối vào code).
- Tối đa 2 nút (CTA), dùng nút "Xem chi tiết" dẫn về `https://anylearn.vn/...`. Nút phải trỏ đúng tên miền đã khai báo với OA.
- Logo, tên thương hiệu "anyLEARN" nằm ở phần đầu mẫu; tiêu đề ngắn (khoảng 65 ký tự).

## Bảng tổng hợp

| # | Tên mẫu | Loại | Khi nào gửi | Trạng thái gửi hiện nay |
|---|---|---|---|---|
| 1 | Mã OTP | OTP | Đăng ký, quên mật khẩu | Đã dùng (đã có mã mẫu) |
| 2 | Xác nhận đăng ký thành công | Giao dịch | Đơn được thanh toán | App + email |
| 3 | Nhắc thanh toán đơn hàng | Giao dịch | 24 giờ sau khi tạo đơn mà chưa thanh toán | App + push + email |
| 4 | Đơn hàng đã hủy | Giao dịch | Đơn quá hạn thanh toán bị tự hủy | App + email |
| 5 | Nhắc trước ngày khai giảng | CSKH | 1 ngày trước buổi học đầu | App + push + email |
| 6 | Nhắc buổi học ngày mai | CSKH | Tối hôm trước mỗi buổi (tùy chọn) | App + push + email |
| 7 | Bé vắng học liên tiếp | CSKH | Vắng N buổi liền | App + push + email |
| 8 | Khảo sát giữa khóa | CSKH | Học được 50% số buổi | App + push + email |
| 9 | Nhắc gia hạn gói buổi | CSKH | Còn 3 buổi hoặc 14 ngày trước khi hết khóa | App + push + email |
| 10 | Học phí sắp đến hạn | Giao dịch | 7 ngày và 1 ngày trước hạn | App + push + email |
| 11 | Chưa nhận được học phí | Giao dịch | Quá hạn đóng học phí | App + push + email |
| 12 | Đã tìm được khóa cho yêu cầu của bạn | CSKH | Admin chuyển yêu cầu "Tìm giúp tôi" sang "đã tìm được" | App (nếu có tài khoản) |
| 13 | anyPoint sắp hết hạn | CSKH | 30 và 7 ngày trước hạn (plan 02, chưa làm) | Chưa làm |
| 14 | Yêu cầu nghỉ / đổi lịch đã xử lý | CSKH | Admin duyệt hoặc từ chối | App |

Các tên tham số dùng chung: `customer_name` (tên phụ huynh hoặc "Bạn"), `learner_name` (tên bé), `course_name`, `order_code`, `amount`, `date`, `time`.

---

## 1. Mã OTP (đã có)

Giữ nguyên mẫu đang dùng. Tham số `otp`. Không cần đăng ký lại.

## 2. Xác nhận đăng ký thành công — Giao dịch

- Điểm gửi trong code: `PaymentApprovalService.approveOrder`, sau email `email-order_success`.
- Tham số: `customer_name`, `order_code`, `course_name`, `amount`, `first_date`.
- Nút: "Xem lịch học" → `https://anylearn.vn/today`.

> **anyLEARN xác nhận đăng ký thành công**
> Chào <customer_name>, đơn hàng <order_code> đã được thanh toán <amount>. Khóa học: <course_name>. Buổi học đầu tiên: <first_date>.
> Bạn xem lịch học và đồ cần mang trong trang Hôm nay của anyLEARN.

## 3. Nhắc thanh toán đơn hàng — Giao dịch

- Điểm gửi: `PendingOrderFollowUpService` (bước nhắc lần 2 sau 24 giờ).
- Tham số: `customer_name`, `order_code`, `amount`, `deadline` (giờ + ngày).
- Nút: "Thanh toán" → `https://anylearn.vn/order/<order_code>`.

> **Đơn hàng chờ thanh toán**
> Chào <customer_name>, đơn hàng <order_code> với số tiền <amount> vẫn đang chờ thanh toán. anyLEARN giữ chỗ cho bạn đến <deadline>.
> Nếu bạn đã chuyển khoản, bạn không cần làm gì thêm, anyLEARN sẽ xác nhận sau khi kiểm tra.

## 4. Đơn hàng đã hủy — Giao dịch

- Điểm gửi: `PaymentApprovalService.cancelOrder` (lý do hết hạn).
- Tham số: `customer_name`, `order_code`, `reason`.

> **Đơn hàng đã được hủy**
> Chào <customer_name>, đơn hàng <order_code> đã được hủy. Lý do: <reason>.
> Nếu bạn đã chuyển khoản, vui lòng liên hệ anyLEARN, đơn sẽ được khôi phục sau khi kiểm tra.

## 5. Nhắc trước ngày khai giảng — CSKH

- Điểm gửi: `LifecycleService.beforeStart` (mốc 1 ngày; mốc 3 ngày chỉ gửi app + email).
- Tham số: `customer_name`, `learner_name`, `course_name`, `start_time` (giờ + ngày), `gather_info` (giờ tập trung hoặc địa điểm, ngắn).
- Nút: "Xem chi tiết lớp" → `https://anylearn.vn/today`.

> **Sắp khai giảng**
> Chào <customer_name>, <learner_name> sắp học <course_name>. Buổi đầu tiên: <start_time>. <gather_info>.
> Bạn xem đồ cần mang và cách đến lớp trong trang Hôm nay của anyLEARN.

## 6. Nhắc buổi học ngày mai — CSKH (tùy chọn)

Hiện đã có push + email nên mẫu này chỉ cần khi muốn phủ cả người chưa bật push.
- Điểm gửi: `ScheduleNotificationService.scanUpcomingSessions`.
- Tham số: `customer_name`, `learner_name`, `course_name`, `time`.

> **Nhắc lịch học ngày mai**
> Chào <customer_name>, ngày mai <learner_name> có buổi học <course_name> lúc <time>.
> Nếu cần xin nghỉ hoặc đổi lịch, bạn gửi yêu cầu trong trang Hôm nay của anyLEARN.

## 7. Bé vắng học liên tiếp — CSKH

- Điểm gửi: `LifecycleService.absences`.
- Tham số: `customer_name`, `learner_name`, `course_name`, `miss_count`.
- Nút: "Xin nghỉ / đổi lịch" → `https://anylearn.vn/today`.

> **anyLEARN hỏi thăm lịch học**
> Chào <customer_name>, <learner_name> đã vắng <miss_count> buổi liền ở khóa <course_name>.
> Nếu bé bận, bạn có thể xin nghỉ hoặc đổi lịch để không bị lỡ bài.

## 8. Khảo sát giữa khóa — CSKH

- Điểm gửi: `LifecycleService.midCourse`.
- Tham số: `customer_name`, `learner_name`, `course_name`.
- Nút: "Chấm điểm" → `https://anylearn.vn/today?survey=1`.

> **Bé học có vui không?**
> Chào <customer_name>, <learner_name> đã học được nửa khóa <course_name>. Bạn chấm điểm từ 1 đến 5 sao giúp anyLEARN, chỉ mất vài giây.

## 9. Nhắc gia hạn gói buổi — CSKH

Không chèn ưu đãi anyPoint vào mẫu này (xem lưu ý ở đầu tài liệu); ưu đãi chỉ nằm trong app và email.
- Điểm gửi: `ScheduleNotificationService.remindSessionsLeft` và `scanRenewals`.
- Tham số: `customer_name`, `learner_name`, `course_name`, `left_text` ("còn 2 buổi", "đã học hết số buổi", "kết thúc ngày 20/11").
- Nút: "Gia hạn" → `https://anylearn.vn/today`.

> **Sắp hết khóa học**
> Chào <customer_name>, <learner_name> <left_text> khóa <course_name>. Bạn gia hạn để bé học tiếp liên tục nhé.

## 10. Học phí sắp đến hạn — Giao dịch

- Điểm gửi: `ScheduleNotificationService.remindFee` (mốc 7 ngày và 1 ngày).
- Tham số: `customer_name`, `learner_name`, `course_name`, `due_date`, `next_period`, `amount`.
- Nút: "Đóng học phí" → `https://anylearn.vn/today`.

> **Học phí sắp đến hạn**
> Chào <customer_name>, học phí <course_name> của <learner_name> đến hạn ngày <due_date>. Học phí <next_period>: <amount>.
> Bạn đóng trước hạn để bé học liên tục.

## 11. Chưa nhận được học phí — Giao dịch

Không dùng từ "nợ", "trễ hạn", "phạt".
- Điểm gửi: `ScheduleNotificationService.remindFee` (trạng thái quá hạn).
- Tham số: `customer_name`, `learner_name`, `course_name`, `next_period`, `amount`.

> **anyLEARN chưa nhận được học phí**
> Chào <customer_name>, anyLEARN chưa nhận được học phí <next_period> khóa <course_name> của <learner_name> (<amount>).
> Nếu bạn đã đóng, vui lòng bỏ qua tin này. Nếu chưa, bạn đóng giúp để việc học không bị gián đoạn.

## 12. Đã tìm được khóa cho yêu cầu của bạn — CSKH (plan 01.3)

- Điểm gửi: `AdminCourseRequestService` khi trạng thái chuyển `matched` (kể cả người chưa có tài khoản, vì yêu cầu chỉ có số điện thoại).
- Tham số: `customer_name`, `course_name`, `request_summary` (ví dụ "Piano cho bé 7 tuổi quận 7").
- Nút: "Xem khóa học" → `https://anylearn.vn/pdp/<id>`.

> **anyLEARN đã tìm được khóa học cho bạn**
> Chào <customer_name>, theo yêu cầu "<request_summary>" của bạn, anyLEARN gợi ý khóa <course_name>. Bạn xem chi tiết và lịch học theo nút bên dưới.

## 13. anyPoint sắp hết hạn — CSKH (plan 02, chưa làm)

Cần chủ sản phẩm xác nhận chính sách hết hạn anyPoint trước khi nộp mẫu.
- Tham số: `customer_name`, `points`, `expire_date`.

> **anyPoint sắp hết hạn**
> Chào <customer_name>, bạn có <points> anyPoint sẽ hết hạn ngày <expire_date>. Bạn dùng cho khóa học tiếp theo của bé nhé.

## 14. Yêu cầu nghỉ / đổi lịch đã xử lý — CSKH

- Điểm gửi: màn hình admin "Yêu cầu nghỉ / đổi lịch" khi duyệt hoặc từ chối.
- Tham số: `customer_name`, `learner_name`, `course_name`, `session_date`, `result` ("đã được duyệt" hoặc "chưa thể duyệt"), `admin_note` (có thể trống, nên đặt tham số tùy chọn hoặc ghi chung).

> **Yêu cầu nghỉ / đổi lịch**
> Chào <customer_name>, yêu cầu của <learner_name> cho buổi học <course_name> ngày <session_date> <result>. <admin_note>

---

## Gợi ý thứ tự đăng ký

Đăng ký trước các mẫu có giá trị cao và ít rủi ro bị từ chối: **2, 3, 5, 7, 9, 10, 11** (giao dịch / chăm sóc rõ ràng). Sau đó 4, 12, 14.
Mẫu 6 và 8 chỉ cần khi thấy tỷ lệ mở push/email thấp. Mẫu 13 chờ quyết định chính sách hết hạn anyPoint.

## Khi mẫu được duyệt

1. Gửi cho dev: tên mẫu + `template_id` + danh sách tham số đúng như Zalo đã duyệt (tên tham số có thể bị Zalo đổi).
2. Dev thêm mã mẫu vào bảng cấu hình (`configurations`, khóa `zns/template/<tên>`), nối vào điểm gửi trong bảng trên, kiểm tra khung 8h–21h và công tắc "Zalo" của người dùng.
3. Kiểm tra bằng `zalo.zns.testMode=true` (chế độ development của Zalo) trước khi tắt.
