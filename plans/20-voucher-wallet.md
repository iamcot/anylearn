# Plan 20: Voucher và ví voucher

Nguồn: kế hoạch gamification đã duyệt ngày 03/11/2026 (https://claude.ai/artifact/2p1Dp85V3KJpge88HTMdhh, mục "Voucher"). Mục tiêu: có quà thật để kéo đơn hàng đầu tiên, làm nền cho thưởng đơn đầu, nhiệm vụ hệ thống và đổi Leo Xu lấy voucher.

## Đã chốt với chủ sản phẩm
- Giữ schema voucher cũ: sự kiện phát voucher → bộ voucher (mã tĩnh / mã động theo tiền tố, giới hạn số lượng và thời gian tùy chọn) → mã → lượt dùng. Admin bật tắt sự kiện và bộ.
- Thêm ví voucher: hệ thống phát thẳng vào ví, hoặc khách tự lưu. Thanh toán: chọn từ ví hoặc nhập mã.
- Voucher có thể chỉ áp dụng cho một số khóa (chọn khóa giống lộ trình, bộ sưu tập).
- Sự kiện voucher của đối tác; chỗ hiện và lưu voucher ở trang đối tác, tìm kiếm, trang khóa học, trang chủ, Vui học, trang hạng thành viên.

## Task
| # | Việc | Trạng thái |
|---|---|---|
| 20.1 | Sửa thanh toán: voucher và anyPoint trừ thật vào số tiền đơn, trả lại khi hủy | ✅ |
| 20.2 | Ví voucher (V77 `user_vouchers`), thêm mã, tự lưu, hạn trong ví | ✅ |
| 20.3 | Voucher theo khóa / theo đối tác, nơi hiện | ✅ |
| 20.4 | Sự kiện: đăng ký, đơn đầu, mua khóa, theo dõi đối tác, mua khóa của đối tác | ✅ |
| 20.5 | FE: chọn voucher khi thanh toán, trang Ví voucher, ô "Voucher cho bạn" ở 6 nơi, dòng giảm giá trên đơn | ✅ |
| 20.6 | Admin: bộ voucher, mã, tặng, sự kiện, ví của khách, báo cáo | ✅ |
| 20.7 | Đổi Leo Xu lấy voucher (cửa hàng Leo Xu) | ⏳ cùng nhiệm vụ hệ thống |
| 20.8 | Sự kiện `mission:{key}` khi hoàn thành nhiệm vụ hệ thống | ⏳ |
| 20.9 | Voucher theo phần trăm | chưa làm |
