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
| 26/10/2026 | Phase 2: không khảo sát dữ liệu thực tế, chuẩn hoá và làm dễ nhập trước, hướng dẫn đối tác sau. Portal PHP đã tắt nên được dọn bảng cũ. |
| 26/10/2026 | Tags là danh mục do admin quản lý (nhóm, gộp, ẩn); đối tác/admin chỉ chọn từ danh mục. |
| 26/10/2026 | Địa chỉ → toạ độ + tỉnh/quận/phường dùng Google Places (chủ sản phẩm có key). |
| 26/10/2026 | Bảng portal cũ không còn dùng: đổi tên thành `<tên>_old`, 1–2 tháng sau mới xoá hẳn. |
| 25/10/2026 | Đồng ý thêm thư viện Java `nl.martijndwars:web-push` (+ BouncyCastle) cho Web Push (plan 13.4). |
| 25/10/2026 | App cũ trên store đã bị xoá, lượt tải không đáng kể → **chỉ làm PWA**, làm trước (plan 13). Push dùng Web Push thuần, không FCM. |
| 25/10/2026 | 04.7 làm ở **giai đoạn 1**. Lúc đầu chỉ cần năm sinh; checkout bắt buộc nhập ngày sinh đầy đủ của người học trước khi thanh toán (FE khoá nút + backend chặn tạo đơn). |

## Câu hỏi đang chờ chủ sản phẩm

- [ ] Danh sách bảng portal cũ định đổi tên `_old` (plan 03.2d), chờ chủ sản phẩm xác nhận từng bảng.
- [ ] Khóa học cho người lớn: có `audience` (trẻ em / thiếu niên / người lớn / mọi lứa tuổi) hay chỉ dùng độ tuổi? (plan 03.2c)

- [ ] VNPay: luật "giảm 1%" và "trên 100 triệu" là gì? Backend không áp dụng cả hai, nên chữ đã bỏ khỏi checkout (plan 12.5).
- [ ] Thời hạn điểm (gợi ý 12 tháng) và ngày bắt đầu áp dụng (plan 02.5).
- [ ] Điểm từ đơn dùng được ngay hay sau khi lớp bắt đầu (plan 02).
- [ ] Câu chữ chính sách hoàn tiền trong "Lời hứa anyLEARN" (plan 10.1).
- [ ] Hệ số điểm theo hạng thành viên có chấp nhận chi phí không (plan 10.2).
- [ ] Trả góp: cách đối tác nhận tiền theo kỳ (plan 10.4).
- [ ] Chat lớp: giáo viên có được vào nhóm không; nội quy và điều khoản cộng đồng (plan 11).

## Bảng task

### Giai đoạn 1 – thắng nhanh + nền dữ liệu

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 12.1–12.6 | Sửa lỗi UI mobile | done | Chờ chủ sản phẩm chốt luật VNPay "giảm 1%, trên 100 triệu" |
| 04.7 | Hỏi "Tìm cho ai?" khi chưa đăng nhập + tự tạo con khi đăng ký + bắt buộc ngày sinh đầy đủ ở checkout | done | Chưa ghi `audience`/tuổi vào `search_logs` (chờ plan 01.1) |
| 01.1 | `search_logs` + ghi log + click | done | V18; `ref` do trình duyệt tạo thay cho `searchLogId`; cột lọc thay cho JSON |
| 01.2 | Form "Tìm giúp tôi" (`course_requests`) | done | Hiện ở kết quả trống, dưới mọi danh sách kết quả, trang chủ |
| 01.3 | Admin xử lý yêu cầu | done | Trang "Nhờ tìm khóa học"; thông báo cho khách có tài khoản; ZNS chưa làm |
| 01.4 | Dashboard xu hướng | done | Trang "Xu hướng nhu cầu" + CSV; truy vấn trực tiếp, chưa tính sẵn ban đêm |
| 13.0 | Kiểm kê app cũ trên store | done | App cũ đã xoá → chỉ PWA |
| 13.1 | Manifest + icon | done | `app/manifest.ts`, `public/icons/*` vẽ từ logo |
| 13.2 | Service worker (cache tĩnh, offline, cập nhật) | done | Không cache trang/API; banner "Tải lại" |
| 13.3 | Mời cài app đúng lúc (Android + hướng dẫn iOS) | done | `/today` từ lần 2, đơn thanh toán xong; chưa ghi sự kiện đo (để 13.7) |
| 13.4 | Backend Web Push (VAPID, `push_subscriptions`, `WebPushService`) | done | Migration V16; cần đặt `VAPID_*` trên server |
| 13.5 | FE xin quyền đúng cách + đăng ký push | done | Thẻ "Bật thông báo", `/account/notifications`; bỏ xin quyền lúc đăng nhập |
| 13.6 | SW nhận push, chống trùng với SSE, badge | done | Cùng tag `notif-<id>`; bấm mở `/notifications/open` |
| 13.7 | Đo cài app / push | todo | |
| 02.1 | API điểm dự kiến nhận | done | `ItemPointsResolver`, `GET /points/preview`, `points` trên dòng giỏ |
| 02.2 | "+X điểm" ở PDP/giỏ/đơn | done | thẻ khóa trong danh sách chưa làm |
| 02.3 | Công tắc dùng điểm ở checkout | done | `UsePointsToggle`, `maxUsablePoints` |
| 02.4 | Trang anyPoint timeline + `/info/anypoint` | done | chưa có dòng hết hạn (02.5) |
| 05.1 | Chống đơn trùng | done | |
| 05.2 | Lối vào đơn chờ | done | |
| 05.3 | Nhắc thanh toán | done | |
| 05.4 | Tự huỷ đơn quá hạn | done | |
| 05.5 | Đo đơn chờ | done | |
| 10.1 | Lời hứa anyLEARN | done | chờ xác nhận câu chữ hoàn tiền; có cả form báo giá |

### Giai đoạn 2 – khám phá

| Task | Mô tả | Trạng thái | Ghi chú |
|---|---|---|---|
| 03.1 | Khảo sát độ đầy đủ dữ liệu khóa học | skip | Chủ sản phẩm: không khảo sát, chuẩn hoá trước rồi hướng dẫn đối tác sau |
| 03.2a | Bảng tags: danh mục chuẩn + `item_tags` | done | V22; sửa lỗi tag lưu ở `items.tags` không vào search |
| 03.2b | Địa điểm / chi nhánh của đối tác (Google Places) | todo | |
| 03.2c | Thuộc tính còn lại (loại đối tác, số buổi, học thử, đối tượng) | todo | Xem câu hỏi chờ |
| 03.2d | Dọn bảng portal cũ (đổi tên `_old`) | todo | |
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

### 26/10/2026 – 03.2a bảng tags
- Nguyên nhân lỗi cũ: admin lưu tag vào cột `items.tags` (chuỗi cách nhau dấu phẩy) nhưng index MeiliSearch và `/search-tags`
  đọc bảng `tags` (mỗi dòng một tag của một khóa, do portal ghi) → tag nhập ở back office không bao giờ vào tìm kiếm;
  bảng cũ cũng cho gõ tự do nên trùng "bóng rổ / Bong ro".
- Làm: V22 đổi `tags` → `tags_old`, tạo `tags` (danh mục: tên, nhóm, thứ tự, ẩn/hiện) + `item_tags`; nạp tag từ `tags_old` (loại `class`)
  và từ `items.tags`, gộp trùng không phân biệt dấu/hoa thường (collation `utf8mb4_unicode_ci`); mọi tag cũ vào nhóm "Chưa phân loại".
- Admin: trang "Tags" (nhóm, đổi tên, ẩn, gộp vào tag khác, đếm số khóa); form khóa học chọn tag từ danh mục, gõ tag chưa có thì tạo.
  `PUT /admin/items/{id}` nhận `tagIds`; `GET` trả `tagIds`. Không còn ghi `items.tags`, `articles.tags` giữ nguyên (chuỗi, chỉ để hiện).
- `/api/search-tags` trả tag đang dùng nhiều nhất; MeiliSearch lấy tên tag từ `item_tags`.
- Việc của chủ sản phẩm: vào trang Tags xếp nhóm cho các tag "Chưa phân loại" sau khi chạy migration.

### 25/10/2026 – 10.1 Lời hứa anyLEARN
- Nội dung một chỗ: `config/promise.ts` (4 lời hứa, FAQ, dòng cam kết giá, link Zalo + giờ làm việc). PDP: dải 4 icon dưới nút đăng ký (`PromiseStrip`) + link "Vì sao đặt qua anyLEARN?"; checkout: dòng "Giá đã bằng hoặc rẻ hơn tại trường." trên dòng "Đơn này bạn sẽ nhận +X anyPoint"; trang `/info/why-anylearn` (4 lời hứa chi tiết, FAQ, nút báo giá, nút Zalo).
- "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": form (nơi thấy, giá, số điện thoại, ghi chú) → `POST /api/price-reports` → bảng `price_reports` (V21); khách chưa đăng nhập bắt buộc để số điện thoại; tối đa 5 báo mỗi ngày mỗi tài khoản/số; báo cho tất cả người nhận thông báo admin; trang admin "Báo giá rẻ hơn" (mới / đang kiểm tra / đã chỉnh giá / không đúng), "đã chỉnh giá" gửi thông báo cảm ơn cho người có tài khoản.
- Đã chạy thật: gửi báo giá bằng curl (đủ và thiếu số điện thoại), admin xem danh sách và cập nhật trạng thái trên MariaDB; form và trang giải thích kiểm trên mobile 390px.
- **Câu chữ hoàn tiền cần chủ sản phẩm xác nhận**: "Nếu lớp bạn đã đăng ký không mở, anyLEARN hoàn lại số tiền đã thanh toán. Các trường hợp đổi, trả khác theo Chính sách đổi - trả và hoàn tiền." (sửa tại `config/promise.ts`).
### 25/10/2026 – 05 đơn chờ thanh toán (05.1–05.5)
- 05.1: thêm giỏ (`/add2cart`) và thanh toán (`/checkout`) hỏi "Bạn đã có đơn #N cho khóa này" khi có đơn chờ cùng khóa + cùng người học + cùng ca (`findDuplicatePendingOrder`, có test); chọn "Tiếp tục thanh toán" hoặc "Tạo đơn mới". API `pending-orders` thêm `learnerId`, `scheduleId`, `createdAt`, `expiresAt`.
- 05.2: chấm đỏ số đơn chờ trên tab "Tài khoản" và ở menu "Đơn hàng của tôi"; thẻ "Bạn có N đơn chờ thanh toán" (kèm "giữ chỗ đến …") ở `/today` và đầu các trang Tài khoản, nút "Thanh toán ngay" vào thẳng `/order/{id}`; trang đơn có tab Đang chờ / Hoàn thành / Đã hủy; trang đơn hiện "anyLEARN giữ chỗ đến …".
- 05.3/05.4: job 15 phút (`PendingOrderFollowUpService`): nhắc ở `order/remind_hours` (mặc định 2h: thông báo + push; 24h: thêm email), tự hủy sau `order/auto_cancel_hours` (mặc định 72h), hoàn anyPoint đã dùng, báo khách (có câu "nếu đã chuyển khoản, đơn sẽ được khôi phục"). Dedupe bằng bảng `order_followups` (V20). Có cờ `order/auto_cancel_enabled` (đặt `0` để tắt hủy), tối đa 50 đơn hủy mỗi lượt. Bỏ qua nhắc nếu đã có đơn khác thanh toán cùng khóa + người học.
- 05.5: dashboard admin có mục "Đơn chờ thanh toán" (đang chờ, đã nhắc, % thanh toán sau nhắc, % tự hủy).
- Đã chạy thật trên MariaDB: 3 đơn mẫu (3h, 30h, 80h) → nhắc bước 1, nhắc bước 2 (chỉ bước mới nhất), hủy; số liệu dashboard đúng. Sửa luôn các nút xanh dương còn sót ("+ Thêm con", "Đánh giá", phân trang bài viết, chip lịch sử tìm kiếm).
- Chưa làm / cần chủ sản phẩm quyết: ZNS cho nhắc 24h (cần template ZNS đã duyệt); voucher hiện không bị đánh dấu đã dùng khi checkout nên chưa có gì để hoàn; lần chạy đầu trên production sẽ hủy hàng loạt đơn chờ cũ hơn 72h (tối đa 50 mỗi 15 phút).
### 25/10/2026 – ô mã giảm giá gọn lại
- Checkout chỉ hiện nút chữ "Bạn có mã giảm giá" (cùng kiểu với "Dùng số anyPoint khác"); bấm mới mở ô nhập mã, bấm lại thì ẩn. Đã áp mã thì ô luôn hiện để thấy mã đang dùng.
### 25/10/2026 – rà lại màu nút (chính/phụ/đã chọn)
- Nút "Áp dụng" mã giảm giá thành nút phụ (nền trắng, viền mảnh). `btn--blue`/`btn--yellow` thành xanh lá, `btn--outline`/`btn--white` thành nền trắng viền `line`, chữ `ink` (sửa tại `globals.css`, các trang cũ tự theo).
- Đổi nút xanh dương lẻ thành xanh lá (bật thông báo, xem đơn, Về Hôm nay, Đóng/Gửi ở /today, ...), nút phụ viền xanh dương thành trắng viền `line` (Sao chép, xem thêm đánh giá), mục đã chọn (phân trang, tab lọc bài viết, chip tài khoản, chip bé /today, tuần, đổi chế độ lịch) thành `border-green bg-green-soft text-green-dark`.
- Quy ước mới trong `anylearn_v2/CLAUDE.md`: mỗi lần sửa trang có nút phải kiểm lại từng nút chính hay phụ. Chưa rà: app admin (antd) và các nút nằm trong ảnh/banner.
### 25/10/2026 – thống nhất từ "anyPoint"
- Mọi chữ hiển thị (giao diện, thông báo, lịch sử giao dịch mới, admin) viết **anyPoint**, không viết "điểm"; giá trị quy đổi dùng dấu "~" ("Nhận +120 anyPoint (~120.000đ)"). Ghi trong `CLAUDE.md` gốc. Dòng lịch sử cũ trong DB vẫn giữ chữ cũ (chỉ nội dung giao dịch tạo từ nay mới dùng chữ mới).
### 25/10/2026 – 02.3 công tắc dùng điểm, 02.4 trang anyPoint
- Checkout: ô nhập điểm thay bằng công tắc "Dùng X điểm, giảm Y đ" (`UsePointsToggle`). X = `maxUsablePoints` = min(số dư, phần tiền còn lại sau mã giảm giá / 1.000đ), nên không bao giờ trừ điểm thừa không giảm thêm tiền; đổi mã giảm giá thì X tự tính lại. "Dùng số điểm khác" mở ô nhập số điểm ít hơn. "anyPoint là gì?" mở popup 3 dòng và link `/info/anypoint`. Tổng tiền: Tạm tính / Dùng anyPoint / Mã giảm giá / Tổng thanh toán (có sẵn). Sửa luôn lỗi cũ: số điểm gửi lên server là số điểm đang áp dụng, không phải chữ trong ô nhập.
- `/account/anypoint`: thẻ số dư kèm quy đổi VND, lịch sử có lý do ("Điểm từ đơn #42", "Dùng điểm cho đơn #41", "Điểm giới thiệu bạn bè") và link "Xem đơn", khối "Cách nhận / Cách dùng điểm" ở dưới lịch sử. `/info/anypoint` công khai, link từ PDP.
- Backend: `GET /user/wallet-c-history` thêm `orderId` (điểm từ đơn của chính mình và điểm đã dùng/hoàn; điểm giới thiệu không có link vì đơn của người khác).
- Chưa làm: dòng "X điểm hết hạn ngày …" (chờ 02.5), điểm review (chờ plan 09). Nội dung "cách nhận điểm" là chữ chung, chưa có số cụ thể vì mỗi khóa mỗi khác (số hiện ở trang khóa).
### 25/10/2026 – 02.2 hiện "+X điểm"
- PDP: badge "Nhận +120 điểm (= 120.000đ)" dưới giá (gọi `/points/preview` cùng lúc với `/pdp`, ẩn khi 0 điểm). Checkout: dòng "Đơn này bạn sẽ nhận +X điểm (= Y đ)" dưới Tổng thanh toán, cộng từ `points` của từng dòng giỏ. Trang đơn: "Đã cộng X điểm, số dư Y điểm" khi đơn đã duyệt; trang tải lại đơn và số dư khi vừa thanh toán xong.
- Backend: `GET /order/{id}` thêm `pointsEarned` (tổng điểm thưởng người mua của các dòng trong đơn, giao dịch `commission` không có `ref_user_id`).
- Chưa làm: badge nhỏ trên thẻ khóa học trong danh sách (để sau, sau cờ tính năng, xem có làm rối không). Hàm thuần + test ở `lib/points/reward.ts`.
### 25/10/2026 – 02.1 API điểm dự kiến nhận
- `ItemPointsResolver` gom phần lấy cấu hình hoa hồng của khóa (config chung, `company_commission` của khóa, tỉ lệ khóa/tác giả); `CartService.createPendingCommissions` và API xem trước cùng dùng nó nên không lệch nhau.
- `GET /v2/api/points/preview?itemId=` (công khai) → `{points, vndValue}`; mỗi dòng `GET /cart` có thêm `points`. Tổng giỏ do FE cộng (giữ nguyên dạng danh sách của `/cart`).
- Điểm người mua tính trên giá niêm yết của khóa (giống lúc tạo đơn), chưa trừ mã giảm giá hay điểm đã dùng.
- Test: `ItemPointsResolverTest` (preview = điểm lúc tạo đơn, ghi đè theo khóa, `bonus_rate` khác, hoa hồng -1 / giá 0). Chưa làm: 02.2 (hiện ra giao diện).
### 25/10/2026 – chỉnh nhỏ PWA và admin (việc chen ngang, trước plan 02)
- Thanh tab dưới cao hơn (3,75rem + vùng an toàn; khi chạy dạng app đã cài thì đệm thêm 1,25rem cho màn hình cong). Biến `--app-tabs-pad`, `--app-tabs-h` trong `globals.css`, các chỗ nổi phía trên thanh tab dùng chung biến này.
- Bấm ra ngoài hoặc nhấn Esc thì đóng popup chuông thông báo và menu tài khoản (`useDismissOnOutside`, nghe `pointerdown` ở `document` vì header có `backdrop-blur` nên lớp phủ `fixed` bị kẹt trong header).
- Admin: menu "Cài đặt" tự đóng sau khi chọn mục con.
- Đã kiểm tay bằng Playwright: tab cao 69px, popup đóng khi bấm ngoài và khi Esc, menu admin đóng sau khi chọn.

### 25/10/2026 – người nhận thông báo admin (việc chen ngang, trước plan 02)
- Trước đây thông báo cho quản trị chỉ gửi tới user có role `admin`. Giờ trong admin (Cài đặt > "Người nhận thông báo admin") thêm
  được thành viên khác (tối đa 50, không phải admin/bé/tài khoản khoá); mọi nơi gửi thông báo admin (đơn mới, chuyển khoản, yêu cầu
  tìm khóa học, nghỉ/đổi lịch, kiểm toán, đăng ký hoạt động) dùng `findAdminNotificationRecipients()`. V19 `admin_notification_recipients`.
- Người được thêm đăng nhập app, bật thông báo (Tài khoản > Thông báo) là nhận push như thông báo thường; có nút "Gửi thông báo thử
  cho mọi người". Họ không vào được trang admin (đăng nhập admin cần role `admin`), bấm thông báo thì về trang chủ.
- Kiểm tra: 195 test backend; thử thật trên MariaDB + trang admin: thêm "Chị Support" → lưu → thử gửi (cả 2 người nhận) → khách gửi
  yêu cầu tìm khóa học (cả 2 nhận) → bỏ khỏi danh sách (chỉ admin nhận). Chưa thử push tới điện thoại thật (cần khoá VAPID).
- Quyết định: quản trị viên luôn nhận, danh sách chỉ thêm người; nếu muốn tắt thông báo cho một admin cụ thể thì làm riêng.

### 25/10/2026 – plan 01 xong (01.1–01.4)
- Backend (V18): `search_logs`, `course_requests`; `SearchLogService` ghi bất đồng bộ trên một luồng riêng để giữ thứ tự; tìm lại cùng
  từ khoá trong 10 giây thì **cập nhật dòng cũ** (bộ lọc mới nhất, `ref` mới nhất) thay vì thêm dòng; chỉ giữ lượt bấm đầu tiên.
  `POST /api/course-requests` mở cho khách chưa đăng nhập (chuẩn hoá số điện thoại, tối đa 3 yêu cầu/số/ngày), admin nhận thông báo.
  Admin: `/admin/course-requests` (đổi trạng thái, gán khóa học, thông báo khách có tài khoản), `/admin/insights/search`.
- FE: tracking trong `createSearchTracking`/`trackSearchClick`; form `CourseRequestModal` (điền sẵn từ khoá, tuổi, khu vực); bộ lọc tuổi
  của khách được áp trước lần tìm đầu để không tìm (và ghi log) hai lần. Admin: 2 trang mới + xuất CSV.
- Kiểm tra bằng **MariaDB 10.11 thật** (cài trong máy test): 18 migration chạy, Hibernate `validate` qua, gọi API thật (tìm kiếm, bấm,
  gửi yêu cầu, giới hạn 3/ngày, admin cập nhật, báo cáo) và truy vấn báo cáo chạy đúng; Playwright: khách khai bé → tìm "cờ vua" →
  không có kết quả → gửi form → có dòng ở admin; trang admin chụp ở 1440px, CSV mở đúng tiếng Việt. Meilisearch không chạy trong máy test
  nên mọi tìm kiếm trả 0 kết quả; "lĩnh vực xem nhiều ít đơn" chưa có dữ liệu để thử (truy vấn đã chạy, trả rỗng).
- Chưa làm: 01.5 (khảo sát sở thích khi thêm con, giai đoạn 2); ZNS/email cho khách khi tìm được khóa; tính sẵn báo cáo ban đêm (đo
  khi dữ liệu lớn); dọn log cũ hơn 12 tháng.

### 25/10/2026 – thống nhất màu nút (04.7)
- Chip "tìm cho ai" ở trang chủ (trắng), tìm kiếm (xanh dương), khóa học (xanh lá nhạt) đang ba kiểu → dùng một hệ xanh lá
  nhạt (`components/guest/chipStyles.ts`): chọn = xanh lá nhạt viền xanh; chưa chọn = trắng viền mảnh; nút đổi = tròn xanh lá,
  icon refresh trắng, tooltip "Thay đổi". Chữ "Gợi ý cho" nằm trong từng nút ở trang chủ. Bảng khai cũng đổi từ xanh dương sang xanh lá.
- Quy tắc màu nút ghi vào `anylearn_v2/CLAUDE.md` (primary xanh lá đặc, secondary trắng viền, chip chọn xanh lá nhạt, không dùng xanh dương cho nút).

### 25/10/2026 – popup "tìm cho ai" không hiện lại (04.7)
- Kiểm tra lại: khách mới và khách vừa đăng xuất đều được hỏi. Không hỏi lại trong 7 ngày sau "Để sau" hoặc "Xoá thông tin đã
  nhập", và khi đó trang chủ không có chỗ mở lại → thêm nút "Tìm cho ai?" dưới ô tìm kiếm (trang tìm kiếm đã có sẵn).
- Đăng nhập mà bé khai đã có trong tài khoản (trùng tên) thì không hỏi "Thêm bé" nữa → hiện thông báo "Bé Bin đã có trong tài
  khoản, không thêm lại" để người dùng biết chuyện gì xảy ra.

### 25/10/2026 – sửa 2 lỗi 04.7 (bé trùng tên, danh sách không tự tải)
- Lỗi 1: khai "Bin" 2020 trong khi tài khoản đã có "Bin" 15 tuổi vẫn bị thêm thành bé thứ hai (so khớp cần cả năm sinh).
  Sửa: so khớp theo **tên không dấu** (bé trùng tên dùng luôn bé đã có), và backend không cho tạo/đổi tên thành tên đã có trong
  tài khoản (`PersonNames`, lỗi 400 "Đã có bé tên …"); bảng khai báo lỗi khi hai bé trùng tên.
- Lỗi 2: bấm "Thêm" bé sau khi đăng nhập ở `/add2cart` phải F5 mới thấy → `notifyChildrenChanged` làm trang đang mở tải lại
  danh sách bé (giữ nguyên ca/lịch đã chọn) và chọn bé vừa chọn.
- Kiểm tra: backend 159 test, FE 174 test, typecheck, lint, build ok; Playwright với API giả: đăng nhập khi đang ở `/add2cart`
  với "Bin 2020" + "Gà 2017" → chọn sẵn Bin 15 tuổi có sẵn, chỉ hỏi thêm Gà, bấm Thêm thấy Gà ngay, server không có Bin thứ hai.

### 25/10/2026 – chỉnh dải gợi ý trang chủ (04.7)
- Dải "Khóa học hợp với Bin" nằm sát khối benefits và kéo dài hết chiều ngang trên desktop → chuyển vào ngay dưới ô tìm kiếm
  của hero, dạng chip nền trắng có viền như trang tìm kiếm ("Gợi ý cho" [Bin · 6t] [Su · 9t] [Sửa]); bấm chip mở `/search?age=...`.

### 25/10/2026 – 04.7 xong
- Khách chưa đăng nhập vào `/`, `/search`, `/class/*` được hỏi "Tìm cho ai?" (sheet nhẹ, hiện sau 1,5 giây, "Để sau" ẩn 7 ngày).
  Con: tên/biệt danh + năm sinh (tối đa 5); bản thân: năm sinh tuỳ chọn. Lưu `localStorage` (`anylearn.guestLearners`).
- Dùng ngay khi chưa có tài khoản: dải "Khóa học hợp với Bin · 11t" ở trang chủ; chip trên `/search` đặt bộ lọc `age` (tự lọc
  một lần mỗi tab, bấm lại chip để bỏ); chọn bé ở trang khóa học.
- Đăng ký: tạo con trước khi lưu đăng nhập (dob `yyyy-01-01`, `dob_year_only = 1`), chọn sẵn bé ở `/add2cart`, xoá storage;
  lỗi giữa chừng thì giữ phần chưa tạo. Đăng nhập: bé trùng (tên không dấu + năm sinh) dùng luôn, bé mới thì hỏi "Thêm bé".
- Checkout: dòng giỏ có `dobComplete`; form ngày/tháng (năm điền sẵn, đổi năm phải tích xác nhận); nút thanh toán khoá tới khi
  đủ; backend chặn `LEARNER_DOB_REQUIRED` và kiểm tra lại độ tuổi với ngày sinh đầy đủ. Migration V17.
- Quyết định cần theo dõi: luật "cần ngày sinh đầy đủ" áp cả cho **chủ tài khoản** khi chính họ là người học (đúng plan), nên
  người dùng cũ chưa có `dob` sẽ phải nhập ngày sinh ở lần thanh toán tới. Nếu thấy cản trở thì chỉ áp cho tài khoản con.
- Kiểm tra: backend 155 test pass (mới: `LearnerDobTest`, `CartServiceDobTest`); FE typecheck, lint, 23 file test, build ok;
  Playwright 390px với API giả: hỏi lần đầu, lưu 2 bé, dải trang chủ, chip tìm kiếm, đăng ký tạo đúng 2 bé và chọn sẵn bé, checkout
  khoá nút tới khi nhập ngày sinh, ngày không tồn tại, đổi năm cần xác nhận.
- Chưa làm / ghi chú: chưa thử trên Java thật + MySQL (migration V17 chưa chạy trên DB thật); chưa ghi `search_logs` (plan 01);
  trang chủ chỉ có dải link, chưa cá nhân hoá các khối theo tuổi (plan 04.3).

### 25/10/2026 – plan 12: sửa lỗi UI mobile
- 12.1: nút "N" là dev indicator của `next dev` → `devIndicators: false` trong `next.config.ts` (bản production không có nút này).
- 12.2: thanh sự kiện dưới header xuống tối đa 2 dòng thay vì cắt chữ; nút còn "Hôm nay" trên mobile.
- 12.3: footer dưới `lg` gập 2 nhóm link thành accordion (`<details>`, đóng mặc định), giữ liên hệ + mạng xã hội;
  cao ~554px ở 390px khi đóng (chưa đo bản cũ để so). Desktop giữ nguyên lưới 4 cột.
- 12.4: checkout và trang đơn ghi đủ số tiền (`formatExactPrice`): dòng khóa học, Tạm tính / Dùng anyPoint / Mã giảm giá /
  Tổng thanh toán, đơn chờ thanh toán.
- 12.5: bỏ "(giảm 1%) (trên 100 triệu)" khỏi VNPay vì backend không áp dụng (hỏi lại chủ sản phẩm); viết lại nhãn trả góp.
  Phần bật/tắt điểm 1 chạm vẫn để plan 02.3.
- 12.6: nút sửa con thành nút bút chì 44px; thêm con xong tự chọn bé vừa thêm.
- Kiểm tra: typecheck, lint, test, build ok; Playwright 390px chụp thanh sự kiện, footer đóng/mở, checkout có dùng điểm,
  chọn người học.

### 25/10/2026 – PWA: Web Push xong (13.4–13.6)
- Backend: thư viện `nl.martijndwars:web-push` 5.1.1 (BouncyCastle `bcprov-jdk18on`, ép `jose4j` 0.9.6 vì bản 0.7.0 kèm theo có CVE).
  Bảng `push_subscriptions` (V16), `WebPushService` (gửi bất đồng bộ qua pool `pushExecutor`, 404/410 xoá thiết bị, 5 lần lỗi
  liên tiếp xoá), API `/v2/api/push/{public-key,subscribe,unsubscribe,test}`. Mọi `createNotification` và thông báo hẹn giờ
  (`dispatchDueNotifications`) đều gửi push sau commit, trừ loại `sms`/`zalo`. Env `VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT`.
- FE: bỏ xin quyền tự động lúc đăng nhập; `AppPromptCard` (thẻ "Bật thông báo" hoặc thẻ cài app) ở `/today` và trang đơn
  (đang chờ chuyển khoản / đã thanh toán); trang `/account/notifications` (bật, tắt, gửi thử, hướng dẫn iPhone và khi bị chặn);
  tự đăng ký lại thiết bị đã cho phép trước đây; đăng xuất thì gỡ thiết bị; SW hiện thông báo, số trên icon app; bấm vào mở
  `/notifications/open` (đánh dấu đã đọc, chuyển đúng trang, dùng chung bộ map route với chuông).
- Kiểm tra: backend 141 test (thêm test gửi thật qua thư viện tới server giả: mã hoá aes128gcm + chữ ký VAPID; test này bắt
  được lỗi chưa đăng ký provider BouncyCastle, đã sửa). `AnyLearnBackendV2ApplicationTests` cần MySQL nên không chạy ở máy
  test. FE: typecheck, lint, 21 file test, build ok. Playwright (Chromium, giả lập Android): thẻ hiện, không tự xin quyền,
  push gửi vào SW hiện đúng tiêu đề/nội dung/tag, bấm thông báo về `/account/orders`, trang cài đặt hiện đúng trạng thái;
  máy test không tới được máy chủ push của Google nên bước đăng ký thật báo "Chưa bật được" (đúng, sau 20 giây).
- Chưa làm: chưa thử trên điện thoại thật với VAPID thật; 13.7 (đo); splash iOS; giờ yên lặng cho tin quảng cáo (chưa có
  loại tin quảng cáo nào gửi push).

### 25/10/2026 – PWA 13.1–13.3 xong
- Chủ sản phẩm: app cũ trên store đã xoá → chỉ PWA, làm trước. Thứ tự giai đoạn 1 giờ là 13 trước.
- Làm: manifest + icon, `public/sw.js` viết lại (cache file tĩnh, trang `offline.html`, cập nhật bằng nút "Tải lại"),
  `ServiceWorkerRegister` (gom đăng ký SW, bỏ khỏi `useNotifications`), `InstallAppCard` (Android: hộp thoại cài của
  Chrome; iOS: hướng dẫn Safari; Zalo/FB: hướng dẫn mở trình duyệt + sao chép link; "Để sau" ẩn 14 ngày).
- Sửa lỗi phát hiện khi test: lần đầu SW kích hoạt (`clients.claim`) làm trang tự tải lại → chỉ tải lại sau khi bấm "Tải lại".
- Kiểm tra: typecheck, lint, 19 file test pass; `next build` ok; Playwright trên bản build: manifest + header `sw.js`
  no-store, SW điều khiển trang, mất mạng hiện "Mất kết nối", thẻ cài hiện đúng trên iPhone và Zalo, "Để sau" ẩn thẻ.
- Chưa làm: 13.4–13.6 (Web Push) chờ đồng ý thư viện Java; vẫn còn xin quyền thông báo tự động lúc đăng nhập
  (bỏ cùng 13.5 để không mất thông báo khi tab đang mở); splash screen iOS chưa có; đo cài app (13.7).

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
