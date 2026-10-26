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
| 26/10/2026 | Giữ: video bài giảng, hỏi đáp, mã code + phụ kiện, knowledge (helpcenter). Bỏ: contracts, sale_activities, activitybonuses, spms, migrations, password_resets, hồ sơ chuyên môn (specs) và user_reviews. Loại đối tác lưu ở đối tác; học thử dùng cờ cũ; số buổi lấy từ `cycle_type`/`cycle_amount`. |
| 26/10/2026 | Bảng portal cũ không còn dùng: đổi tên thành `<tên>_old`, 1–2 tháng sau mới xoá hẳn. |
| 25/10/2026 | Đồng ý thêm thư viện Java `nl.martijndwars:web-push` (+ BouncyCastle) cho Web Push (plan 13.4). |
| 25/10/2026 | App cũ trên store đã bị xoá, lượt tải không đáng kể → **chỉ làm PWA**, làm trước (plan 13). Push dùng Web Push thuần, không FCM. |
| 25/10/2026 | 04.7 làm ở **giai đoạn 1**. Lúc đầu chỉ cần năm sinh; checkout bắt buộc nhập ngày sinh đầy đủ của người học trước khi thanh toán (FE khoá nút + backend chặn tạo đơn). |

## Câu hỏi đang chờ chủ sản phẩm

- [ ] Bảng `class_plans`, `social_posts`, `i18n_contents`, `participations` chưa rõ còn dùng không: tạm giữ (plan 03.2d).

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
| 03.2b | Địa điểm / chi nhánh của đối tác (Google Places) | done | V23; cần `GOOGLE_MAPS_API_KEY` (Places API New) trên server |
| 03.2c | Thuộc tính còn lại (loại đối tác, số buổi, học thử) | done | `users.partner_type` (V25) chọn ở trang Thành viên; học thử dùng `activiyTrial`; số buổi suy ra từ `cycle_type`/`cycle_amount` khi lập chỉ mục (03.4) |
| 03.2d | Dọn bảng portal cũ (đổi tên `_old`) | done | V24 đổi tên 11 bảng; xoá entity/repository tương ứng |
| 03.3 | Admin nhập liệu + cảnh báo thiếu | done | Cảnh báo ở trang khóa + trang "Thiếu thuộc tính"; tiêu chí xong chờ chủ sản phẩm nhập liệu |
| 03.4 | Index MeiliSearch | done | Thử trên Meilisearch 1.12 thật; cần `POST /admin/reindex` sau khi deploy |
| 03.5 | API search bộ lọc mới | done | Chưa có `ageFor=<learnerId>`: FE gửi `ageFrom/ageTo` (xem ghi chú nhật ký) |
| 04.1 | Chip chọn người học | done | Tài khoản: `Tất cả / con / Tôi` (tuổi từ ngày sinh, bé chỉ có năm sinh = 2 tuổi khả dĩ), nhớ lựa chọn `anylearn.activeLearner`; khách giữ chip cũ. Mới gắn vào trang search, trang chủ làm ở 04.3 |
| 04.2 | Chip lọc nhanh + bộ lọc đầy đủ | done | Chip: Gần tôi/Cuối tuần/Tối trong tuần/Học thử/Giảm giá/Online; panel thêm quận, khung giờ, đối tác, giá tối đa (thanh trượt), khai giảng, tag; thẻ có khoảng cách/giờ/Học thử/Giảm giá. Chưa có "+X anyPoint" trên thẻ |
| 04.3 | Trang chủ mobile gọn | done | Còn 5 khối: hero (tìm kiếm + chip bé + chip nhanh), Dành cho {bé}, Đang hot gần bạn (cần địa chỉ đã lưu), chuyên gia/đối tác nổi bật, CTA nhờ tìm giúp + 3 bài viết. Chưa có khối bộ sưu tập (04.4) và nút "Thử điều mới" (04.5); PromoSlider giữ lại tới khi có bộ sưu tập. Chưa đo trước/sau |
| 04.4 | Bộ sưu tập | done | Chọn tay + gợi ý theo bộ lọc, không dùng `filter_json`; mùa là khoảng ngày tuyệt đối (năm sau phải sửa tay). Tìm gợi ý cần Meilisearch nên chưa thử với Meilisearch thật trong sandbox (chỉ thử CRUD thật + gợi ý giả lập) |
| 04.5 | Trang chuyên gia + "Ngẫu nhiên" | done | Trang `/partner/[id]` (giới thiệu, khóa đang mở, cơ sở, theo dõi), `/discover`. Chưa có phần review (chờ plan 09) và "thành tích" (chưa có dữ liệu) |
| 01.5 | Khảo sát sở thích khi thêm con | todo | |
| 09.1 | Review xác thực | done | Nhãn "Đã học tại anyLEARN", ẩn/hiện (admin), một review/khóa/người (theo tài khoản, chưa tách theo bé) |
| 09.2 | Review tiêu chí + ảnh | done | 4 tiêu chí, cụm gợi ý, tối đa 4 ảnh; ảnh cần S3 (chưa thử upload thật) |
| 09.3 | Hiển thị review PDP/đối tác | done | Tóm tắt, lọc có ảnh/theo sao, trang đối tác tổng hợp. Chưa lọc theo tuổi bé |

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
| 09.4 | Đối tác trả lời + báo cáo review | partial | Đối tác trả lời ngay trên trang khóa học (theo yêu cầu 26/10); chưa có nút "Báo cáo review" |
| 09.5 | Nhắc viết review | done | Nhắc ở nửa khóa và khi hết khóa (mỗi mốc 1 lần), quét mỗi giờ; chưa có thẻ "Review chờ viết" ở "Cần làm ngay" (chờ plan 06) |
| 09.6 | Thưởng điểm review | done | 20 anyPoint cho nhận xét từ 50 ký tự + 20 khi có ảnh (chỉnh được, mặc định do mình chọn, chờ chủ sản phẩm xác nhận); thu hồi khi ẩn/xóa; chưa dùng `point_lots` (chờ 02.5) |
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

### 27/10/2026 – gom nhóm menu admin
- Menu trái chia 5 nhóm: Tổng quan · **Đơn hàng** (Đơn hàng, anyPoints, Tài chính) · **Quản lý thành viên** (Thành viên, Hoạt động = học thử/test/tham quan, Nghỉ / đổi lịch, Nhờ tìm khóa học, Báo giá rẻ hơn) · **Khóa học** (Khóa học, Lịch học, Tags, Thiếu thuộc tính) · **Nội dung & phân tích** (Bài viết, Xu hướng nhu cầu). Menu "Cài đặt" ở đáy chia 2 nhóm: Thông báo (email, Zalo OA, người nhận thông báo) và Thanh toán (tài khoản ngân hàng, kiểm toán anyPoint).
- Danh sách dài hơn màn hình thì cuộn riêng, nút Cài đặt không bị đẩy mất.

### 27/10/2026 – nhập hàng loạt địa chỉ từ hợp đồng
- Nút "Nhập địa chỉ từ hợp đồng" ở trang Thành viên mở cửa sổ liệt kê đối tác có hợp đồng đã ký/đã duyệt, chưa có địa chỉ (tối đa 500); bấm "Bắt đầu nhập" thì xử lý lần lượt từng người, hiện địa chỉ trong hợp đồng, địa chỉ mới (kèm khu vực) và kết quả; có thanh tiến độ, nút Dừng/Tiếp tục.
- Chỉ lưu (làm "Hội sở") khi Google có đúng 1 gợi ý chứa số nhà và tên đường của hợp đồng; nhiều gợi ý hoặc không khớp → "Cần xem lại" kèm gợi ý, không có → "Không tìm thấy"; cả hai có link "Xử lý tay". Mỗi dòng đã nhập có "Hoàn tác".
- Thử bằng server Places giả: 4 đối tác (1 khớp, 1 hai kết quả khớp, 1 không thấy, 1 gợi ý lệch) cho ra đúng 1 / 1 / 1 / 1; đối tác đã có địa chỉ hoặc hợp đồng mới (status 1) không có trong danh sách; hoàn tác ẩn địa chỉ.
- Có ô "Số lượng" để chạy từng đợt (để trống = chạy hết); nút Dừng vẫn dùng được (dừng sau đối tác đang xử lý). Kết quả "cần xem lại / không tìm thấy" không lưu DB: mở lại cửa sổ thì các dòng này về "Chờ" (đã cân nhắc lưu, chủ sản phẩm chọn không cần).
- Nút nhập dùng luôn bộ lọc đang bật ở danh sách (tìm kiếm, role, trạng thái, ký HĐ); cửa sổ ghi rõ bộ lọc đang áp dụng.
- "Xử lý tay" mở popup địa chỉ ngay trong cửa sổ nhập; đóng popup thì dòng đó cập nhật thành "Đã xử lý tay" kèm địa chỉ mới (có link Sửa) và thanh tổng kết đếm lại.
- Chưa chạy với Google thật: nên chạy thử vài đối tác trước, xem tên quận/phường và độ khớp.

### 27/10/2026 – sửa nhầm bảng contracts, "Ký HĐ" = 99, địa chỉ từ hợp đồng
- V24 đã đổi tên nhầm `contracts` (vẫn đang dùng, quan trọng). V27 đổi tên lại nếu bảng đang là `contracts_old` (chạy lặp lại an toàn, không đổi V24 nên không lệch checksum); khôi phục entity `Contract` + repository, hằng số trạng thái 0/1/10/99.
- "Ký HĐ" trước đây coi `is_signed = 1` là đã ký (công tắc, bộ lọc, chỉ mục tìm đối tác), trong khi portal ghi 99 → nay "đã ký" là `is_signed = 99`; công tắc ghi 99/0. Dòng nào v2 từng bật thành 1 sẽ hiện chưa ký (1 = hợp đồng mới) và cần bật lại.
- Form địa chỉ đối tác gợi ý địa chỉ trên hợp đồng (nút "Dùng địa chỉ này"); "Tìm tự động" để trống thì tìm theo địa chỉ hợp đồng rồi mới theo tên. Chưa làm: nhập hàng loạt địa chỉ hợp đồng cho mọi đối tác (cần quyết định vì tốn lượt gọi Google).
- Đổi chữ "Tự áp dụng" thành "Đối tác chỉ có 1 địa chỉ, hệ thống dùng luôn: …".

### 27/10/2026 – form thêm/sửa ca học gọn lại
- Modal tách thành `components/ScheduleFormModal.jsx`, chia mục: Tên + loại lịch (3 nút chọn nhanh, có mô tả) → **Thời gian** (các thứ; "khai giảng → kết thúc" và "giờ học" mỗi cặp một hàng) → **Địa điểm** (chỉ hiện khi khóa cần địa chỉ: chọn địa chỉ + phòng học) → **Học online** (chỉ hiện với khóa online, hoặc khi bấm "+ Thêm link học online", hoặc ca đã có link) → **Ngoại khóa** (chỉ hiện với khóa ngoại khóa).
- Thử: tick 2 địa chỉ khi thêm ca tạo đúng 2 ca. Lưu ý: bấm Enter trong ô giờ cũng gửi form.

### 27/10/2026 – bỏ logic riêng cho "Thu hộ học phí"
- Công tắc "Thu hộ học phí" về lại tab Tài chính; không còn ẩn ca học hay miễn kiểm tra nào theo công tắc này (khóa thu hộ cũng cần địa chỉ như khóa khác). Tab Lịch học chỉ còn 2 khối: "Địa chỉ học" (chỉ hiện khi khóa cần địa chỉ) và "Thời gian & ca học".
- Sửa giao diện ô chọn nhiều địa chỉ tràn khỏi thẻ (lưới `1fr` → `minmax(0, 1fr)`).
- Giữ bản sửa lỗi lưu `isPaymentfee` ở backend.

### 27/10/2026 – thu hộ học phí vẫn cần địa chỉ, địa chỉ chọn nhiều
- Khóa thu hộ học phí không có ca học nhưng **vẫn cần địa chỉ học** (bỏ ngoại lệ lúc trước): chỉ ẩn danh sách ca học; "Thiếu thuộc tính" chỉ miễn lịch/số buổi.
- Khóa không có ca học chọn được **nhiều địa chỉ** (`item_locations`, V26; `items.user_location_id` giữ địa chỉ chính). Chỉ mục tìm kiếm lấy mọi địa chỉ của khóa và các ca.
- Sửa lỗi cũ: công tắc "Thu hộ học phí" ở admin chưa bao giờ được lưu (backend không nhận/trả `isPaymentfee`); nay lưu và đọc đúng.

### 27/10/2026 – gom lại tab Lịch học của trang khóa học
- Tab "Lịch học" còn 2 khối: (1) **Hình thức khóa học**: công tắc "Thu hộ học phí" (chuyển từ tab Tài chính) + địa chỉ học và nút quản lý địa chỉ đối tác (chuyển từ tab Tổng quan), có ghi chú "khóa có ca học thì dùng địa chỉ của ca"; (2) **Thời gian & ca học**: chiêu sinh liên tục, chu kỳ thanh toán và danh sách ca học.
- Bật "Thu hộ học phí" thì ẩn địa chỉ và danh sách ca học; backend không bắt địa chỉ và không báo thiếu địa điểm/lịch/số buổi cho khóa thu hộ.

### 27/10/2026 – sửa migration V22/V23 cho dữ liệu thật
- `contextLoads` lỗi trên DB của chủ sản phẩm vì migration chạy trên dữ liệu portal "bẩn". Tái hiện được trên DB giả có dữ liệu bẩn: V22 dùng `JSON_TABLE` trên cột `items.tags` (có dấu nháy, gạch chéo, xuống dòng → "Character disallowed in JSON"); V23 `CAST` toạ độ chữ ("abc", "10,77", rỗng) trong `WHERE` không đảm bảo thứ tự.
- Sửa: V22 tách chuỗi bằng bảng số (không dùng JSON), `INSERT IGNORE` + collation rõ ràng; V23 dùng `CASE` bảo vệ `CAST`. Kiểm tra lại: DB V21 có tag trùng khác dấu/hoa thường, CSV có ký tự đặc biệt, toạ độ rác (rỗng, chữ, đảo vĩ/kinh độ, 999) chạy tới V25 thành công; 276 test pass trên DB sạch.
- DB đã chạy V22 lỗi dở thì phải khôi phục từ bản sao lưu (MySQL không rollback DDL): xem hướng dẫn trong báo cáo.

### 27/10/2026 – lưu khóa học bắt buộc có địa chỉ
- Khóa dạy tại nơi (không phải Online / Mã code / Video) của đối tác không phải loại "Ứng dụng (bán mã code)" (`partner_type = app`, mức đối tác) phải có địa chỉ mới lưu được.
- Khóa chưa có ca học: lưu địa chỉ vào `items.user_location_id`; có ca học: lưu theo từng ca. Đối tác 1 địa chỉ thì tự áp dụng; nhiều địa chỉ thì phải chọn (tạo ca học tick nhiều địa chỉ = mỗi địa chỉ một ca). Chưa có địa chỉ thì chặn và hiện dòng nhắc "Cập nhật địa chỉ của đối tác" mở popup quản lý.
- Sửa lỗi cũ: lưu khóa học bị API từ chối (resultCode 0) vẫn báo "Đã lưu"; nay hiện lỗi. Lưu/xoá ca học giờ cập nhật lại chỉ mục tìm kiếm.
- Thử bằng curl trên DB thật: nhiều địa chỉ chưa chọn bị chặn, chọn thì lưu, ca học tick 2 địa chỉ tạo 2 ca, đối tác không địa chỉ bị chặn, đối tác `app` và khóa online qua, 1 địa chỉ tự áp dụng.

### 27/10/2026 – địa chỉ chuyển vào trang Thành viên
- Bỏ trang/menu "Địa điểm" riêng (dùng không tiện). Mọi vai trò đều có địa chỉ: thành viên = địa chỉ nhà (ít nhất khu vực, cho "gần tôi"), đối tác = nhiều cơ sở, một hội sở mặc định.
- Danh sách Thành viên có cột "Địa chỉ" (thành viên: icon bản đồ; đối tác: "N cơ sở"; chưa có: "+ Thêm địa chỉ"; bấm mở popup) và bộ lọc Tất cả / Có / Chưa có địa chỉ (`hasLocation`).
- Trang Thành viên > chi tiết > "Quản lý" mở popup danh sách (link bản đồ, sửa, ẩn, đặt làm hội sở, thêm địa chỉ).
- Form thêm có nút "Tìm tự động": 1 kết quả thì điền luôn; nhiều kết quả thì liệt kê kèm link bản đồ, checkbox chọn lưu, radio chọn hội sở, lưu hàng loạt (`POST /admin/locations/bulk`).
- Thử bằng server Places giả + Playwright: 1 kết quả điền ngay, 3 kết quả tick 2 và chọn hội sở lưu đúng, trùng `place_id` không lưu hai lần. Chưa thử với Google thật.

### 26/10/2026 – 03.3 cảnh báo thiếu thuộc tính
- `ItemAttributeGaps` (thuần, có test): thiếu độ tuổi, lĩnh vực, tags, địa điểm có toạ độ (khóa offline/ngoại khóa/mầm non), lịch học có giờ và số buổi (trừ khóa mã code/video), loại đối tác.
- `GET /admin/items/attribute-gaps` (thống kê + 300 khóa đầu), `GET /admin/items/{id}` trả `gaps`. Admin: trang "Thiếu thuộc tính" và thẻ cảnh báo vàng ở đầu trang khóa.
- Tiêu chí "≥ 90% khóa có tuổi, khu vực, hình thức, tag" đo bằng chính trang này sau khi đội vận hành nhập liệu.

### 26/10/2026 – 03.4/03.5 chỉ mục và bộ lọc tìm kiếm
- Thêm vào document: quận, `_geo`, danh sách cơ sở, khung giờ, loại đối tác, học thử, đang giảm giá, tag, giá/buổi, ngày khai giảng gần nhất.
  API `/api/search` nhận tuổi người học, quận, "gần tôi" (+`distanceKm`), khung giờ, loại đối tác, học thử, khuyến mãi, tag, khoảng giá, khai giảng trong N ngày;
  sắp xếp thêm: khai giảng sớm, giá/buổi, gần nhất. Dựng filter bằng hàm thuần có test (`SearchFilterBuilder`).
- Thử với Meilisearch 1.12 thật trên dữ liệu demo: lọc tuổi (khóa không giới hạn tuổi vẫn hiện), bán kính 3km/20km, khung giờ, học thử, giảm giá, đối tác, quận, tag, giá đều ra đúng.
- Sửa lỗi cũ: `initIndexSettings` ghi đè danh sách sắp xếp của `MeilisearchConfig` (mất `dateStart`); giờ chỉ còn một nơi khai báo. Filter cũ nối thẳng chuỗi (category) nay được bọc dấu nháy.
- Giới hạn: Meilisearch chỉ nhận một điểm `_geo`/khóa nên "gần tôi" khớp theo cơ sở mặc định; `distanceKm` tính theo cơ sở gần nhất.
- `ageFor=<learnerId>` chưa làm ở backend: FE biết tuổi bé nên gửi `ageFrom/ageTo` (bé chỉ có năm sinh thì khoảng 2 tuổi). Làm cùng 04.1.

### 26/10/2026 – 03.2c/03.2d loại đối tác và dọn bảng
- V24 đổi tên thành `*_old`: contracts, sale_activities, activitybonuses, spms, user_specs, user_spec_links, item_specs, item_spec_links, user_reviews, migrations, password_resets (xoá hẳn sau 1–2 tháng chạy ổn). Xoá 9 entity + repository không còn dùng.
- V25 `users.partner_type` (school/center/club/tutor/expert, `PartnerTypes`); trang Thành viên có ô "Loại đối tác".
- Không thêm cột `audience`: khóa người lớn dùng khoảng tuổi (`ages_min` ≥ 18) hoặc để trống = mọi lứa tuổi.

### 26/10/2026 – 03.2b địa điểm / chi nhánh
- Cách cũ: cơ sở (`user_locations`) chỉ do portal tạo, v2 chỉ có ô chọn; mã tỉnh/quận/phường bắt buộc; toạ độ là chuỗi.
- Cách mới: một đối tác nhiều cơ sở; khóa học có **địa điểm mặc định** (`items.user_location_id`) (hình thức đã có ở `items.subtype`, không thêm cột mới);
  mỗi lịch học để trống thì dùng mặc định, chỉ chọn riêng khi khác. Thêm cơ sở ngay trong trang khóa học ("+ Thêm cơ sở") hoặc ở trang "Địa điểm".
- Nhập: gõ địa chỉ → gợi ý Google Places (New) → chọn → tự điền địa chỉ, toạ độ, tỉnh/quận/phường (khớp mã bằng tên, bỏ qua chữ "Quận/Phường…").
  Không có key thì nhập tay địa chỉ + toạ độ. Toạ độ ngoài Việt Nam bị chặn (hay gặp nhập ngược vĩ/kinh độ).
- V23: `lat`/`lng` số thực (chép từ chuỗi cũ), `place_id`, `phone`, tên tỉnh/quận/phường; các mã thành tuỳ chọn. Trang "Hôm nay" đọc toạ độ mới.
- Chưa thử với Google thật (sandbox không có key): đã test bộ đọc kết quả Google bằng dữ liệu mẫu và client bằng server giả.
  Việc của chủ sản phẩm: bật Places API (New) cho key, đặt `GOOGLE_MAPS_API_KEY` ở server (hạn chế key theo IP server).

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

### 26/10/2026 – 04.1 + 04.2 (trang search)
- Backend: `GET /api/search/options?province=` (quận + tag có id), `GET /api/user/home-point` (địa chỉ nhà đã lưu, dùng khi trình duyệt từ chối vị trí), kết quả search có thêm `hasFreeTrial`, `onSale`, `timeSlots`, `pricePerSession`.
- FE: `AdvancedFilters` trong URL (`for`, `ageFrom/ageTo`, `district`, `near=lat,lng` làm tròn ~100 m, `slot`, `partnerType`, `freeTrial`, `onSale`, `priceMax`, `startWithin`, `tag`), `QuickChips`, `LearnerChips`, `useNearMe`; panel lọc trên mobile không tự đóng, có nút "Xem kết quả"; bỏ select học phí cũ (link cũ `price=` vẫn chạy).
- Gần tôi: vị trí trình duyệt → địa chỉ đã lưu → nhắc chọn quận.

### 26/10/2026 – chốt giao diện chip lọc (mockup đã duyệt)
- Mobile: A + D + hai chip có menu: nút `Lọc (n)`, chip có icon và ✕ khi bật, `Khung giờ ▾`, `Giá ▾`; `Lọc` mở bottom sheet, nút cuối `Xem N khóa học` (N là tổng kết quả hiện tại vì bộ lọc áp ngay lên URL). Desktop: B, thanh chip ngang + popover thả xuống (`Khung giờ`, `Giá`, `Quận`), bỏ cột lọc bên trái, `Lọc` mở ngăn kéo bên phải, kết quả 3 cột.
- Code: `components/search/{FilterBar,ChipMenu}.tsx`, `FilterDrawer` trong `SearchFilters.tsx`, nhãn chip ở `lib/search/chipLabels.ts`. Bỏ chip "Cuối tuần" và "Tối trong tuần" riêng, gộp vào menu Khung giờ.
- Trang chủ: chốt 6 khối theo mockup (chip bé + tìm kiếm + chip nhanh, Dành cho Bin, Đang hot gần bạn, Bộ sưu tập, Chuyên gia nổi bật, Thử điều mới).

### 26/10/2026 – 04.3 trang chủ gọn
- Bỏ khỏi trang chủ: 4 ô lợi ích, chọn nhanh nhóm học, khóa nổi bật chung, ưu đãi phụ huynh. Thêm `components/home/*` (`HomeLearnerRow`, `HomeQuickChips`, `HomePersonalRows`, `FeaturedPartners`), logic thuần `lib/home/blocks.ts` (có test).
- Tài khoản: chip `Tất cả | Bin | Tôi` chọn bé cho cả trang chủ lẫn trang search (cùng `anylearn.activeLearner`); chưa chọn thì lấy bé đầu tiên. Khách: dải gợi ý cũ, khối đầu theo độ tuổi khách khai. Chip "Gần tôi" ở trang chủ mở `/search?locate=1` và tự xin vị trí.
- "Đang hot gần bạn" chỉ hiện khi tài khoản có địa chỉ nhà đã lưu (`/user/home-point`), không xin vị trí ngay ở trang chủ để khỏi hỏi quyền khi vừa vào.

### 26/10/2026 – 04.4 bộ sưu tập
- V28 `collections`, `collection_items`; admin tạo/sửa, thêm khóa bằng khung tìm + bộ lọc "Gợi ý" + checkbox, sắp xếp bằng mũi tên; public `/api/collections`, trang `/collections/[slug]`, khối "Bộ sưu tập" trên trang chủ.
- Sửa lỗi quên mở quyền công khai cho `/api/search/options` (khách chưa đăng nhập sẽ bị 401 ở danh sách quận/tag): đã thêm vào `SecurityConfig` cùng `/api/collections`.
- Tách `ImageUpload` thành component dùng chung (bài viết + bộ sưu tập).

### 26/10/2026 – hướng dẫn admin, bán kính "Gần tôi", lộ trình
- Tạo `docs/huong-dan-admin.md` (hướng dẫn cấu hình cho team admin). Quy tắc: thêm/đổi chức năng có phần cài đặt hoặc nhập dữ liệu thì cập nhật file này cùng lúc (ghi vào `CLAUDE.md`).
- Bán kính "Gần tôi" cấu hình được: trang admin "Cài đặt > Vận hành" (`/admin/settings`), key `search/near_radius_km`, mặc định 10 km (1 đến 100). FE không còn gửi `radiusKm`, server tự lấy từ cấu hình. Trang này cũng sửa được các mốc nhắc/tự hủy đơn chờ thanh toán (trước đây chỉ sửa được trong DB) và có nút cập nhật chỉ mục tìm kiếm.
- Chốt: lộ trình do admin tạo, tách khỏi bộ sưu tập (chuỗi có thứ tự + tiến độ theo bé). Plan 08.1 đổi thành `pathways` + `pathway_steps`, tiến độ suy từ đơn/lớp đã học.

### 26/10/2026 – 04.5 trang đối tác, theo dõi, thử điều mới
- V29 `follows`, `follow_announcements`. Theo dõi đối tác; admin bật khóa mới (tắt→bật, hoặc Duyệt) thì báo một lần cho người theo dõi (in-app + push). Trang công khai `/partner/[id]`; mọi link tới tác giả (thẻ khóa, kết quả, PDP, đối tác nổi bật) giờ vào trang này.
- `/api/discover` + `/discover`: ngẫu nhiên theo ngày và bé (200 khóa phổ biến khớp tuổi/khu vực, xáo bằng seed), nút ở trang chủ.
- Chưa thử với Meilisearch thật (sandbox không tải được): `searchIds` và danh sách discover chỉ kiểm tra tới chỗ trả rỗng; xáo và phân trang có test.
- Task 04 xong (04.6 so sánh khóa học thuộc giai đoạn 4).

### 26/10/2026 – danh sách trường / chuyên gia thiếu người
- Nguyên nhân: chỉ mục `users` cũ ghi nguyên giá trị `is_signed` (99) nhưng bộ lọc tìm kiếm đòi `isSigned = 1`, nên gần như không ai hiện. Code đã đổi sang ghi 1 khi hợp đồng "đã duyệt" (99) từ V27, nhưng nút/endpoint `POST /admin/reindex` chỉ dựng lại chỉ mục khóa học nên chỉ mục người dùng vẫn cũ (chỉ cập nhật lúc 5 giờ sáng hoặc khi sửa từng người). Nay `POST /admin/reindex` (nút "Cập nhật chỉ mục ngay") dựng cả chỉ mục người dùng.

### 26/10/2026 – "Thử điều mới" dùng vị trí để sắp xếp
- Vị trí không còn là bộ lọc (bán kính) của `/api/discover`: chỉ sắp gần nhà trước (sort `_geoPoint`), rồi xáo trong từng nhóm 24 khóa theo seed ngày + bé. Khóa không có tọa độ (online) xếp cuối. Chưa thử với Meilisearch thật.

### 26/10/2026 – plan 09 (review)
- Giữ nguyên nơi lưu điểm (`item_user_actions`), thêm bảng chi tiết V30 thay vì chuyển sang bảng `item_reviews` cũ (rỗng, mọi truy vấn điểm/độ phổ biến đang đọc `item_user_actions`).
- Đối tác trả lời trực tiếp trên trang khóa học khi đăng nhập bằng tài khoản sở hữu khóa (chưa cần trang admin cho đối tác). Thông báo cho người viết.
- Chưa làm: 09.5 nhắc viết review, 09.6 thưởng điểm, báo cáo review, lọc theo tuổi bé.

### 26/10/2026 – 09.5 nhắc review và 09.6 thưởng anyPoint
- V31: `review_rewards` (đã thưởng gì cho review nào, thu hồi lúc nào) và `review_reminders` (duy nhất theo người + khóa + mốc).
- Thưởng: `ReviewRewardService`, ghi `transactions` loại `review_reward` / `review_reward_revoke` + cộng/trừ `wallet_c`. Mỗi review thưởng một lần; sửa review chỉ thêm phần còn thiếu (ví dụ thêm ảnh). Ẩn hoặc xóa review thì thu hồi (không để số dư âm); hiện lại không thưởng lại.
- Số anyPoint chỉnh ở Cài đặt > Vận hành (`review/points_text`, `review/points_media`, `review/remind_enabled`). Mặc định 20/20 là do mình chọn, chưa hỏi chủ sản phẩm.
- Nhắc: `ReviewReminderService` (mỗi giờ) gửi thông báo `review_reminder` cho người mua đơn đã giao chưa review; khóa không có ngày kết thúc coi là hết sau 30 ngày; bỏ qua khóa đã hết quá 14 ngày để lần chạy đầu không nhắn hàng loạt đơn cũ.
- FE: form review có dòng "+X anyPoint", sau khi gửi hiện "Bạn vừa nhận +X anyPoint", lịch sử anyPoint có nhãn mới, `/info/anypoint` thêm cách nhận "Viết đánh giá khóa học".
- Thử bằng backend thật + MariaDB: nhận xét ngắn 0, đủ 50 ký tự +20, sửa lại 0, thêm ảnh +20, ẩn thu hồi 40, lưu lại sau khi ẩn 0. Job nhắc: xem dòng dưới.
- Chưa làm: báo cáo review, lọc theo tuổi bé, tách review theo từng bé.

### 26/10/2026 – kiểm duyệt review, menu admin
- Ẩn review bắt buộc nhập lý do (V32), báo cho người viết; review bị ẩn hiện mờ kèm lý do ở trang khóa; người viết sửa thì admin nhận thông báo, admin bật lại bằng tay. Ẩn không thu hồi anyPoint, chỉ xóa mới thu hồi (đổi so với bản đầu).
- Sửa lỗi: phụ huynh mua cho con không thấy nút review (đơn đứng tên cha mẹ, chi tiết đơn đứng tên con) và số dư anyPoint hiển thị cũ sau khi nhận thưởng; kiểm toán anyPoint tính thêm 2 loại giao dịch review.
- Admin: Tags, Thiếu thuộc tính chuyển thành nút ở đầu trang Khóa học (trang trượt + nút Quay lại), thêm trang "Tất cả đánh giá"; số đỏ trên menu Đơn hàng, anyPoints, Hoạt động, Nghỉ/đổi lịch, Nhờ tìm khóa học, Báo giá rẻ hơn (`/admin/badges`).
- Giả định mình chọn, cần chủ sản phẩm xác nhận: số đỏ "Đơn hàng" = đơn `pay_pending`; "anyPoints" = nạp/rút chờ duyệt; "Hoạt động" = đăng ký chưa duyệt.

### 26/10/2026 – duyệt / từ chối hoạt động
- Trang Hoạt động có thêm nút Từ chối; cả hai nút mở hộp nhập nội dung gửi khách (từ chối bắt buộc lý do). Thông báo `activity_result` gửi cho người đăng ký, nếu là bé thì gửi phụ huynh. V33 thêm `admin_note`, `handled_at`. Sửa lỗi hộp "Ẩn đánh giá": bộ đếm ký tự đè lên nút.

### 26/10/2026 – quy tắc hiện khóa học
- Khóa chỉ hiện cho khách khi khóa bật (status và user_status) VÀ đối tác hoạt động VÀ đã Ký HĐ (is_signed 99): một quy tắc `ItemVisibility` áp cho tìm kiếm (trường `authorLive` trong Meilisearch), trang chủ, danh mục, bộ sưu tập, trang đối tác, khóa liên quan, thông báo khóa mới và trang chi tiết khóa (admin, đối tác và người đã mua vẫn mở được).
- Rủi ro khi triển khai: đối tác chưa bật Ký HĐ sẽ mất toàn bộ khóa trên site; cần rà công tắc Ký HĐ trước. Chưa thử với Meilisearch thật (chỉ thử phần SQL và trang chi tiết).
