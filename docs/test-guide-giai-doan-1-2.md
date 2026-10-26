# Hướng dẫn test tính năng giai đoạn 1 và 2

Tích `[x]` vào ô khi thấy đúng. Chỉ test luồng chính (happy path). Thấy sai thì ghi chú ngay dưới dòng đó.

**Chuẩn bị**
- Một điện thoại (Chrome Android hoặc Safari iPhone) và một máy tính.
- 2 tài khoản thành viên: **Phụ huynh A** (có ít nhất một đơn đã giao) và **Đối tác B** (sở hữu khóa mà A đã học). Một tài khoản **admin**.
- Đã chạy **Cập nhật chỉ mục ngay** (Cài đặt > Vận hành) sau khi triển khai.
- Chưa kiểm chứng với dịch vụ thật nên cần chú ý: tìm kiếm/gợi ý (Meilisearch), ảnh đánh giá (S3), tìm địa chỉ (Google).

---

## A. Giai đoạn 1

### A1. Khách chưa đăng nhập: "Tìm cho ai?"
Mở cửa sổ ẩn danh.
- [ ] Vào trang chủ, sau khoảng 1,5 giây hiện hộp hỏi "Tìm cho ai?" (cho con / cho bản thân)
- [ ] Nhập tên (hoặc biệt danh) và năm sinh của bé, bấm xong
- [ ] Trang chủ có dải "Khóa học hợp với {tên} · {tuổi}"
- [ ] Vào /search, chip của bé lọc đúng tuổi
- [ ] Bấm "Để sau": hộp ẩn, 7 ngày sau mới hỏi lại
- [ ] Đăng ký tài khoản mới: bé được tạo sẵn trong tài khoản

### A2. Bắt buộc ngày sinh ở thanh toán
- [ ] Bé chỉ có năm sinh, thêm khóa vào giỏ rồi thanh toán: bị yêu cầu nhập ngày sinh đầy đủ
- [ ] Nhập đủ ngày sinh: thanh toán đi tiếp được

### A3. anyPoint
- [ ] Trang khóa học có "+X anyPoint"
- [ ] Giỏ hàng và trang đơn hàng hiện đúng số anyPoint của từng khóa
- [ ] Bước thanh toán có công tắc "Dùng anyPoint", bật thì tổng tiền giảm đúng (1 anyPoint ~ 1.000đ)
- [ ] Tài khoản > anyPoint hiện lịch sử và cách nhận/dùng
- [ ] Trang `/info/anypoint` mở được khi chưa đăng nhập
- [ ] Mọi chỗ viết "anyPoint", không có chữ "điểm"

### A4. Đơn chờ thanh toán
- [ ] Tạo đơn chuyển khoản nhưng chưa trả: thẻ "Đơn đang chờ thanh toán" hiện ở /today và Tài khoản; có số đỏ ở tab Tài khoản
- [ ] Đặt lại đúng khóa và đúng bé: hiện hộp hỏi đơn trùng
- [ ] Tài khoản > Đơn hàng có 3 tab: Đang chờ / Hoàn thành / Đã hủy
- [ ] Sau mốc nhắc (mặc định 2 giờ) nhận thông báo "Đơn hàng đang chờ thanh toán" (hoặc hạ mốc nhắc ở Cài đặt > Vận hành xuống 1 giờ để thử)
- [ ] Đơn quá hạn tự hủy (thử bằng cách đặt "Hủy đơn sau" nhỏ), anyPoint đã dùng được hoàn lại
- [ ] Chuyển khoản trả đơn: trang đơn tự chuyển sang thành công

### A5. Chuyển khoản QR
- [ ] Trang đơn hiện mã QR và nội dung dạng `ALQR{mã đơn}`
- [ ] Chuyển đúng số tiền: đơn tự được duyệt, người mua nhận thông báo

### A6. Lời hứa và báo giá rẻ hơn
- [ ] Trang khóa học có khối lời hứa anyLEARN dưới nút đăng ký; bấm xem chi tiết mở `/info/why-anylearn`
- [ ] Bấm "Thấy giá rẻ hơn ở nơi khác?", điền và gửi (khách chưa đăng nhập phải để số điện thoại)
- [ ] Admin nhận thông báo; trang admin "Báo giá rẻ hơn" có dòng mới; đổi sang "đã chỉnh giá" thì người báo có tài khoản nhận lời cảm ơn

### A7. Tìm giúp tôi và xu hướng
- [ ] Tìm từ khóa không có kết quả: hiện form "Nhờ anyLEARN tìm giúp"; gửi được
- [ ] Admin: trang "Nhờ tìm khóa học" có yêu cầu; chọn "đã có khóa phù hợp" + mã khóa thì người gửi có tài khoản nhận thông báo kèm link
- [ ] Trang "Xu hướng nhu cầu" hiện từ khóa tìm nhiều và từ khóa không ra kết quả; xuất CSV được

### A8. Cài app và thông báo đẩy
- [ ] Android: hiện thẻ mời cài app (từ lần vào /today thứ 2 hoặc sau khi thanh toán xong), cài được, mở như app
- [ ] iPhone: có hướng dẫn "Thêm vào màn hình chính"
- [ ] Tài khoản > Thông báo: bật thông báo, điện thoại hỏi quyền
- [ ] Admin gửi thông báo thử (hoặc có đơn mới): điện thoại nhận thông báo đẩy, bấm vào mở đúng trang
- [ ] Tắt mạng rồi mở app: hiện trang offline, không trắng
- [ ] Sau khi cập nhật phiên bản: hiện banner "Tải lại"

### A9. Đăng nhập hết hạn
- [ ] Đăng nhập trên máy, đổi `JWT` hoặc xóa phiên ở máy khác rồi thao tác: được đưa về trang đăng nhập kèm báo hết hạn, sau đó quay lại đúng trang

---

## B. Giai đoạn 2

### B1. Dữ liệu nền (admin)
- [ ] **Tags**: bấm nút Tags ở đầu trang Khóa học (mở trang mới, có nút Quay lại) có nhóm; đổi nhóm cho vài tag "Chưa phân loại"; gõ tag mới ở khóa học thì được tạo; gộp hai tag
- [ ] **Loại đối tác**: ở Thành viên > chọn một đối tác, đặt loại (trường / trung tâm / CLB / gia sư / chuyên gia / app)
- [ ] **Ký HĐ**: công tắc "Ký HĐ" bật thì đối tác hiện ở danh sách đối tác của khách (sau khi cập nhật chỉ mục)
- [ ] **Địa chỉ đối tác**: Thành viên > đối tác > Cơ sở / Địa chỉ > Thêm địa chỉ; "Tìm tự động" ra gợi ý, lưu được, đặt hội sở được
- [ ] Nút "Nhập địa chỉ từ hợp đồng": chạy thử vài đối tác, xem kết quả Đã lưu / Cần xem lại / Không tìm thấy; "Hoàn tác" hoạt động
- [ ] **Khóa học**: lưu khóa offline mà đối tác chưa có địa chỉ thì bị chặn kèm nhắc; có một địa chỉ thì tự gán; nhiều địa chỉ thì phải chọn
- [ ] Khóa online hoặc đối tác loại "app" lưu được không cần địa chỉ
- [ ] Nút "Thiếu thuộc tính" ở đầu trang Khóa học mở trang liệt kê khóa thiếu dữ liệu; điền xong thì khóa biến mất khỏi danh sách

### B2. Tìm kiếm và bộ lọc (khách)
- [ ] /search có chip chọn người học (Tất cả / con / Tôi); chọn bé thì kết quả theo tuổi bé; lựa chọn được nhớ lần sau
- [ ] Chip nhanh: Gần tôi, Cuối tuần, Tối trong tuần, Học thử, Giảm giá, Online; bấm từng chip kết quả đổi và địa chỉ trang (URL) đổi theo
- [ ] "Gần tôi": trình duyệt hỏi vị trí, kết quả có khoảng cách trên thẻ
- [ ] Bộ lọc đầy đủ: quận, khung giờ, loại đối tác, giá tối đa (thanh trượt), khai giảng, tag; áp dụng và xóa được
- [ ] Gửi link kết quả đã lọc cho người khác: mở ra đúng bộ lọc
- [ ] Thẻ khóa hiện khoảng cách, giờ học, nhãn Học thử / Giảm giá

### B3. Trang chủ
- [ ] Trang chủ gọn: ô tìm kiếm + chip bé + chip nhanh, "Dành cho {bé}", "Đang hot gần bạn", đối tác nổi bật, bộ sưu tập, khung nhờ tìm giúp, bài viết
- [ ] Các thẻ khóa trong hàng cao bằng nhau
- [ ] Khối "Đang hot gần bạn" chỉ hiện khi có địa chỉ đã lưu; hàng "Dành cho {bé}" đổi khi đổi chip bé
- [ ] Chip "Gần tôi" ở trang chủ mở /search và tự xin vị trí

### B4. Bộ sưu tập
- [ ] Admin > Bộ sưu tập > Thêm: nhập tên, mô tả, ảnh bìa, khoảng ngày (nếu theo mùa)
- [ ] Bấm "Gợi ý theo bộ lọc": ra danh sách, tick chọn khóa; tìm tay bằng ô tìm kiếm và tick thêm
- [ ] Sắp xếp thứ tự bằng mũi tên, lưu
- [ ] Trang chủ hiện hàng bộ sưu tập; bấm vào mở `/collections/{slug}` đúng khóa, đúng thứ tự
- [ ] Tắt một khóa trong bộ sưu tập: khóa biến mất khỏi trang
- [ ] Bộ sưu tập ngoài khoảng ngày hoặc đang tắt không hiện cho khách

### B5. Trang đối tác, theo dõi, thử điều mới
- [ ] Bấm tên đối tác ở khóa học: mở `/partner/{id}` có giới thiệu, khóa đang mở, cơ sở, số người theo dõi
- [ ] Bấm "Theo dõi" (cần đăng nhập): số theo dõi tăng; bấm lại để bỏ theo dõi
- [ ] Admin cho một khóa của đối tác đó lên sóng: người theo dõi nhận thông báo "khóa mới" một lần duy nhất, bấm vào mở đúng khóa
- [ ] Khung "Thử điều mới cho con" ở trang chủ: có giải thích ngắn và nút bấm; bấm vào mở `/discover`
- [ ] /discover: danh sách khóa hợp tuổi bé, khóa gần nhà xếp trước, vị trí không loại khóa xa; hôm nay và ngày mai thứ tự khác nhau; xem thêm được

### B6. Đánh giá
- [ ] Phụ huynh A mở khóa đã học: thấy form "Viết đánh giá" kèm dòng "+X anyPoint"
- [ ] Người chưa mua khóa không thấy form (hoặc bị từ chối khi gửi)
- [ ] Chọn sao, chấm vài tiêu chí, bấm cụm gợi ý, viết từ 50 ký tự, thêm ảnh (nếu đã cấu hình kho ảnh), gửi
- [ ] Hiện "Bạn vừa nhận +X anyPoint"; Tài khoản > anyPoint có dòng "Thưởng viết đánh giá"
- [ ] Sửa lại đánh giá: không nhận thêm anyPoint
- [ ] Đánh giá hiện nhãn "Đã học tại anyLEARN"
- [ ] Phần tóm tắt: điểm trung bình, thanh phân bố "5 ★ … 1 ★" không xuống dòng, điểm từng tiêu chí, ảnh từ phụ huynh
- [ ] Lọc theo sao và "Có ảnh" hoạt động
- [ ] Đối tác B đăng nhập, mở khóa của mình: có nút Trả lời dưới đánh giá; gửi, sửa, xóa được; B không ẩn hay xóa được đánh giá
- [ ] A nhận thông báo "{Đối tác} đã trả lời đánh giá của bạn"
- [ ] Admin: Khóa học > nút "Xem tất cả đánh giá" > tắt công tắc "Hiện" của đánh giá đó: hiện hộp bắt buộc nhập lý do; nhập lý do rồi bấm "Ẩn đánh giá"
- [ ] Đánh giá biến khỏi trang khóa và điểm trung bình đổi; anyPoint **không** bị thu hồi
- [ ] Phụ huynh A nhận thông báo kèm lý do; mở trang khóa thấy đánh giá của mình mờ, có dòng "bị ẩn với lý do: …" và nút "Chỉnh sửa đánh giá"
- [ ] A sửa và gửi lại: admin nhận thông báo, dòng đánh giá có nhãn cam "Người viết đã sửa lại", nút "Xem tất cả đánh giá" có số đỏ
- [ ] Admin bật lại "Hiện": đánh giá hiện lại ở trang khóa, A nhận thông báo "đã được hiển thị"
- [ ] Admin xóa một đánh giá đã thưởng: anyPoint thưởng bị thu hồi (giao dịch `review_reward_revoke`)
- [ ] Trang đối tác có tổng hợp đánh giá của mọi khóa
- [ ] Nhắc viết đánh giá: bé đã học nửa khóa (hoặc hết khóa) mà chưa đánh giá thì nhận thông báo "Bé học thế nào rồi?" / "Khóa học đã kết thúc, bạn thấy sao?", bấm mở đúng khóa; chỉ nhận mỗi mốc một lần

### B7. Cấu hình vận hành (admin)
- [ ] Cài đặt > Vận hành: đổi bán kính "Gần tôi" (ví dụ 5 km), lưu; thử lại "Gần tôi" thấy khác
- [ ] Đổi anyPoint thưởng đánh giá, đổi mốc nhắc thanh toán, lưu; thông báo "Đã lưu cấu hình"
- [ ] Nhập giá trị sai (ví dụ 0 km hoặc 200 km) thì báo lỗi, không lưu
- [ ] Nút "Cập nhật chỉ mục ngay" chạy xong báo thành công

---

## C. Kiểm tra chung
- [ ] Menu bên trái: Đơn hàng, anyPoints, Hoạt động, Nghỉ / đổi lịch, Nhờ tìm khóa học, Báo giá rẻ hơn hiện số đỏ khi có bản ghi chưa xử lý, hết thì mất số
- [ ] Menu Khóa học không còn mục Tags và Thiếu thuộc tính; vào trang Tags hoặc Thiếu thuộc tính thì mục "Khóa học" vẫn sáng
- [ ] Mọi nút chính màu xanh đặc, nút phụ nền trắng viền, ô chọn xanh nhạt; không còn nút xanh dương
- [ ] Trang nào cũng không bị tràn ngang trên điện thoại
- [ ] Trang admin mới (Bộ sưu tập, Vận hành, Tags, Thiếu thuộc tính) có lề, không dính sát mép
- [ ] Mọi văn bản dùng "anyPoint", "~" thay "="

## Ghi chú lỗi
| Mục | Mô tả lỗi | Ảnh/ghi chú |
|---|---|---|
| | | |
