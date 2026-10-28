# Tổng kết plan 15: kinh tế Leo Xu và các việc Vui học còn lại (28/10/2026)

**Nhánh:** `claude/project-thread-tb1liw` (đã push, **chưa có PR**). Plan gốc: `plans/15-leo-xu-economy.md`.
**Migration mới:** V62 (cửa hàng, năng lượng, gói tập luyện), V63 (chợ sticker), V64 (nhiệm vụ tuần).

## Đã làm

### Cửa hàng Leo Xu (phần A)
- Trang `/fun/shop` thay thẻ "Ví" trên `/fun`, có 3 tab: **Mua**, **Bán**, **Lịch sử**. `/fun/coins` cũ tự chuyển sang tab Lịch sử.
- Mua: vật phẩm Leo rank, gói tập luyện, năng lượng +10, rương sticker thường (30 xu) và rương sticker hiếm (90 xu).
- Bán cho Leo: sticker trùng (3 / 10 / 30 xu theo độ hiếm) và vật phẩm (30% giá mua). Mỗi loại có giới hạn số lần bán mỗi ngày.
- Leo rank và trang Sticker vẫn có lối tắt chỉ bán đồ của game đó, và có link sang cửa hàng chung.
- Backend: `ShopService`, `ShopRules`, `ShopSettings`, API `/api/shop*`.
- Admin: Vui học > nút "Cửa hàng Leo Xu" chỉnh mọi giá, giới hạn mỗi ngày, công tắc từng món và các số năng lượng.

### Năng lượng và gói tập luyện (phần A)
- **Năng lượng:** tối đa 30, hồi 1 mỗi 5 phút, mỗi câu leo rank tốn 1. Thanh tia chớp nằm ngay trên nút Sẵn sàng.
- **Gói tập luyện:** 3 loại (theo cấp, theo chủ đề, chủ đề + cấp), mỗi gói 10 câu.
  - Cấp chọn lúc mua, vì giá theo cấp (5 đến 15 xu). Chủ đề chọn ở khối "Gói tập luyện của tôi".
  - Lưu xong thì nút đổi thành "Tập luyện". Dùng câu nào trừ câu đó.
  - Câu tập luyện: không tốn năng lượng, không cho sao, không dùng vật phẩm, không vào bảng xếp hạng. Sau khi trả lời thì hiện đáp án đúng.

### Chợ đổi sticker và album (phần B)
- **Chợ** `/fun/sticker/market`, theo kiểu "có a, b, c, cần x".
  - Sticker đem rao bị khóa (không bán, không đổi chỗ khác được) cho tới khi gỡ tin, tin hết hạn (7 ngày) hoặc đổi xong.
  - Mỗi người mở tối đa 3 tin. Admin có tab "Chợ đổi".
- **Album:** sticker chưa có hiện dấu "?" (ẩn cả hình và tên), hình trong ô to hơn, hiệu ứng độ hiếm rộng và dài hơn.
- **Ảnh:**
  - Ảnh 1024 px trong `/assets` đã được tách nền. Banner (`public/og/leo_rank.png`) dùng bản 1024 px, icon `/fun` dùng bản 512 px.
  - 13 sticker Leo bản tách nền nằm ở `assets/sticker_leo_set_1/transparent/`.

### Nhiệm vụ tuần và các việc khác (phần C)
- **Nhiệm vụ tuần:** 6 nhiệm vụ, mỗi cái 10 đến 30 xu. Xong 5 trên 6 thì được thêm 1 sticker.
  - Tiến độ đếm từ `game_events` trong tuần.
  - Thẻ hiện trên `/fun`. Admin chỉnh mục tiêu, thưởng và bật/tắt.
- **Vật phẩm khi điểm danh:** ngày 3 và ngày 5 của chuỗi tặng 1 vật phẩm Leo rank.
- **Thưởng share và mời bạn:** share thành tích lần đầu được 10 xu (tối đa 2 lần mỗi ngày). Mời được bạn đủ điều kiện thì được 50 xu.
- **Leo trong quiz:** Leo nói ở sảnh (gần lên hạng, sắp hết năng lượng, đang tập luyện…) và ở màn kết quả.
- **Video Khám phá qua Bunny Stream:**
  - Admin tải video thẳng từ trình duyệt lên Bunny. Ứng dụng phát bằng HLS.
  - 3 biến `BUNNY_STREAM_*` đã thêm vào workflow deploy, `backend.env.example` và `deployment/README.md`.

### Sửa thêm khi review
- Gói tập luyện theo cấp chỉ ra câu đúng cấp đã mua.
- Khi đã chạm trần xu nhận trong ngày thì không bán được nữa, để người chơi không mất đồ mà không nhận được xu.

## Đã kiểm tra
- Test thuần backend qua.
- FE: 396 test qua, typecheck qua, lint 0 lỗi.
- Build admin qua.
- **Chưa** chạy với MySQL thật, **chưa** xem trên điện thoại, **chưa** thử upload video lên Bunny thật.

## Còn chờ bạn
1. Đồng ý cho tạo PR từ nhánh `claude/project-thread-tb1liw`.
2. Tạo tài khoản Bunny và một Stream library, rồi thêm 3 GitHub secret: `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST`. Khi chưa có thì admin vẫn dán link video như cũ.
3. Admin tải lại ảnh sticker bằng bản tách nền trong `assets/sticker_leo_set_1/transparent/`, vì ảnh đã upload trước đây không tự đổi.
4. Sau khi deploy: chạy thử với dữ liệu thật và chỉnh giá trong admin nếu thấy kinh tế lệch.

## Chưa làm, để sau
- Chợ sticker: báo trước khi tin sắp hết hạn, gia hạn tin, lọc theo độ hiếm hoặc theo bộ.
- Admin: bảng thống kê riêng của cửa hàng. Hiện xem xu vào và ra theo nguồn ở "Sức khỏe game".
- Bảng xếp hạng "Lớp của tôi", giao diện theo mùa, chọn chủ đề cho cả loạt câu hỏi.
