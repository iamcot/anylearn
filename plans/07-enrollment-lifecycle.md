# 07 – Vòng đời đăng ký: nhắc lịch, gia hạn, hậu mãi

Giai đoạn 3. Trụ cột D.

## Hiện trạng (code)

- `ScheduleNotificationService` (`@Scheduled` mỗi giờ): `scanUpcomingSessions` (nhắc buổi ngày mai, gửi 8h),
  `scanPendingEnrollments`, `scanRenewals`, `scanLearnerRenewals`; `dispatch` mỗi 5 phút.
- `/today` có lịch, điểm danh, xin nghỉ/đổi lịch (`schedule_requests`), nhật ký; `ZnsService` có sẵn.
- **Đọc kỹ service này trước khi làm**: mở rộng nó, không viết job song song làm cùng việc.

## Vòng đời mục tiêu

```
Thanh toán xong ─► Trước khai giảng ─► Đang học ─► Giữa khóa ─► Sắp hết ─► Kết thúc
   (xác nhận)       D-3, D-1            nhắc buổi    khảo sát     gia hạn     review + lộ trình
```

| Mốc | Nội dung | Kênh |
|---|---|---|
| Ngay khi thanh toán | Xác nhận, lịch, địa chỉ + bản đồ, đồ cần mang, link `/today`, điểm đã nhận | app + email + ZNS |
| D-3 trước buổi đầu | "Bin sắp khai giảng …", đồ cần mang, giờ tập trung | app |
| D-1 trước buổi đầu | Như trên + link chỉ đường / Zoom | ZNS + app |
| Mỗi buổi | Nhắc tối hôm trước (đã có) hoặc 2h trước (tuỳ cài đặt) | app/push |
| Vắng 2 buổi liền | "Bin vắng 2 buổi, cần xin nghỉ/đổi lịch?" | app |
| Giữa khóa (50% số buổi) | Khảo sát 1 câu: "Bin học có vui không?" (1–5 sao + ghi chú) → cảnh báo đối tác/admin nếu ≤ 2 | app |
| Còn 2–3 buổi hoặc D-14 hết hạn | Nhắc gia hạn + ưu đãi gia hạn sớm (voucher/điểm x2) | ZNS + app |
| Học phí theo kỳ (fee items) | Nhắc trước hạn đóng D-7, D-1 | ZNS + app |
| Kết thúc | Xin review (plan 09) + khóa tiếp theo (plan 08) | app + email |

## Task

### 07.1 Khung "lifecycle message"
- Bảng `lifecycle_messages (id, enrollment_id, learner_id, user_id, stage, scheduled_at, sent_at, channel, dedup_key UNIQUE)`
  hoặc dùng lại bảng nhắc đang có của `ScheduleNotificationService` nếu đã có cột tương đương (kiểm tra `V9__enrollment_reminder.sql`).
- Hàm thuần `planLifecycleMessages(enrollment, sessions, today, config)` trả về danh sách mốc cần gửi → có test đầy đủ.
- Mọi mốc, số ngày, khung giờ gửi đặt trong `configurations` (`lifecycle/*`).
- Tôn trọng cài đặt thông báo (plan 06.4); không gửi ZNS ngoài 8h–21h.

### 07.2 Thông báo xác nhận + trước khai giảng
- Mẫu email/ZNS mới. Nội dung lấy từ `item_schedules` (phòng, giờ tập trung, đồ cần mang, Zoom).

### 07.3 Phát hiện vắng học
- Dựa vào `session_attendance`; vắng N buổi liền (config) → nhắc phụ huynh, ghi chú cho admin.

### 07.4 Khảo sát giữa khóa
- Thẻ trong `/today` + notification; lưu bảng `enrollment_feedback (enrollment_id, stage, score, note)`.
- Điểm thấp → notification cho admin và đối tác.

### 07.5 Gia hạn
- Mở rộng `scanRenewals`: thẻ "Gia hạn khóa" ở `/today` có nút **gia hạn 1 chạm** (tạo đơn với cùng khóa/ca/người học,
  vào thẳng trang thanh toán).
- Ưu đãi gia hạn sớm: voucher hoặc hệ số điểm (config), hết hạn đúng ngày khóa kết thúc.

### 07.6 Nhắc học phí theo kỳ
- Fee items (`items.is_paymentfee = 1`): nhắc trước hạn đóng; hiển thị trong "Cần làm ngay" (plan 06).

## Tiêu chí xong
- Một đăng ký demo (`scripts/seed_today_demo.sql`) đi qua đủ các mốc với ngày giả lập, không gửi trùng.
- Gia hạn từ `/today` tới trang QR ≤ 2 chạm.
