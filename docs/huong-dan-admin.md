# Hướng dẫn cấu hình anyLEARN cho team admin

Tài liệu này giải thích các chức năng cần team admin nhập hoặc cấu hình, hệ thống dùng dữ liệu đó như thế nào, và cách cập nhật.
Mỗi khi thêm chức năng có liên quan đến cài đặt hoặc dữ liệu cần nhập, tài liệu này phải được cập nhật cùng lúc (xem mục cuối).

Cập nhật lần cuối: 26/10/2026.

## Mục lục

1. [Bức tranh chung: dữ liệu nào làm nên tìm kiếm](#1-bức-tranh-chung)
2. [Đối tác: loại đối tác, hợp đồng, địa chỉ](#2-đối-tác)
3. [Khóa học: những thông tin để khách tìm thấy](#3-khóa-học)
4. [Tags](#4-tags)
5. [Tìm kiếm của khách hoạt động thế nào](#5-tìm-kiếm-của-khách)
6. [Trang chủ cá nhân hóa](#6-trang-chủ)
7. [Bộ sưu tập](#7-bộ-sưu-tập)
7b. [Trang đối tác, theo dõi, thử điều mới](#7b-trang-đối-tác-theo-dõi-và-thử-điều-mới-cho-con)
7c. [Đánh giá của phụ huynh](#7c-đánh-giá-của-phụ-huynh)
8. [Cấu hình vận hành](#8-cấu-hình-vận-hành)
9. [Nhu cầu của khách: nhờ tìm khóa, báo giá rẻ hơn, xu hướng tìm kiếm](#9-nhu-cầu-của-khách)
10. [Thông báo cho team và thanh toán](#10-thông-báo-và-thanh-toán)
11. [Việc cần làm khi triển khai (dành cho người cài đặt)](#11-triển-khai)
12. [Gặp sự cố thì xem đâu](#12-sự-cố-thường-gặp)
13. [Cách cập nhật tài liệu này](#13-cách-cập-nhật-tài-liệu-này)

---

## 1. Bức tranh chung

Khách tìm khóa học bằng ô tìm kiếm và các chip lọc: độ tuổi của bé, gần nhà, khung giờ, học thử, giảm giá, giá, tag kỹ năng.
Mỗi bộ lọc chỉ chạy đúng khi khóa học có dữ liệu tương ứng. Khóa thiếu dữ liệu vẫn hiện nhưng không lọt vào bộ lọc đó.

| Khách muốn | Hệ thống cần biết | Nhập ở đâu |
|---|---|---|
| Khóa hợp tuổi bé | Độ tuổi nhỏ nhất / lớn nhất của khóa | Khóa học > tab Tổng quan > Độ tuổi |
| Gần nhà | Địa chỉ có tọa độ của cơ sở dạy | Thành viên > Cơ sở / Địa chỉ (hoặc tab Lịch học của khóa) |
| Cuối tuần, tối trong tuần | Giờ học của từng ca | Khóa học > Lịch học > Ca học |
| Học thử | Khóa có học thử | Khóa học > tab Lịch học > Yêu cầu & Điều kiện > Có học thử |
| Đang giảm giá | Học phí gốc lớn hơn học phí bán | Khóa học > tab Tổng quan > Học phí |
| Lọc theo loại trường, trung tâm... | Loại đối tác | Thành viên > đối tác > Loại đối tác |
| Lọc theo kỹ năng | Tags của khóa | Khóa học > tab Nội dung > Phân loại |
| Giá mỗi buổi | Chu kỳ thanh toán + lịch học | Khóa học > tab Lịch học > Thời gian & ca học |

Trang **Thiếu thuộc tính** (nút ở đầu trang Khóa học) liệt kê các khóa còn thiếu dữ liệu ở trên, kèm tên đối tác và số điện thoại để liên hệ bổ sung.
Nên xử lý trang này đều đặn: đó là cách nhanh nhất để tìm kiếm trả kết quả tốt hơn.

---

## 2. Đối tác

### 2.1 Loại đối tác

Thành viên > chọn đối tác > **Loại đối tác**: Trường học, Trung tâm, Câu lạc bộ, Gia sư, Chuyên gia, hoặc **App / bán mã code**.

- Khách lọc được theo loại. Khóa học dùng loại của đối tác sở hữu, không phải nhập lại cho từng khóa.
- **App / bán mã code**: dành cho đối tác chỉ bán mã hoặc sản phẩm online. Hệ thống không yêu cầu địa chỉ cho khóa của họ.

### 2.2 Ký hợp đồng

Công tắc **Ký HĐ** trong danh sách thành viên bật lên nghĩa là hợp đồng ở trạng thái "đã duyệt" (99). Đây là dấu để khách và team biết đối tác đã ký.
Nút này chỉ đổi trạng thái, không tạo hợp đồng.

### 2.3 Địa chỉ cơ sở

Địa chỉ nằm ở Thành viên > chọn người > **Cơ sở / Địa chỉ** > **Quản lý**. Cột "Địa chỉ" ở danh sách thành viên cho biết đã có hay chưa
(bộ lọc: Tất cả / Có địa chỉ / Chưa có địa chỉ). Đối tác có nhiều cơ sở thì một cơ sở là **hội sở** (mặc định).

**Thêm địa chỉ:** bấm **+ Thêm địa chỉ**, bấm **Tìm tự động**.
- Ô địa chỉ có chữ: tìm theo chữ đó. Để trống: tìm theo địa chỉ ghi trong hợp đồng, nếu không có thì tìm theo tên đối tác.
- Một kết quả: điền thẳng vào form. Nhiều kết quả: hiện danh sách có link bản đồ, tick cơ sở cần lưu và chọn một hội sở.
- Không có kết quả: nhập tay địa chỉ và tọa độ.
- Địa chỉ phải nằm trong Việt Nam. Tọa độ ngoài Việt Nam bị từ chối.

**Nhập hàng loạt từ hợp đồng:** trang Thành viên có nút **Nhập địa chỉ từ hợp đồng**.
- Chỉ chạy cho đối tác đã có hợp đồng ký (10) hoặc duyệt (99), có địa chỉ trong hợp đồng và chưa có địa chỉ nào.
- Ô "số lượng" cho phép chạy thử một ít trước; để trống là chạy hết. Có nút Dừng.
- Hệ thống chỉ tự lưu khi Google trả đúng một kết quả khớp số nhà và tên đường. Còn lại hiện "Cần xem lại" hoặc "Không tìm thấy", bấm "Xử lý tay" để mở popup địa chỉ.
- Mỗi dòng đã lưu có nút **Hoàn tác**. Chạy lại an toàn: đối tác đã có địa chỉ tự rời khỏi danh sách.
- Danh sách và bộ lọc đang mở trên trang Thành viên được dùng làm phạm vi chạy.

Ghi nhớ: địa chỉ phục vụ "Gần tôi" nên **cần có tọa độ**. Địa chỉ nhập tay mà không có tọa độ sẽ không lọt vào tìm theo khoảng cách.

---

## 3. Khóa học

### 3.0 Khóa nào được hiện cho khách

Một khóa chỉ hiện cho khách (tìm kiếm, trang chủ, danh mục, bộ sưu tập, trang đối tác, khóa liên quan, "Thử điều mới") khi **đủ cả bốn điều kiện**:
1. Khóa đang **Hiển thị** (cột Platform) và **Đã duyệt** (cột Đối tác duyệt).
2. Đối tác sở hữu khóa có trạng thái **hoạt động**.
3. Đối tác đã **Ký HĐ** (công tắc Ký HĐ ở trang Thành viên, tương ứng hợp đồng ở trạng thái đã duyệt).

Thiếu một điều kiện thì khóa biến khỏi mọi danh sách; mở link trực tiếp cũng báo "Trang không tồn tại". Ngoại lệ: admin, chính đối tác đó và người đã mua khóa vẫn mở được trang khóa. Bật hoặc tắt công tắc Ký HĐ, hoặc đổi trạng thái đối tác, thì các khóa của đối tác được cập nhật lại trong tìm kiếm trong vài phút (không cần bấm "Cập nhật chỉ mục ngay"). **Trước khi triển khai bản này, kiểm tra công tắc Ký HĐ của các đối tác chính, nếu không toàn bộ khóa của họ sẽ biến mất.**

### 3.1 Hình thức học và địa chỉ bắt buộc

Hình thức: Học tại trường, Học online, Mã code, Ngoại khóa, Video, Mầm non.

Khi lưu khóa học, hệ thống **bắt buộc có địa chỉ** trừ khi hình thức là Online, Mã code hoặc Video, hoặc đối tác là loại "App / bán mã code".
- Khóa **chưa có ca học**: chọn một hoặc nhiều địa chỉ ở khối "Địa chỉ học" (tab Lịch học). Đối tác chỉ có một địa chỉ thì tự áp dụng.
- Khóa **có ca học**: địa chỉ được chọn riêng cho từng ca. Tạo ca với nhiều địa chỉ được tick sẽ sinh một ca cho mỗi địa chỉ.
- Đối tác chưa có địa chỉ: có dòng cảnh báo đỏ, bấm vào để mở popup thêm địa chỉ.
- Thu hộ học phí vẫn cần địa chỉ học.

### 3.2 Tab Lịch học: thời gian và ca học

- Ngày bắt đầu / kết thúc, cờ **Liên tục**, **Chu kỳ thanh toán** (số lượng + đơn vị: buổi, ngày, tuần, tháng, năm).
- **Ca học**: mỗi ca có thứ trong tuần, giờ, địa chỉ, link Zoom nếu học online. Khung giờ "sáng/chiều/tối, trong tuần/cuối tuần" mà khách lọc được suy ra từ giờ của các ca. Ca không có giờ thì khóa không lọt vào lọc khung giờ.
- **Giá mỗi buổi** = học phí chia cho số buổi suy ra từ chu kỳ. Chu kỳ tính bằng tuần hoặc tháng cần ca học có ghi các thứ trong tuần mới tính được.

### 3.3 Học phí và giảm giá

- **Học phí bán**: giá khách trả. **Học phí gốc**: giá niêm yết. Gốc lớn hơn bán thì khóa được gắn "Giảm giá" và lọt bộ lọc "Đang giảm giá".

### 3.4 Độ tuổi

Nhập tuổi nhỏ nhất và lớn nhất. Không nhập thì hệ thống hiểu là không giới hạn: khóa luôn hiện cho mọi bé, nhưng không được gợi ý riêng cho tuổi nào (và hiện ở trang Thiếu thuộc tính).
Bé chỉ có năm sinh được tính theo hai tuổi có thể; khóa hiện nếu một trong hai tuổi nằm trong giới hạn.

### 3.5 Index tìm kiếm tự cập nhật thế nào

Sửa một khóa, lịch, hoặc tag thì khóa đó tự cập nhật trong tìm kiếm. Toàn bộ cũng chạy lại lúc 5 giờ sáng hằng ngày.
Sau khi sửa **hàng loạt** ngoài giao diện sửa từng khóa (nhập địa chỉ hàng loạt, đổi loại đối tác nhiều người, sửa trực tiếp trong cơ sở dữ liệu) hãy bấm **Cài đặt > Cấu hình vận hành > Cập nhật chỉ mục ngay** (mục 8).

---

## 4. Tags

Trang **Tags** (nút ở đầu trang Khóa học). Tag là danh mục kỹ năng/chủ đề có kiểm soát, **chỉ admin tạo**, khách và đối tác không tự thêm.

- **Nhóm**: mỗi tag thuộc một nhóm (thể thao, ngoại ngữ...). Nhóm "Chưa phân loại" là tag mới chưa được xếp, nên rà và xếp nhóm đều đặn.
- Tên tag không phân biệt hoa thường và dấu: tạo "Bóng đá" khi đã có "bong da" sẽ trả về tag cũ.
- **Gộp tag**: dùng khi hai tag là một ("Tiếng Anh", "English"). Tag bị gộp bị xóa, các khóa chuyển sang tag đích và tìm kiếm của các khóa đó tự cập nhật.
- **Ẩn** tag: khách không thấy nữa nhưng dữ liệu còn.
- Gắn tag cho khóa: Khóa học > tab Nội dung > Phân loại > Tags.
- Khách thấy các tag đang dùng (nhiều khóa nhất trước) trong bộ lọc "Kỹ năng" và gợi ý ở ô tìm kiếm.

---

## 5. Tìm kiếm của khách

### 5.1 Chip và bộ lọc

- **Chip người học**: tài khoản có bé thấy `Tất cả | tên bé | Tôi`. Chọn bé thì mọi danh sách lọc theo tuổi bé và nhớ lựa chọn cho lần sau. Cần bé có ngày sinh (bé chỉ có năm sinh vẫn được).
- **Thanh chip nhanh**: Lọc (số bộ lọc đang bật), Gần tôi, Khung giờ, Học thử, Giảm giá, Online, Giá. Trên máy tính thêm Quận.
- Bộ lọc đầy đủ (nút Lọc): lĩnh vực, hình thức, độ tuổi, khu vực, quận, khung giờ, loại đối tác, học phí tối đa, khai giảng, kỹ năng.
- Kết quả có thẻ hiển thị khoảng cách (khi dùng Gần tôi), khung giờ, "Học thử", "Giảm giá".
- Mọi lựa chọn nằm trên địa chỉ trang web, nên khách và team gửi link tìm kiếm cho nhau được.

### 5.2 "Gần tôi" hoạt động thế nào

1. Xin vị trí của trình duyệt.
2. Khách từ chối hoặc không có vị trí: dùng địa chỉ nhà đã lưu trong tài khoản (Thành viên > Cơ sở / Địa chỉ của chính khách).
3. Vẫn không có: nhắc khách chọn quận.

Khóa hiện nếu **một trong các cơ sở** nằm trong bán kính. Bán kính do bạn đặt ở **Cấu hình vận hành > Bán kính "Gần tôi"** (mặc định 10 km, từ 1 đến 100).
Khách chỉ gửi tọa độ làm tròn khoảng 100 m, không gửi vị trí chính xác.

**Xem bản đồ:** khi đang lọc Gần tôi, cạnh số kết quả có nút **Xem bản đồ**. Bấm vào mở bản đồ với vị trí khách ở giữa, vòng tròn đúng bán kính trên, và **tên các trường** (tài khoản có vai trò *school*, đang hoạt động, đã Ký HĐ) có ít nhất một cơ sở trong vòng tròn. Bấm vào tên hiện thẻ nhỏ: ảnh, tên, giới thiệu ngắn (lấy từ phần giới thiệu của đối tác, cắt 140 ký tự) và nút **Tìm hiểu thêm** mở trang đối tác ở tab mới. Trường không hiện trên bản đồ khi cơ sở chưa có tọa độ. Bản đồ là **Google Maps**, cần khóa riêng cho trình duyệt (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`, do người phụ trách kỹ thuật cài lúc triển khai; chưa có khóa thì nút Xem bản đồ không hiện). Khi bản đồ có nhiều trường gần nhau, tên bị trùng sẽ ẩn bớt, phóng to để thấy đủ.

**Tối đa 2 khóa mỗi đối tác:** trong kết quả tìm kiếm khóa học, mỗi đối tác chỉ hiện tối đa 2 khóa (khóa xếp trên cùng theo cách sắp xếp đang chọn), để đối tác lớn không chiếm hết trang. Xem hết khóa của một đối tác ở trang đối tác. Con số này đặt bằng cấu hình `app.search.max-per-partner` của máy chủ (mặc định 2, đặt 0 để tắt). Số kết quả được tính sau khi giới hạn, và chỉ xét 300 kết quả đầu của lượt tìm.

### 5.3 Sắp xếp

Phổ biến nhất (mặc định), mới nhất, giá thấp/cao, khai giảng sớm nhất, giá mỗi buổi thấp nhất, và Gần nhất (chỉ khi dùng Gần tôi).
"Phổ biến" dựa trên điểm phổ biến hệ thống tự tính hằng ngày, cộng **Điểm ưu tiên** ở tab Tổng quan của khóa (dùng để đẩy khóa lên).

---

## 6. Trang chủ

Trang chủ có các khối: tìm kiếm + chip, **Dành cho {tên bé}**, **Đang hot gần bạn**, **Bộ sưu tập**, **Chuyên gia và đối tác nổi bật**, nhờ tìm giúp, bài viết.

- **Dành cho {bé}**: khóa phổ biến nhất hợp tuổi bé đang chọn. Khách chưa đăng nhập: dùng độ tuổi khách đã khai; chưa khai thì hiện "Khóa học được quan tâm nhiều".
- **Đang hot gần bạn**: chỉ hiện với tài khoản có **địa chỉ nhà đã lưu có tọa độ** (dùng bán kính "Gần tôi").
- **Bộ sưu tập**: xem mục 7. Không có bộ nào đang bật thì khối ẩn.
- **Chuyên gia và đối tác nổi bật**: tự động lấy 4 trường và 4 giáo viên được tìm nhiều nhất trong số đối tác **đã ký hợp đồng** (công tắc Ký HĐ bật, mục 2.2), bấm vào mở trang đối tác (mục 7b). Muốn đưa ai lên cao hơn thì tăng điểm ưu tiên của họ.
- Khối **Thử điều mới cho con** là một thẻ nổi bật giải thích ngắn: chọn theo tuổi bé, ưu tiên gần nhà (cần địa chỉ nhà trong tài khoản), mỗi ngày một danh sách mới. Bấm "Khám phá hôm nay" để mở danh sách (mục 7b).
- Khối nào không có dữ liệu thì tự ẩn, không để lại chỗ trống.

---

## 7. Bộ sưu tập

Trang **Khóa học > Bộ sưu tập**: danh sách khóa do biên tập chọn, ví dụ "Chuẩn bị vào lớp 6", "Hè không màn hình", "Cuối tuần cả nhà".

**Tạo bộ sưu tập**
1. Bấm **Tạo bộ sưu tập**. Nhập tên, mô tả ngắn, ảnh bìa. Đường dẫn tự tạo từ tên (có thể sửa; chỉ gồm chữ thường không dấu, số, dấu gạch ngang).
2. **Hiển thị từ ngày - đến ngày**: để trống là luôn hiện. Đặt khoảng ngày cho bộ theo mùa. Đây là ngày cụ thể, nên bộ mùa hè năm sau cần sửa lại ngày.
3. **Thứ tự**: số nhỏ hiện trước trên trang chủ.
4. Thêm khóa học, có hai cách dùng chung một danh sách kết quả có checkbox:
   - **Tìm**: gõ từ khóa rồi bấm Tìm.
   - **Gợi ý theo bộ lọc**: mở khối bộ lọc (độ tuổi, khu vực, hình thức, loại đối tác, kỹ năng, khung giờ, học phí tối đa, có học thử, đang giảm giá) rồi bấm Gợi ý. Có thể kết hợp từ khóa và bộ lọc.
   - Tick các khóa cần thêm, bấm **Thêm N khóa đã chọn**. Khóa đã có trong bộ hiện nhãn "Đã thêm" và không tick được. Có nút chọn tất cả trang đang xem.
5. Sắp xếp thứ tự khóa bằng mũi tên, bỏ khóa bằng nút ✕. Bấm **Lưu**.

**Lưu ý**
- Khóa đang tắt hoặc đối tác đang bị khóa tự biến khỏi bộ sưu tập, không cần gỡ tay.
- Bộ không còn khóa nào đang mở thì không hiện cho khách dù đang bật.
- Danh sách chỉ lưu những khóa tồn tại.
- Đường dẫn của khách là `/collections/{đường-dẫn}`.

---

## 7b. Trang đối tác, "Theo dõi" và "Thử điều mới cho con"

**Trang đối tác** (`/partner/{mã}`): khách bấm tên trường hoặc chuyên gia ở thẻ khóa học, kết quả tìm kiếm, trang chi tiết khóa hoặc khối "Chuyên gia và đối tác nổi bật" sẽ vào trang này.
Trang hiển thị: ảnh đại diện, ảnh bìa, tên, chức danh, loại đối tác, số khóa đang mở, số người theo dõi, phần giới thiệu, các khóa đang mở và các cơ sở kèm link bản đồ.

Dữ liệu nhập ở **Thành viên > chọn đối tác**:
- Ảnh đại diện, ảnh bìa, tên, **Chức danh**, **Giới thiệu ngắn**, **Giới thiệu đầy đủ** (nội dung có định dạng), **Loại đối tác**.
- Cơ sở: mục "Cơ sở / Địa chỉ" (mục 2.3). Chỉ cơ sở đang hiện mới được công bố.
- Phần "Khóa đang mở" tự lấy các khóa đang bật của đối tác, phổ biến trước.
- Đối tác thiếu ảnh hoặc giới thiệu thì trang vẫn hiện nhưng trống và kém hấp dẫn: nên bổ sung cho các đối tác chính.

**Theo dõi:** thành viên đã đăng nhập bấm **Theo dõi**. Khi admin bật một khóa mới của đối tác đó (đổi khóa từ tắt sang bật, hoặc bấm Duyệt), người theo dõi nhận thông báo trong app và trên điện thoại: "{Đối tác} vừa mở khóa mới".
- Mỗi khóa chỉ báo **một lần**, kể cả khi tắt rồi bật lại.
- Khóa đang bật sẵn từ trước không báo. Chỉ khóa chuyển từ tắt sang bật mới báo.
- Tạo khóa mới ở trạng thái tắt, soạn xong mới bật: người theo dõi chỉ nhận thông báo lúc bật.

**Thử điều mới cho con** (`/discover`, thẻ ở cuối các khối cá nhân của trang chủ): danh sách khóa hợp tuổi bé đang chọn, ưu tiên khóa gần nhà (nếu tài khoản có địa chỉ nhà), sắp theo thứ tự ngẫu nhiên.
- Vị trí chỉ dùng để **xếp thứ tự**, không loại khóa nào: khóa xa vẫn xuất hiện, chỉ ở các trang sau. Bán kính "Gần tôi" không áp dụng cho danh sách này.
- Cùng một bé xem trong cùng một ngày sẽ thấy cùng một danh sách; qua ngày đổi danh sách mới. Bé khác nhau có danh sách khác nhau.
- Danh sách lấy từ 200 khóa khớp tuổi (gần nhà trước, nếu không có vị trí thì phổ biến trước), chia thành từng nhóm 24 khóa theo thứ tự đó, rồi xáo ngẫu nhiên trong từng nhóm. Nên 24 khóa đầu luôn là các khóa gần nhà, nhưng thứ tự mỗi ngày một khác. Không có thao tác cấu hình riêng.
- Muốn khóa xuất hiện: nhập độ tuổi đúng và bật khóa. Cơ sở có tọa độ giúp khóa được xếp lên theo khoảng cách; khóa online hoặc không có tọa độ xếp sau cùng.

---

## 7c. Đánh giá của phụ huynh

**Ai đánh giá được:** chỉ tài khoản đã có đơn **đã giao** (đã thanh toán và kích hoạt) của khóa đó. Mỗi đánh giá hiện nhãn **"Đã học tại anyLEARN"**. Mỗi người một đánh giá cho mỗi khóa và có thể sửa lại. Đánh giá do admin thêm tay (tab Đánh giá của khóa) không có nhãn này.

**Phụ huynh nhập gì:** số sao (bắt buộc), điểm 1 đến 5 cho từng tiêu chí (Giáo viên, Cơ sở vật chất, Tiến bộ của con, Đúng giá trị; không bắt buộc), nội dung (có các cụm gợi ý bấm để thêm nhanh) và tối đa 4 ảnh.
Trang khóa học hiện: điểm trung bình, số đánh giá, tỉ lệ từng mức sao, điểm trung bình từng tiêu chí, ảnh từ phụ huynh; có bộ lọc "Có ảnh" và theo số sao. Trang đối tác tổng hợp đánh giá của mọi khóa của đối tác đó.

**Đối tác trả lời ngay tại trang khóa học:** đối tác đăng nhập vào trang web (tài khoản chính của họ, không phải trang admin) và mở khóa của mình, sẽ thấy nút **Trả lời** dưới mỗi đánh giá; có thể sửa hoặc xóa câu trả lời. Phụ huynh nhận thông báo "{Đối tác} đã trả lời đánh giá của bạn". Đối tác chỉ trả lời được khóa do chính họ sở hữu (admin trả lời được mọi khóa) và **không xóa hay ẩn được đánh giá**.

**Admin kiểm duyệt:** có hai nơi. Trong từng khóa: Khóa học > chọn khóa > tab **Đánh giá**. Cho mọi khóa: trang **Khóa học**, nút **Xem tất cả đánh giá** (có bộ lọc Đang hiện / Đã ẩn / Đã ẩn và người viết đã sửa lại, và ô tìm theo khóa, người viết, nội dung). Cột "Xác thực" cho biết đã học thật hay chưa. Ảnh phụ huynh gửi hiện thành ảnh nhỏ ngay dưới nội dung; bấm vào để xem lớn và lướt qua các ảnh.
- **Ẩn đánh giá:** tắt công tắc **Hiện**, hệ thống bắt buộc nhập **lý do** (ví dụ "nội dung chưa nói về khóa học"). Đánh giá biến khỏi trang khóa học, khỏi điểm trung bình của khóa và của đối tác. Người viết nhận thông báo kèm lý do; khi họ mở trang khóa, đánh giá của họ hiện **mờ**, kèm dòng "Đánh giá đang bị ẩn với lý do: …" và nút **Chỉnh sửa đánh giá**. Ẩn **không** thu hồi anyPoint.
- **Người viết sửa lại:** admin nhận thông báo "{tên} đã chỉnh sửa đánh giá bị ẩn", dòng đó có nhãn cam "Người viết đã sửa lại, chờ xem" và nút **Xem tất cả đánh giá** hiện số đỏ. Admin xem lại và bật công tắc **Hiện** để mở lên (người viết nhận thông báo "đã được hiển thị"). Chưa đạt thì để nguyên hoặc ẩn lại với lý do mới.
- **Xóa đánh giá:** xóa hẳn và **thu hồi anyPoint** đã thưởng (xem bên dưới).

**Cần cấu hình:** ảnh đánh giá được lưu trên kho ảnh của hệ thống (biến `AWS_S3_BUCKET`, `AWS_ACCESS_KEY`... mục 11). Chưa cấu hình thì phụ huynh vẫn viết đánh giá được nhưng không tải ảnh lên được.

**Nhắc viết đánh giá:** hệ thống mỗi giờ quét các đơn đã giao và gửi thông báo (trong app và push) cho người mua chưa đánh giá khóa đó, hai lần: khi bé học được **nửa khóa** và khi **khóa kết thúc**. Khóa không có ngày kết thúc được tính là kết thúc sau 30 ngày kể từ ngày bắt đầu. Mỗi mốc chỉ gửi một lần; không gửi cho khóa đã kết thúc quá 14 ngày (để lần chạy đầu không nhắn hàng loạt đơn cũ). Tắt/bật ở Cài đặt > Vận hành > Đánh giá khóa học.

**Thưởng anyPoint khi đánh giá:** đánh giá có nhận xét từ **50 ký tự** được thưởng anyPoint, có ít nhất một ảnh được thưởng thêm (số anyPoint chỉnh ở Cài đặt > Vận hành, mặc định 20 và 20; nhập 0 để tắt). Mỗi đánh giá chỉ thưởng một lần: sửa lại không nhận thêm, chỉ thêm ảnh sau đó thì nhận phần thưởng ảnh. Phụ huynh thấy dòng "+X anyPoint" ngay trong form và nhận thông báo; lịch sử anyPoint ghi "Thưởng viết đánh giá". **Admin xóa đánh giá thì anyPoint đã thưởng bị thu hồi** (ghi "Thu hồi anyPoint thưởng đánh giá"); nếu phụ huynh đã tiêu bớt thì chỉ thu phần còn lại, số dư không âm. Chỉ ẩn thì không thu hồi. Giao dịch nằm ở trang anyPoints với loại `review_reward` và `review_reward_revoke`.

**Đối tác báo cáo đánh giá:** đối tác đăng nhập, mở trang khóa của mình, bấm **Báo cáo** dưới một đánh giá và nhập lý do (ít nhất 10 ký tự, ví dụ "người này chưa từng học ở trung tâm"). Đối tác không tự ẩn hay xóa được. Admin (và các thành viên nhận thông báo) nhận thông báo "{đối tác} báo cáo một đánh giá"; số đỏ trên nút **Xem tất cả đánh giá** cộng cả đánh giá đã sửa lại và đánh giá bị báo cáo. Vào **Tất cả đánh giá**, chọn bộ lọc **Đối tác báo cáo, chờ xem**: mỗi dòng hiện lý do. Chọn **Giữ đánh giá** (báo cáo đóng, đánh giá vẫn hiện) hoặc tắt công tắc **Hiện** để ẩn kèm lý do (báo cáo tự đóng). Mỗi đối tác báo cáo một đánh giá một lần; người viết không biết ai báo cáo.

**Chưa có:** lọc đánh giá theo tuổi của bé.

---

## 8. Cấu hình vận hành

Menu **Cài đặt (bánh răng) > Vận hành > Cấu hình tìm kiếm & đơn hàng**. Thay đổi có hiệu lực ngay.

| Mục | Ý nghĩa | Mặc định |
|---|---|---|
| Bán kính "Gần tôi" (km) | Khóa có cơ sở trong bán kính này mới hiện khi khách bấm Gần tôi; cũng dùng cho khối "Đang hot gần bạn" | 10 km (từ 1 đến 100) |
| Nhắc thanh toán sau (giờ) | Các mốc nhắc đơn chưa thanh toán, cách nhau dấu phẩy. Mốc đầu: thông báo trong app và push. Từ mốc 2: thêm email | 2, 24 |
| Tự hủy đơn quá hạn | Bật/tắt việc tự hủy đơn chưa thanh toán | Bật |
| Hủy đơn sau (giờ) | Đơn chưa thanh toán bị hủy sau thời gian này kể từ lúc đặt. Điểm anyPoint đã dùng được hoàn lại | 72 giờ |
| Thưởng khi viết đánh giá (anyPoint) | Cho đánh giá có nhận xét từ 50 ký tự, mỗi đánh giá một lần. 0 = tắt | 20 |
| Thưởng thêm khi có ảnh (anyPoint) | Cộng thêm khi đánh giá có ít nhất một ảnh. 0 = tắt | 20 |
| Nhắc phụ huynh viết đánh giá | Nhắc khi học nửa khóa và khi hết khóa (mục 7c) | Bật |
| Vòng đời học viên | Xem bảng riêng bên dưới | |
| Cập nhật chỉ mục ngay | Chạy lại toàn bộ chỉ mục tìm kiếm, gồm cả khóa học và danh sách trường / chuyên gia (mất vài phút) | |

### Vòng đời học viên: nhắc lịch, gia hạn, hậu mãi

Cùng trang cài đặt, thẻ **Vòng đời học viên**. Mọi tin gửi **cả trong app (kèm push) và email**, tôn trọng công tắc thông báo của từng người (Tài khoản > Thông báo). Email sửa nội dung ở **Cài đặt Emails** (4 mẫu mới: "Sắp khai giảng", "Bé vắng học liên tiếp", "Khảo sát giữa khóa", "Gia hạn khóa học / nhắc học phí"; mẫu "Xác nhận đơn hàng" có thêm thông tin lớp).

| Mục | Ý nghĩa | Mặc định |
|---|---|---|
| Bật nhắc tự động | Tắt thì không gửi nhắc khai giảng, vắng học, khảo sát (nhắc gia hạn và học phí vẫn chạy) | Bật |
| Giờ gửi tin | Chỉ gửi trong khoảng giờ này; tin đến hạn ban đêm gửi vào sáng hôm sau | 8 đến 21 giờ |
| Nhắc trước khai giảng (ngày) | Các mốc, cách nhau dấu phẩy. Tin kèm giờ tập trung, địa điểm, link học online, đồ mang theo lấy từ lớp (Khóa học > Lịch học) | 3, 1 |
| Báo khi vắng liên tiếp (buổi) | Phụ huynh nhận tin hỏi thăm kèm cách xin nghỉ / đổi lịch; admin nhận thông báo để gọi. Chỉ áp dụng lớp có điểm danh; buổi đã duyệt nghỉ không tính là vắng; chỉ báo khi lần vắng gần nhất trong 14 ngày | 2 |
| Khảo sát giữa khóa (%) | Hỏi phụ huynh chấm 1 đến 5 sao khi bé học được tỷ lệ này của số buổi. Câu hỏi hiện đầu trang Hôm nay đến khi trả lời | 50% |
| Điểm bị coi là thấp | Từ mức này trở xuống, admin nhận thông báo kèm ghi chú của phụ huynh | 2 sao |
| Nhắc gia hạn gói khi còn (buổi) | Gói mua theo số buổi | 3 buổi |
| Nhắc gia hạn trước ngày kết thúc (ngày) | Khóa tính theo thời gian | 14 ngày |
| Nhắc học phí trước hạn (ngày) | Các mốc, cách nhau dấu phẩy. Quá hạn có một nhắc nhẹ nhàng riêng ("chưa nhận được học phí") | 7, 1 |
| Tặng anyPoint khi gia hạn sớm | Tặng khi phụ huynh bấm Gia hạn lúc gói / kỳ cũ còn hiệu lực và đơn được thanh toán; mỗi lần gia hạn một lần. 0 = tắt | 0 |

Lưu ý: nút **Gia hạn** ở trang Hôm nay thêm đúng khóa, đúng bé, đúng lớp vào giỏ rồi mở trang thanh toán; nếu lớp đã đóng đăng ký thì mở trang chọn lại. Khoản tặng hiện trong lịch sử anyPoint của khách là "Thưởng gia hạn sớm". Danh sách mẫu ZNS cần đăng ký: `docs/zns-templates.md`.

Đơn bị hủy do quá hạn mà khách vẫn chuyển khoản: tiền được ghi lại ở mục cần kiểm tra và admin nhận thông báo để xử lý, không mất tiền.
Khách có đơn của cùng khóa và cùng bé đã thanh toán ở đơn khác thì không bị nhắc.

---

## 9. Nhu cầu của khách

- **Nhờ tìm khóa học** (Quản lý thành viên > Nhờ tìm khóa học): khách điền "Nhờ anyLEARN tìm giúp" khi không thấy khóa cần. Trạng thái: mới, đang liên hệ, đã có khóa phù hợp, chưa có đối tác, đã đóng. Chọn "đã có khóa phù hợp" phải nhập mã khóa; khách có tài khoản sẽ được báo kèm link. Mỗi số điện thoại gửi tối đa 3 yêu cầu mỗi ngày.
- **Báo giá rẻ hơn**: khách báo giá thấp hơn ở nơi khác. Các trạng thái: mới, đang kiểm tra, đã xử lý (khách có tài khoản được cảm ơn), từ chối. Đây là cam kết "giá bằng hoặc rẻ hơn tại trường".
- **Xu hướng nhu cầu** (Nội dung & phân tích): từ khóa được tìm nhiều, từ khóa tìm không ra kết quả (xuất CSV để tìm đối tác mới), nhu cầu theo độ tuổi, khu vực, lĩnh vực; lĩnh vực nhiều lượt xem mà ít đơn.

Mỗi lần khách tìm (chỉ trang kết quả đầu) được ghi lại theo trình duyệt, kèm bộ lọc và số kết quả. Tìm lại cùng từ khóa trong vòng 10 giây được tính là một lần tìm đã chỉnh bộ lọc.

---

## 10. Thông báo và thanh toán

- **Người nhận thông báo admin** (Cài đặt > Thông báo): ngoài các tài khoản admin, thêm thành viên nhận thông báo đơn mới, chuyển khoản, yêu cầu của khách. Họ bật thông báo ở Tài khoản > Thông báo để nhận trên điện thoại; họ không vào được trang admin.
- **Tài khoản ngân hàng** (Cài đặt > Thanh toán): tài khoản nhận tiền hiện trong mã QR ở trang đơn hàng. Chọn ngân hàng thì mã BIN tự điền. Nội dung chuyển khoản dạng `ALQR{mã đơn}` do hệ thống tạo, không sửa.
- **Kiểm toán anyPoint**: kiểm tra số dư điểm của thành viên.
- Luôn viết **anyPoint** (không viết "điểm"); giá trị quy đổi ghi "~120.000đ".
- **Hoạt động (đăng ký học thử, test đầu vào, tham quan):** menu Quản lý thành viên > Hoạt động. Mỗi dòng chờ duyệt có hai nút **Duyệt** và **Từ chối**; bấm nút nào cũng mở hộp để nhập nội dung gửi khách qua thông báo. Duyệt: ghi thêm giờ, địa điểm, đồ cần mang (không bắt buộc). Từ chối: **bắt buộc** nhập lý do. Nếu người đăng ký là bé thì thông báo gửi cho phụ huynh. Nội dung đã gửi hiện lại dưới trạng thái của dòng đó.
- **Số đỏ trên menu:** các mục **Đơn hàng** (đơn khách đã bấm thanh toán, đang chờ), **anyPoints** (nạp/rút đang chờ duyệt), **Hoạt động** (đăng ký chưa duyệt), **Nghỉ / đổi lịch** (yêu cầu chờ xử lý), **Nhờ tìm khóa học** (mọi yêu cầu chưa ở trạng thái "Đã đóng", gồm mới, đang liên hệ, đã có khóa phù hợp, chưa có đối tác) và **Báo giá rẻ hơn** (mọi báo cáo chưa ở trạng thái cuối "Đã chỉnh giá" hoặc "Không đúng", gồm mới và đang kiểm tra) hiện số bản ghi chưa xử lý xong; số tự cập nhật mỗi phút và mỗi khi chuyển trang. Hết việc thì số biến mất.
- **anyPoint khách nhìn thấy:** trang khóa học, giỏ hàng và đơn hàng hiện "+X anyPoint" (tính bằng đúng cách tính lúc tạo đơn, chỉnh ở cấu hình hoa hồng của khóa); ở bước thanh toán khách bật "Dùng anyPoint"; trang Tài khoản > anyPoint và `/info/anypoint` giải thích cách nhận và dùng. Mỗi khóa mỗi khác nên chữ chung không ghi số cụ thể.
- **Đơn chờ thanh toán:** khách thấy thẻ "Đơn đang chờ thanh toán" ở `/today` và Tài khoản; đặt trùng khóa và bé thì được hỏi. Thời gian nhắc và tự hủy chỉnh ở mục 8. Số liệu đơn chờ, được nhắc, trả tiền sau nhắc, hết hạn nằm ở trang tổng quan.
- **Cài app và thông báo đẩy:** website cài được như app (Android hiện nút cài, iPhone có hướng dẫn thêm vào màn hình chính). Thông báo đẩy cần `VAPID_*` (mục 11); khách bật ở Tài khoản > Thông báo.
- **Khách chưa đăng nhập:** được hỏi "Tìm cho ai?" (lưu tên và năm sinh của bé trên máy), khi đăng ký thì bé được tạo trong tài khoản. Thanh toán bắt buộc có ngày sinh đầy đủ của bé.
- **Email tự động và nội dung email:** menu **Cài đặt > Cài đặt Emails** liệt kê các mẫu; chọn một mẫu để sửa, bấm **Lưu template**, rồi **Gửi thử cho tôi** (gửi bản đã lưu với dữ liệu mẫu tới email của tài khoản admin đang đăng nhập; tài khoản cần có email). **Xóa về mặc định** trả mẫu về bản gốc. Biến dạng `{{tênBiến}}` được thay bằng dữ liệu thật, danh sách biến hiện ngay trên trang. Tiêu đề email do hệ thống đặt. Tên người gửi hiện là **anyLEARN**.
  - Gửi cho khách: **Xác nhận đơn hàng** (khi đơn được duyệt thanh toán), **Nhắc thanh toán** (từ mốc nhắc thứ 2), **Đơn hàng đã hủy** (hủy tay hoặc quá hạn), **Nhắc lịch học** (8 giờ sáng ngày trước buổi học), **Chào mừng đăng ký** (khi đăng ký có điền email). Khách tắt email theo nhóm ở Tài khoản > Thông báo; xác nhận đơn và đơn hủy thì luôn gửi.
  - Gửi cho đội anyLEARN (tài khoản admin và thành viên trong "Người nhận thông báo admin", cộng các địa chỉ ở biến `ADMIN_EMAIL_RECIPIENTS`): đơn mới cần duyệt, đơn đã thanh toán, chuyển khoản lệch hoặc không khớp đơn, đăng ký và hủy đăng ký hoạt động. Mẫu **Thông báo cho đội anyLEARN** dùng chung cho đa số loại này.
  - Người nhận phải có email trong hồ sơ; không có thì hệ thống bỏ qua.
- **Lời hứa anyLEARN:** nội dung nằm ở `anylearn_v2/src/config/promise.ts` (nhờ lập trình viên sửa); trang `/info/why-anylearn`.

---

## 11. Triển khai

Dành cho người cài đặt hệ thống; team admin chỉ cần biết để nhờ khi cần.

- Backup cơ sở dữ liệu trước khi cập nhật phiên bản có thay đổi cấu trúc dữ liệu.
- Biến môi trường (xem `deployment/env/backend.env.example`):
  - `GOOGLE_MAPS_API_KEY`: bật nút Tìm tự động ở địa chỉ. Bật Places API (New) trên Google Cloud. Không có key thì chỉ nhập tay được.
  - `SEPAY_API_KEY`: webhook nhận tiền chuyển khoản.
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: thông báo đẩy trên điện thoại. Tạo một lần và không đổi.
  - `JWT_EXPIRATION_MS`: thời gian đăng nhập (mặc định 30 ngày).
  - `AWS_S3_BUCKET`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_CDN_URL`: kho ảnh (ảnh đại diện, ảnh đánh giá).
- Sau mỗi lần cập nhật phiên bản có thêm thuộc tính tìm kiếm: bấm **Cập nhật chỉ mục ngay** (mục 8) một lần.
- Các bảng cũ của portal PHP đã đổi tên thành `*_old`; xóa tay khi chắc chắn không còn dùng.

---

## 12. Sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Khóa không hiện khi lọc "Gần tôi" | Cơ sở chưa có tọa độ, hoặc xa hơn bán kính | Thêm địa chỉ bằng Tìm tự động; xem trang Thiếu thuộc tính; kiểm tra bán kính |
| Khóa không hiện khi lọc độ tuổi | Chưa nhập độ tuổi: khóa không giới hạn vẫn hiện nhưng không nổi bật cho tuổi nào; nhập sai khoảng tuổi thì bị loại | Sửa độ tuổi ở tab Tổng quan |
| Khóa không hiện khi lọc khung giờ | Ca học chưa có giờ | Nhập giờ cho ca |
| Bộ lọc tìm kiếm không đổi sau khi sửa hàng loạt | Chỉ mục chưa cập nhật | Bấm Cập nhật chỉ mục ngay |
| Không lưu được khóa, báo thiếu địa chỉ | Hình thức cần địa chỉ mà đối tác chưa có | Thêm địa chỉ cho đối tác (bấm dòng cảnh báo đỏ) hoặc đổi loại đối tác sang "App / bán mã code" nếu đúng bản chất |
| Nút Tìm tự động không có kết quả | Chưa có key Google hoặc địa chỉ quá chung chung | Nhờ người cài đặt kiểm tra key; nhập thêm số nhà và tên đường |
| Khách bị đăng xuất | Đăng nhập hết hạn (30 ngày không dùng) | Đăng nhập lại |
| Phụ huynh không nhận nhắc khai giảng / vắng / khảo sát | Đang tắt "Bật nhắc tự động", ngoài giờ gửi, người đó tắt công tắc thông báo, hoặc lớp chưa nhập lịch | Kiểm tra mục 8 (Vòng đời học viên) và lịch của lớp |
| Không có nhắc vắng học cho một lớp | Lớp không có điểm danh nào (không đo được) | Điểm danh ít nhất một buổi, hoặc bật nút "Vào lớp" cho lớp online |
| Phụ huynh không nhận anyPoint gia hạn sớm | Đặt 0, đơn chưa thanh toán, đã nhận cho lần gia hạn đó, hoặc gói cũ đã hết khi bấm Gia hạn | Kiểm tra mục 8 và lịch sử anyPoint của khách |
| Phụ huynh không viết được đánh giá | Tài khoản chưa có đơn đã giao của khóa đó | Kiểm tra đơn ở mục Đơn hàng; đơn chưa thanh toán chưa được tính |
| Không tải được ảnh đánh giá | Chưa cấu hình kho ảnh (AWS) | Nhờ người cài đặt (mục 11) |
| Đối tác không thấy nút Trả lời | Không đăng nhập bằng tài khoản sở hữu khóa | Đăng nhập đúng tài khoản đối tác, mở khóa của họ |
| Người theo dõi không nhận thông báo khóa mới | Khóa đã báo một lần, hoặc khóa đã bật sẵn từ trước | Chỉ khóa chuyển từ tắt sang bật mới báo; tạo khóa ở trạng thái tắt rồi bật khi sẵn sàng |
| "Thử điều mới" trống | Không có khóa nào khớp tuổi và khu vực | Kiểm tra độ tuổi và tọa độ cơ sở của khóa |
| Danh sách trường / chuyên gia (trang anySCHOOL, anyPROFESSOR, khối đối tác nổi bật) thiếu người | Chỉ đối tác đã bật **Ký HĐ** mới được liệt kê; hoặc danh sách chưa cập nhật sau khi bật Ký HĐ hàng loạt | Bật Ký HĐ cho đối tác (Thành viên), rồi bấm Cập nhật chỉ mục ngay |
| Bộ sưu tập không hiện trên trang chủ | Đang tắt, ngoài khoảng ngày, hoặc không còn khóa nào đang mở | Kiểm tra công tắc Hiện, khoảng ngày và danh sách khóa |

---

## 13. Cách cập nhật tài liệu này

Quy tắc: **thêm hoặc đổi chức năng có phần cài đặt, nhập dữ liệu, hoặc ảnh hưởng đến kết quả hiển thị thì cập nhật tài liệu này trong cùng lần làm.**

Mỗi chức năng viết theo cùng khung:
1. Chức năng làm gì cho khách (một hai câu).
2. Dữ liệu hệ thống cần và nhập ở đâu (đường dẫn menu, tên ô đúng như trên màn hình).
3. Hệ thống dùng dữ liệu đó thế nào (luật, ngưỡng, giá trị mặc định).
4. Cần làm gì sau khi đổi (ví dụ cập nhật chỉ mục).
5. Lỗi thường gặp: dòng mới trong mục 12.

Ghi chú cho người làm phần mềm: file này nằm ở `docs/huong-dan-admin.md`; `CLAUDE.md` ở gốc dự án ghi quy tắc cập nhật.

### Khóa chưa có địa chỉ vẫn tìm được bằng "Gần tôi"

Khóa không có địa chỉ riêng (không địa chỉ khóa, không địa chỉ ở các lớp) sẽ được tìm theo **hội sở của đối tác** (không có hội sở thì lấy địa chỉ đầu tiên có tọa độ). Địa chỉ của khóa/lớp luôn được ưu tiên. Đối tác cần có ít nhất một địa chỉ có tọa độ. Sau khi cập nhật hệ thống, bấm **Cài đặt > Vận hành > Lập lại chỉ mục** một lần. Khóa vẫn được cảnh báo "Thiếu thuộc tính" cho đến khi gắn địa chỉ riêng.
