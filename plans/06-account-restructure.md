# 06 – Khu vực cá nhân gọn, đủ thông tin

Giai đoạn 3. Nền.

## Vấn đề

- `/account` dùng thanh tab cuộn ngang (Mã code khóa học / Đơn hàng của tôi / …): trên mobile chỉ thấy 2 tab, khó tìm.
- Thông tin của từng con nằm rải rác (đơn, lịch, mã code, nhật ký).
- Đơn đã huỷ lẫn với đơn đang chờ.

Route hiện có: `/account/{anypoint, change-password, children, course-codes, favorites, orders, profile, schedule}`.

## Nguyên tắc

- **Một trang một việc.** Trang chính chỉ là mục lục + những việc cần làm ngay.
- `/today` = "hôm nay/tuần này con học gì". `/account` = quản lý (đơn, điểm, hồ sơ). Trang **từng con** = mọi thứ của một bé.
- Mobile: danh sách dọc dạng menu, không tab cuộn ngang.

## Cấu trúc mới

```
/account
├── Thẻ đầu: avatar, tên, hạng (plan 10), anyPoint (270 điểm = 270.000đ) → /account/anypoint
├── "Cần làm ngay" (chỉ hiện khi có): đơn chờ thanh toán, khóa sắp hết hạn, review chờ viết, yêu cầu nghỉ chờ duyệt
├── Gia đình: Bin, Su, + Thêm con → /account/children/[id]
├── Đơn hàng → /account/orders (tab Đang chờ / Hoàn thành / Đã huỷ)
├── Lịch học → /today
├── Mã code & tài liệu → /account/course-codes
├── Yêu thích & theo dõi → /account/favorites
├── Ưu đãi: anyPoint, voucher, giới thiệu bạn bè → /account/rewards (gom anypoint + voucher + mã giới thiệu)
└── Cài đặt: hồ sơ, mật khẩu, kênh nhận thông báo (/account/settings/notifications)
```

## Task

### 06.1 Trang chính `/account` dạng menu + "Cần làm ngay"
- API `GET /v2/api/me/summary`: số đơn chờ, khóa sắp hết hạn, review chờ, điểm, hạng.
- Desktop giữ sidebar; mobile là danh sách dọc. Bỏ tab cuộn ngang.

### 06.2 Trang từng con `/account/children/[id]`
- Hồ sơ (tên, ngày sinh, trường, sở thích – plan 01.5), khóa đang học, lịch tuần (link `/today?learner=`), mã code,
  nhật ký, đơn đã mua cho bé, gợi ý khóa hợp tuổi (plan 08).
- Sửa/xoá con (đã có ở `/account/children`, chuyển vào đây).

### 06.3 Đơn hàng chia tab
- Tab Đang chờ (mặc định nếu có), Hoàn thành, Đã huỷ. Lọc theo con.
- Đơn chờ: đếm ngược thời gian giữ chỗ (plan 05.4).

### 06.4 Cài đặt thông báo
- Bật/tắt theo nhóm: nhắc lịch học, nhắc thanh toán, gia hạn, khuyến mãi, chat lớp (plan 11); theo kênh: app, ZNS, email.
- Bảng `user_notification_prefs (user_id, topic, channel, enabled)`. Mọi job gửi thông báo phải kiểm tra bảng này
  (trừ thông báo giao dịch bắt buộc).

### 06.5 Ưu đãi gom một chỗ
- `/account/rewards`: anyPoint (plan 02.4), voucher đang có, mã giới thiệu + số bạn đã mời + điểm nhận được.

## Tiêu chí xong
- Trên điện thoại, từ `/account` tới bất kỳ chức năng nào ≤ 2 chạm, không phải cuộn ngang.
- Mỗi con có một trang tổng hợp.
