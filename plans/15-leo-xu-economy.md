# Plan 15 – Kinh tế Leo Xu và các việc Vui học còn lại

Ngày: 28/10/2026. Nối tiếp plan 14 (Vui học). Mọi số dưới đây là **mặc định**, admin chỉnh được.

## 0. Hiện trạng (đọc từ code)

| Dòng xu | Nguồn | Mức |
|---|---|---|
| Vào | Quà điểm danh (`fun/checkin_points`) | 5-20 xu/ngày, ~80 xu/tuần nếu đủ 7 ngày |
| Vào | Lên hạng mới (`quiz/rank_reward_coins`) | 20 xu, mỗi hạng 1 lần (tối đa 7 lần cả đời) |
| Vào | Đủ bộ sticker (`sticker/set_reward_points`) | 200 xu, mỗi bộ 1 lần |
| Ra | Vật phẩm Leo rank (`quiz/price_*`) | 15-60 xu, tối đa 5 món/ngày |

Vấn đề: chỉ có **một** chỗ tiêu, và nguồn vào lặp lại duy nhất là điểm danh. Người chơi đều đặn sẽ tích xu mà không có gì để mua; người chơi mới thì không có đường kiếm thêm ngoài điểm danh. Kinh tế cần nhiều nguồn vào nhỏ, lặp lại (gắn với hành vi mình muốn: quay lại mỗi ngày, chơi nhiều game, mời bạn) và nhiều chỗ tiêu nhỏ, rẻ.

## 1. Mục tiêu cân bằng

- Người chơi đều đặn (điểm danh mỗi ngày + vài ván quiz + làm nhiệm vụ tuần): **kiếm ~180-220 xu/tuần**.
- Một tuần như vậy đủ mua: 4-6 gói tập luyện (~50 xu) + 1-2 lần nạp năng lượng (~20 xu) + 1 rương sticker (30 xu) + 2-3 vật phẩm (~60 xu). Tức tiêu được gần hết, không dư nhiều, không thiếu.
- Không có gì "bắt buộc phải mua": năng lượng tự hồi, gói tập luyện là tùy chọn, vật phẩm cũng rơi miễn phí.
- Không có đường đổi xu ↔ tiền thật hay anyPoint (giữ nguyên quy tắc plan 14). Không có mua bán xu giữa người chơi (chợ sticker chỉ **đổi** sticker lấy sticker), để không thành chợ đen.
- Mọi giao dịch đi qua `CoinService` (đã có trần nhận/ngày `fun/daily_earn_cap`).

## 2. Nguồn kiếm xu (mới)

| Nguồn | Mặc định | Ghi chú chống lạm dụng |
|---|---|---|
| **Nhiệm vụ tuần** (mục 6) | 6 nhiệm vụ, 10-30 xu mỗi cái, ~110 xu/tuần + rương thưởng khi xong 5/6 | Đếm từ `game_events` trong tuần ISO, nhận 1 lần/nhiệm vụ/tuần |
| **Bán sticker trùng cho Leo** | thường 3 / hiếm 10 / sử thi 30 xu | Chỉ bản trùng không khóa (`tradableCopies`), luôn giữ 1 bản; tối đa 10 lần bán/ngày |
| **Bán lại vật phẩm Leo rank** | 30% giá mua (làm tròn xuống, tối thiểu 1) | Tối đa 5 món/ngày; vật phẩm rơi miễn phí nên giá bán phải thấp |
| **Chia sẻ thành tích** | 10 xu lần đầu share mỗi banner | Mỗi banner 1 lần, tối đa 2 lần/ngày |
| **Mời bạn** | 50 xu khi bạn được mời đủ điều kiện (đang có thưởng 1 sticker) | Dùng luôn mốc "đủ điều kiện" và trần `invite_month_cap` đã có |
| **Điểm danh có vật phẩm** | ngày 3 và 5 của chuỗi tặng 1 vật phẩm Leo rank ngẫu nhiên | `fun/checkin_item_days`, cùng hàm `grantRandomItems` |

Ước tính tuần đều đặn: điểm danh 80 + nhiệm vụ ~110 + bán trùng/vật phẩm ~15 + share ~10 = **~215 xu**.

## 3. Chỗ tiêu xu (mới)

| Món | Mặc định | Ghi chú |
|---|---|---|
| **Gói tập luyện** 10 câu (mục 5) | theo cấp độ: Rất dễ 5, Dễ 7, Vừa 9, Khó 12, Rất khó 15; theo chủ đề (nhiều cấp): 10; chủ đề + cấp: như giá cấp | Đúng ý bạn: 5~15 xu |
| **Năng lượng** +10 | 10 xu, tối đa 3 lần/ngày | Không vượt mức tối đa |
| **Rương sticker thường** | 30 xu, 1 sticker theo tỉ trọng rơi | Tối đa 3/ngày |
| **Rương sticker hiếm** | 90 xu, chắc chắn từ hiếm trở lên | Tối đa 1/ngày |
| Vật phẩm Leo rank | giữ giá hiện tại 15-60 | Đã có |

Kiểm tra rương: một bộ 12 sticker cần trung bình ~37 lần rút ngẫu nhiên mới đủ (bài toán sưu tập), tức ~1.100 xu nếu chỉ mua rương, trong khi thưởng đủ bộ là 200 xu. Rương không phá được kinh tế, và sticker trùng bán lại chỉ được 3 xu (lỗ 27 xu mỗi lần), nên không có vòng "mua rương bán lại" có lời.

## 4. Cửa hàng: tập trung hay trong từng game?

**Khuyến nghị: một cửa hàng trung tâm + lối tắt trong từng game, cùng một danh mục.**

- Trang **"Cửa hàng Leo Xu"** (`/fun/shop`, thay thẻ "Ví" trên `/fun`): 3 tab **Mua** (mọi món, nhóm theo game) / **Bán** (sticker trùng, vật phẩm thừa) / **Lịch sử** (sổ xu hiện ở `/fun/coins`, link cũ chuyển hướng về tab này).
- Trong từng game chỉ hiện **phần của game đó**: Leo rank có cửa hàng vật phẩm + gói tập luyện (như bạn muốn), trang Sticker có nút mua rương. Mỗi lối tắt có dòng "Xem cả cửa hàng Leo Xu ›".
- Ở cửa hàng trung tâm, mỗi món có nhãn game và link "Dùng ở Leo rank ›" / "Mở album ›".

Lý do: mua ngay tại chỗ cần (tiện, không làm đứt mạch chơi), còn trang trung tâm là nơi người chơi **nhìn thấy món của game khác** (rương sticker khi đang chơi quiz, gói tập luyện khi đang xem album), tức là đúng chỗ kéo họ "đi ra đi vô". Backend chỉ có **một** danh mục (`ShopService`), nên giá chỉnh một chỗ, hai nơi hiển thị luôn khớp.

## 5. Gói tập luyện + năng lượng (Leo rank)

### Năng lượng
- `quiz_profiles.energy` + `energy_at` (thời điểm tính). Năng lượng hiện tại = `min(max, energy + floor((now - energy_at) / regen))` tính lười, không cần job. Luật thuần `QuizEnergy` (có test).
- Mặc định tối đa 30, hồi 1 mỗi 5 phút, câu leo rank tốn 1 (trừ lúc `start`; "Đổi câu" không tốn thêm). Tập luyện không tốn. Admin chỉnh: `quiz/energy_max`, `quiz/energy_regen_minutes`, `quiz/energy_cost`.
- Hết năng lượng: `start` trả `resultCode 0` "Hết năng lượng, hồi 1 sau mm:ss".
- FE: thanh tia chớp xanh dạng progress bar ngay trên nút Sẵn sàng: "⚡ 23/30 · +1 sau 03:12", có nút nhỏ "+" mở mua năng lượng.

### Gói tập luyện
- Ba loại: **Theo cấp độ** (1 cấp, nhiều chủ đề), **Theo chủ đề** (1 chủ đề, mọi cấp), **Chủ đề + cấp**. 10 câu/gói (`quiz/pack_size`).
- Giá phụ thuộc cấp nên **cấp chọn lúc mua** (cửa hàng hiện "Gói cấp Khó · 12 xu"); chủ đề chọn sau, ở khối gói.
- Bảng `quiz_packs` (user, type, difficulty NULL được, topic NULL được, topics JSON cho loại theo cấp, total, remaining, price, status active/used_up, created_at).
- Lobby, thứ tự: Chuẩn bị trước câu → [thanh năng lượng] Sẵn sàng → Vật phẩm dùng trong câu → **Gói tập luyện của tôi** (mới) → Cửa hàng.
- Thẻ gói hiện loại, cấp/chủ đề và "Còn 7/10 câu". Nhấn vào: theo cấp → chọn chủ đề (nhiều, mặc định tất cả); theo chủ đề → chọn 1 chủ đề; chủ đề + cấp → chọn 1 chủ đề. Nhấn **Lưu** → gói thành gói đang dùng (`quiz_profiles.active_pack_id`), nút Sẵn sàng đổi thành **Tập luyện** (màu khác), có "× Thoát tập luyện" để về leo rank.
- Câu tập luyện: trừ 1 lượt khi phát câu (dùng mấy câu tính bấy nhiêu). Không tốn năng lượng, không sao, không rơi vật phẩm, không vào BXH, không dùng vật phẩm, không đổi hạng; sau khi trả lời **hiện đáp án đúng**. Gói hết lượt tự thoát về leo rank. `quiz_attempts.mode` = rank / practice.
- Bốc câu dùng lại logic `start` (không trùng trong `no_repeat_days`, rồi nới dần).

## 6. Nhiệm vụ tuần

- Danh sách cố định trong code (`MissionRules`), số và thưởng chỉnh trong admin (`mission/{key}/target|reward|enabled`). Mặc định:
  1. Điểm danh 5 ngày: 30 xu
  2. Trả lời đúng 20 câu leo rank: 25 xu
  3. Tập luyện 10 câu: 15 xu
  4. Xem 5 bài Khám phá: 10 xu
  5. Đổi hoặc bán 1 sticker trùng: 15 xu
  6. Chia sẻ 1 thành tích hoặc banner: 15 xu
  - Xong 5/6: rương sticker thường miễn phí.
- Tiến độ đọc từ `game_events` trong tuần ISO (không lưu bộ đếm riêng); nhận thưởng bằng nút, bảng `fun_mission_claims` (user, week_key, mission_key, PK cả ba).
- FE: thẻ "Nhiệm vụ tuần" trên `/fun` (tiến độ, nút Nhận, đếm ngược tới thứ Hai).

## 7. Chợ đổi sticker

- "Mình có a, b, c, cần x": bảng `sticker_listings` (user, want_sticker_id, status open/done/cancelled/expired, expires_at) + `sticker_listing_offers` (listing_id, sticker_id). Mỗi sticker đưa ra phải cùng độ hiếm với x (giữ luật đổi hiện tại).
- **Đăng lên chợ là khóa**: mỗi bản đưa ra bị trừ khỏi `tradableCopies` (không bán, không đổi chỗ khác được) cho tới khi gỡ, hết hạn (7 ngày) hoặc đổi xong.
- Trang `/fun/sticker/market`: tab "Có cái tôi cần" (lọc tin có sticker tôi thiếu và cần thứ tôi có dư), "Tất cả", "Tin của tôi". Người khác nhấn "Đổi" → chọn 1 trong a, b, c → đổi ngay (kiểm lại mọi luật: đủ điều kiện, giới hạn tuần/cặp/tháng), các bản còn lại mở khóa, tin đóng, người đăng nhận thông báo.
- Tối đa 3 tin mở mỗi người. Chợ không dùng xu.

## 8. Việc khác trong tin nhắn

- **Album sticker**: sticker chưa có hiện dấu ? (ẩn hình, chỉ bóng mờ + độ hiếm), hình bên trong ô to hơn, hiệu ứng độ hiếm lan rộng và dài hơn.
- **Ảnh lớn từ `/assets`**: tách nền trắng các ảnh 1024 px trong `assets/icons` để thay ảnh 800 px của banner (`public/og`) và icon `/fun` (256 → 512).
- **Lời thoại Leo trong quiz**: Leo + bong bóng ở sảnh (gần lên hạng, sắp hết năng lượng, có hộp quà, đang tập luyện) và màn kết quả (đúng, sai, chuỗi đúng, lên hạng, mất sao, khiên cứu), thêm vào `lib/fun/leo.ts`.
- **Vật phẩm điểm danh**: mục 2.
- **Upload video Khám phá**: đề xuất Bunny Stream (mục 9).

## 9. Video cho Khám phá

| | Bunny Stream | Cloudflare Stream | S3 hiện có |
|---|---|---|---|
| Lưu | ~$0.01/GB/tháng | $5 / 1.000 phút/tháng | ~$0.025/GB |
| Phát | ~$0.005-0.01/GB (có PoP Singapore, HCM) | $1 / 1.000 phút xem | CloudFront ~$0.12/GB châu Á |
| Chuyển mã, HLS nhiều độ phân giải | miễn phí | miễn phí | không có (phát nguyên file MP4) |

Clip ngắn 30-60 giây xem trên điện thoại: Bunny rẻ nhất và tự chuyển mã HLS (tải nhanh trên 4G). Cách làm: admin chọn file → backend tạo video trên Bunny và ký link upload → trình duyệt tải thẳng lên Bunny (TUS, không qua server 4 GB RAM) → lưu `media_url` = link HLS, `poster_url` = ảnh bìa Bunny tạo. Biến môi trường mới `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST`; để trống thì admin vẫn dán link như hiện nay. Cần bạn tạo tài khoản Bunny (có $1 dùng thử).

## 10. Admin

- Trang mới "Cửa hàng Leo Xu" trong nhóm Giải trí: bảng giá mọi món (vật phẩm, gói tập luyện, năng lượng, rương, giá bán lại), giới hạn/ngày, công tắc từng món; khối "Năng lượng" (tối đa, phút hồi, tốn/câu); khối "Nhiệm vụ tuần" (mục tiêu, thưởng, bật/tắt); số liệu: xu vào/ra theo nguồn 7 ngày (đã có ở Sức khỏe game).
- Giá vật phẩm Leo rank vẫn là `quiz/price_*` (một bảng `FIELDS`), trang mới chỉ đọc/ghi cùng dòng.
- Cập nhật `docs/huong-dan-admin.md`, `CLAUDE.md`, `http/*.http`, `plans/PROGRESS.md`.

## 11. Chia việc

| Phần | Nội dung | Migration |
|---|---|---|
| A | Danh mục cửa hàng (`ShopService`), năng lượng, gói tập luyện, rương, bán lại, trang `/fun/shop`, khối gói + thanh năng lượng ở lobby, admin cửa hàng | V62 |
| B | Chợ sticker, album (?, hình to, hiệu ứng), ảnh lớn từ `/assets` | V63 |
| C | Nhiệm vụ tuần, vật phẩm điểm danh, thưởng share/mời bạn, lời thoại Leo quiz, upload video Bunny | V64 |
