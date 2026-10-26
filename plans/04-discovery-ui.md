# 04 – Giao diện khám phá khóa học (mobile trước)

Giai đoạn 1 (04.7), giai đoạn 2 (04.1–04.5), giai đoạn 4 (04.6). Trụ cột A. Cần plan 03 xong phần API.

## Vấn đề (từ ảnh chụp mobile)

- Trang chủ rất dài, nhiều khối giống nhau, không cá nhân hoá theo tuổi con.
- Bộ lọc nằm trong panel, ít lựa chọn, khu vực chỉ có 2 thành phố.
- Không có lối vào theo "gần tôi", "cuối tuần", "học thử", "chuyên gia", "ngẫu nhiên".

## Task

### 04.1 Chip chọn người học ("Cho Bin · 15 tuổi")
- Đầu trang chủ và trang search, khi đã đăng nhập và có con: hàng chip `Tất cả | Bin 15t | Su 9t | Tôi`.
- Chọn chip → mọi danh sách lọc theo tuổi người đó (`ageFor`). Nhớ lựa chọn trong `localStorage`.
- Chưa đăng nhập: dùng người học khách khai trong 04.7 (lưu `localStorage`); nếu khách bỏ qua thì chip độ tuổi chung
  (3–5, 6–10, 11–15, 16+).

### 04.2 Chip lọc nhanh + bộ lọc đầy đủ
- Dưới ô tìm kiếm: chip cuộn ngang `Gần tôi · Cuối tuần · Tối trong tuần · Học thử miễn phí · Đang giảm giá · Online`.
- "Gần tôi": xin quyền vị trí; từ chối thì dùng địa chỉ đã lưu (`user_locations`) hoặc chọn quận.
- Panel bộ lọc: thêm quận/huyện (theo tỉnh), khung giờ, loại đối tác, thanh trượt giá, tag kỹ năng.
- Cập nhật `config/searchFilters.ts` và `lib/search/query.ts`; giữ URL query để chia sẻ link được.
- Thẻ khóa học: thêm khoảng cách, khung giờ, badge "Học thử", "+X điểm" (plan 02).

### 04.3 Trang chủ mobile gọn (≈ 6 khối)
1. Chip chọn con (04.1).
2. Ô tìm kiếm + chip nhanh (04.2).
3. "Dành cho Bin": khóa hợp tuổi, gần nhà, chưa mua (sắp theo popularity).
4. "Đang hot gần bạn" (popularity theo khu vực, đã có `PopularityRollupService`).
5. Bộ sưu tập theo mùa (04.4), dạng thẻ ngang.
6. Đối tác / chuyên gia nổi bật.
- Bỏ hoặc gộp các khối lặp; footer mobile thu gọn (plan 12).
- Đo trước/sau: tỉ lệ click từ trang chủ, độ sâu cuộn.

### 04.4 Bộ sưu tập (collections) do biên tập
- Bảng `collections (id, slug, title, subtitle, cover, season_from, season_to, sort, is_active)` và
  `collection_items (collection_id, item_id, sort)`; hoặc collection theo **bộ lọc lưu sẵn** (`filter_json`).
- Admin tạo/sửa. FE: `/collections/[slug]`.
- Ví dụ: "Chuẩn bị vào lớp 6", "Hè không màn hình", "Cuối tuần cả nhà", "Thi IELTS 6.5", "Chuyên gia nổi tiếng".

### 04.5 Trang chuyên gia / đối tác + "Ngẫu nhiên"
- Trang hồ sơ đối tác/chuyên gia đẹp hơn (`AuthorProfileCard` đã có): giới thiệu, thành tích, review (plan 09),
  các khóa đang mở, nút "Theo dõi" (nhận thông báo khi mở lớp mới, bảng `follows`).
- "Thử điều mới cho con": nút trên trang chủ mở danh sách ngẫu nhiên hợp tuổi, lọc theo khu vực (random có seed theo ngày).

### 04.7 Hỏi "Tìm cho ai?" khi chưa đăng nhập → tự tạo tài khoản con khi đăng ký
Yêu cầu của chủ sản phẩm (25/10/2026). **Làm ở giai đoạn 1**, trước cả 04.1: đây là cách sớm nhất để biết khách tìm cho ai.
Ở giai đoạn 1, "lọc theo tuổi" dùng bộ lọc độ tuổi đang có (`age` trong `config/searchFilters.ts`), chưa cần plan 03.

**Luồng**
1. Khách chưa đăng nhập vào trang chủ / search / PDP lần đầu → bottom sheet nhẹ (không chặn trang):
   "Bạn đang tìm khóa học cho ai?" `[Cho con]` `[Cho bản thân]` `[Để sau]`.
2. `Cho con` → nhập **tên hoặc biệt danh** + **năm sinh** (chọn từ danh sách năm), nút "+ Thêm bé" (tối đa 5).
   `Cho bản thân` → năm sinh tuỳ chọn. `Để sau` → không hỏi lại trong N ngày (config FE, gợi ý 7).
3. Lưu vào `localStorage`, **không gửi lên server** trước khi khách tạo tài khoản. Có nút "Xoá thông tin" trong sheet.
4. Dùng ngay khi chưa đăng nhập:
   - chip người học (04.1) hiện "Bin · 11t"; lọc tuổi tính từ năm sinh;
   - PDP "Bạn đang đăng ký cho": liệt kê các bé trong storage, khách chọn bé trước khi bấm "Thêm vào giỏ hàng";
   - mở lại sheet để sửa từ chip "Sửa".
5. Khi **đăng ký tài khoản** (sau OTP thành công): FE đọc storage → gọi `POST /user/children` cho từng bé
   (`name`, `dob`) → map `localId` → `childId` → chọn sẵn bé đó cho thao tác đang dở (thêm giỏ, checkout) → xoá storage.
   Lỗi giữa chừng: giữ lại các bé chưa tạo, thử lại lần sau, không tạo trùng.
6. Khi **đăng nhập** tài khoản có sẵn: không tự tạo. So khớp với danh sách con hiện có theo **tên không dấu** (năm sinh không
   cần khớp, vì một tài khoản không có hai bé trùng tên): khớp → dùng con đó; không khớp → hỏi "Thêm Gà (2017) vào tài khoản?"
   `[Thêm]` `[Bỏ qua]`. Thêm xong, trang đang mở (add2cart) tự tải lại danh sách bé và chọn bé đã chọn.
   Trong bảng khai, hai bé không được trùng tên.
7. Ghi `audience` (child/self) và tuổi vào `search_logs.filters` (plan 01) để biết khách chưa đăng nhập tìm cho ai.

**Dữ liệu `localStorage`** (key `anylearn.guestLearners`, có `version` để đổi cấu trúc sau này):
```ts
interface GuestLearnerStore {
  version: 1
  audience?: 'child' | 'self'   // missing until answered (or only dismissedAt after "Để sau")
  learners: { localId: string; nickname: string; birthYear: number }[]
  selfBirthYear?: number
  selectedLocalId?: string
  dismissedAt?: string   // ISO, khi khách bấm "Để sau"
}
```
Đọc/ghi trong `try/catch` (trình duyệt riêng tư có thể chặn); hỏng dữ liệu thì bỏ qua như chưa có.

**Năm sinh trước, ngày sinh đầy đủ ở checkout** (chủ sản phẩm chốt 25/10/2026):
- Lúc khai và lúc tạo tài khoản con: **chỉ cần năm sinh**. API con hiện nhận `dob` dạng `yyyy-MM-dd`
  (`UserService.saveChild`), nên gửi `yyyy-01-01` + cờ `dobYearOnly = true`; migration mới thêm cột
  `users.dob_year_only TINYINT NOT NULL DEFAULT 0`.
- **Checkout bắt buộc ngày sinh đầy đủ**: trước nút "Thanh toán", mọi người học trong giỏ có `dob` rỗng hoặc
  `dob_year_only = 1` phải nhập ngày/tháng/năm (năm điền sẵn, chỉ chọn ngày + tháng). Chưa nhập thì nút thanh toán bị khoá,
  báo rõ "Nhập ngày sinh của Bin để tiếp tục". Lưu xong → `dob_year_only = 0`.
- Áp dụng cho cả con đã có từ trước mà thiếu ngày sinh, và cho "Tôi" nếu chính chủ là người học.
- Backend kiểm tra lại khi tạo đơn (không chỉ khoá ở FE): người học thiếu ngày sinh đầy đủ → trả lỗi có mã
  `LEARNER_DOB_REQUIRED` + danh sách `learnerIds` để FE mở lại form.
- Ngày sinh nhập phải khớp năm đã khai; khác năm thì hỏi xác nhận (có thể khách khai nhầm năm lúc đầu).

**Code**
- Hook `useGuestLearners` (đọc/ghi storage) + component `GuestLearnerSheet`.
- Hàm thuần có test: `ageFromBirthYear(year, today)`, `parseGuestLearnerStore(raw)` (validate + version),
  `matchGuestToChildren(guests, children)` (so khớp tên không dấu).
- Gắn bước 5 vào chỗ xử lý sau đăng ký thành công (`components/auth/RegisterForm.tsx` / `AuthModal`), bước 6 vào sau đăng nhập.
- Checkout: component `LearnerDobForm` + hàm thuần `learnersMissingFullDob(cartLines, learners)` có test (FE) và kiểm tra
  tương ứng ở service tạo đơn (backend, có unit test).

**Tiêu chí xong**
- Khách chưa đăng nhập khai "Bin, 2015" → trang chủ/search lọc đúng tuổi, PDP chọn được Bin.
- Bấm thêm giỏ → đăng ký → tài khoản có sẵn con "Bin" (dob 2015-01-01, `dob_year_only = 1`), giỏ hàng gắn đúng Bin,
  storage đã xoá.
- Đăng nhập tài khoản đã có con "Bin" (dù khai năm sinh khác) → không tạo thêm một Bin nữa.
- Vào checkout với Bin chỉ có năm sinh → phải nhập ngày/tháng mới thanh toán được; gọi API tạo đơn thẳng (bỏ qua FE) cũng
  bị chặn với `LEARNER_DOB_REQUIRED`.

### 04.6 So sánh khóa học (giai đoạn 4)
- Chọn tối đa 3 khóa → bảng so sánh: giá, giá/buổi, số buổi, lịch, khoảng cách, đánh giá, học thử, điểm nhận.

## Tiêu chí xong (giai đoạn 2)
- Phụ huynh có 2 con chọn chip từng con và thấy danh sách khác nhau, đúng tuổi.
- Khách chưa đăng nhập khai con ở 04.7, đăng ký xong có sẵn tài khoản con và bé được chọn.
- Tìm được "bóng đá, quận 7, cuối tuần, có học thử" bằng chip/bộ lọc, link chia sẻ được.
- Trang chủ mobile ≤ 6 khối chính.
