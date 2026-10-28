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
7d. [Lộ trình và gợi ý khóa học](#7d-lộ-trình-và-gợi-ý-khóa-học)
7e. [Gợi ý khóa học bằng AI](#7e-gợi-ý-khóa-học-bằng-ai)
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

**Xem bản đồ:** khi đang lọc Gần tôi, cạnh số kết quả có nút **Xem bản đồ**. Bấm vào mở **trang bản đồ toàn màn hình** (nút ‹ để quay lại kết quả) với vị trí khách ở giữa, vòng tròn đúng bán kính trên, và **các trường** (logo, tên và số sao trung bình nếu trường đã có đánh giá) (tài khoản có vai trò *school*, đang hoạt động, đã Ký HĐ) có ít nhất một cơ sở trong vòng tròn. Bản đồ mở sẵn ở mức phóng gần hơn nên mép vòng tròn có thể nằm ngoài màn hình. Bấm vào một trường hiện thẻ nhỏ: ảnh, tên, sao, giới thiệu ngắn (lấy từ phần giới thiệu của đối tác, cắt 140 ký tự) và nút **Tìm hiểu thêm** mở trang đối tác ở tab mới. Trường không hiện trên bản đồ khi cơ sở chưa có tọa độ. Bản đồ là **Google Maps**, cần khóa riêng cho trình duyệt (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`, do người phụ trách kỹ thuật cài lúc triển khai; chưa có khóa thì nút Xem bản đồ không hiện). Khi bản đồ có nhiều trường gần nhau, tên bị trùng sẽ ẩn bớt, phóng to để thấy đủ.

**Tối đa 2 khóa mỗi đối tác:** trong kết quả tìm kiếm khóa học, mỗi đối tác chỉ hiện tối đa 2 khóa (khóa xếp trên cùng theo cách sắp xếp đang chọn), để đối tác lớn không chiếm hết trang. Xem hết khóa của một đối tác ở trang đối tác. Con số này đặt bằng cấu hình `app.search.max-per-partner` của máy chủ (mặc định 2, đặt 0 để tắt). Số kết quả được tính sau khi giới hạn, và chỉ xét 300 kết quả đầu của lượt tìm.

### 5.3 Sắp xếp

Phổ biến nhất (mặc định), mới nhất, giá thấp/cao, khai giảng sớm nhất, giá mỗi buổi thấp nhất, và Gần nhất (chỉ khi dùng Gần tôi).
"Phổ biến" dựa trên điểm phổ biến hệ thống tự tính hằng ngày, cộng **Điểm ưu tiên** ở tab Tổng quan của khóa (dùng để đẩy khóa lên).

---

## 6. Trang chủ

Trang chủ có các khối: tìm kiếm + chip, **Dành cho {tên bé}**, **Đang hot gần bạn**, **Top khóa học được đánh giá cao**, **Bộ sưu tập**, **Chuyên gia và đối tác nổi bật**, nhờ tìm giúp, bài viết.

- **Dành cho {bé}**: khóa phổ biến nhất hợp tuổi bé đang chọn. Khách chưa đăng nhập: dùng độ tuổi khách đã khai; chưa khai thì hiện "Khóa học được quan tâm nhiều".
- **Đang hot gần bạn**: chỉ hiện với tài khoản có **địa chỉ nhà đã lưu có tọa độ** (dùng bán kính "Gần tôi").
- **Top khóa học được đánh giá cao**: các khóa có điểm đánh giá trung bình cao nhất trong các đánh giá viết gần đây (chỉ tính đánh giá đang hiện). Khoảng thời gian chỉnh ở Cài đặt > Vận hành (mục 8); tiêu đề tự đổi: từ 30 ngày trở xuống "trong tháng", đến 90 ngày "trong quý", dài hơn thì không ghi thời gian.
- **Không lặp khóa giữa các khối**: khối phía dưới bỏ các khóa đã hiện ở khối phía trên (Dành cho > Đang hot gần bạn > Top đánh giá cao). Khối nào còn dưới 4 khóa mới thì tự ẩn. "Hot" tính theo điểm ưu tiên (điểm ưu tiên admin cho khóa/đối tác, đánh dấu Hot, lượt xem, giỏ hàng, yêu thích, đánh giá), nên muốn đẩy một khóa lên thì tăng điểm ưu tiên.
- **Bộ sưu tập**: xem mục 7. Không có bộ nào đang bật thì khối ẩn.
- **Chuyên gia và đối tác nổi bật**: tự động lấy 4 trường và 4 giáo viên được tìm nhiều nhất trong số đối tác **đã ký hợp đồng** (công tắc Ký HĐ bật, mục 2.2), bấm vào mở trang đối tác (mục 7b). Muốn đưa ai lên cao hơn thì tăng điểm ưu tiên của họ.
- Khối **Thử điều mới cho con** là một thẻ nổi bật giải thích ngắn: chọn theo tuổi bé, ưu tiên gần nhà (cần địa chỉ nhà trong tài khoản), mỗi ngày một danh sách mới. Bấm "Khám phá hôm nay" để mở danh sách (mục 7b).
- Khối nào không có dữ liệu thì tự ẩn, không để lại chỗ trống.

---

## 7. Bộ sưu tập

Trang **Bộ sưu tập** (nút ở đầu trang Khóa học, cạnh Tags): danh sách khóa do biên tập chọn, ví dụ "Chuẩn bị vào lớp 6", "Hè không màn hình", "Cuối tuần cả nhà".

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

## 7d. Lộ trình và gợi ý khóa học

Phụ huynh thấy tối đa **một thẻ gợi ý mỗi ngày** ở trang Hôm nay của từng bé, và gợi ý cho các bé còn lại ở trang đơn hàng thành công. Mọi gợi ý đều có **lý do** hiển thị ("Bin đang học Tiếng Anh 2, bước tiếp theo của lộ trình Tiếng Anh là Tiếng Anh 3") và nút **Không quan tâm** (ẩn khóa đó cho bé trong số ngày đặt ở mục 8, mặc định 30). Không gợi ý khóa bé đã mua, khóa không hợp tuổi, khóa trùng giờ với lịch đang học.

**Lộ trình** (nút **Lộ trình** ở đầu trang Khóa học, cạnh Tags): admin tạo chuỗi các **bước** có thứ tự, ví dụ "Bóng đá U13 → U15 → U17". Tên, mô tả, ảnh, rồi tìm khóa bằng khung "tìm khóa + tick" như Bộ sưu tập. Ô "Khóa đã chọn sẽ được" quyết định cách thêm: thành **một bước mới có nhiều khóa** (các khóa là lựa chọn thay thế nhau, ví dụ cùng một trình độ của nhiều đối tác), thành **các bước riêng**, hoặc **thêm vào một bước đã có**. Sắp xếp bước bằng mũi tên, mỗi bước có ghi chú. Cần ít nhất 2 bước. Bé có **một khóa bất kỳ** của bước là coi như đã qua bước đó. Khi gợi ý bước kế tiếp, hệ thống chọn khóa liên quan nhất trong bước đó: ưu tiên khóa của cùng đối tác với khóa bé đã học ở bước trước, rồi đến thứ tự trong bước; khóa không hợp tuổi hoặc trùng lịch bị loại. Bé học (hoặc đã học) một bước sẽ được gợi ý bước kế tiếp mà bé chưa có; khi gói sắp hết buổi, tin nhắc gia hạn cũng nêu bước tiếp theo. Tiến độ của bé không phải nhập: bước nào bé có đơn hoặc lớp thì tính là đã có. Tắt công tắc "Đang dùng" để lộ trình ngừng gợi ý. Khách xem trọn lộ trình ở trang `/pathway/<đường dẫn>` (mỗi bước là một hàng cuộn ngang các khóa, khóa liên quan khóa bé đã học ở bước trước nằm bên trái; bước bé đã qua thu gọn chỉ còn khóa bé đã học kèm nút xem các khóa khác cùng bước; bước bị nhảy cóc có thẻ "Bạn đã bỏ qua bước này" và nút "Đặt lại từ bước này", sau đó gợi ý quay về bước đó cho tới khi bé có khóa của bước), mở từ thẻ gợi ý "Xem toàn bộ lộ trình" và từ khối "Lộ trình học" trên trang khóa học.

**5 loại gợi ý** (tắt/bật ở Cài đặt > Vận hành > Gợi ý khóa học):

| Loại | Gợi ý khi nào |
|---|---|
| Lộ trình | Bé có một bước của lộ trình |
| Anh chị em | Một bé trong tài khoản học ở đối tác nào thì các bé còn lại (hợp tuổi, không trùng giờ) được gợi ý khóa khác của đối tác đó. Cần nhập ngày sinh của bé |
| Khung giờ trống | Bé có một ngày trong tuần chưa có lớp nào, có lớp vào ngày đó gần khu vực bé đang học (hoặc học online) |
| Theo mùa | Khóa trong Bộ sưu tập đang trong thời gian hiển thị |
| Sở thích của bé | Bé có trả lời khảo sát sở thích khi thêm bé (cờ vua, vẽ, bơi...) |

Thứ tự ưu tiên: Lộ trình, Anh chị em, Khung giờ trống, Theo mùa, Sở thích. Cùng một khóa chỉ hiện theo lý do mạnh nhất.

**Hiệu quả**: cuối trang Lộ trình có bảng 30 ngày gần nhất theo từng loại: lượt xem, lượt bấm, tỷ lệ bấm, số bé bấm rồi đặt khóa đó trong 30 ngày. Loại nào kém thì bỏ chọn ở Cài đặt > Vận hành.

Lưu ý: khóa chỉ được gợi ý khi đang bật và đối tác đã ký hợp đồng (cùng quy tắc với trang khách thấy). Nên nhập sẵn vài lộ trình thật, nếu không đợt đầu chỉ có gợi ý anh chị em, khung giờ trống và theo mùa.

---

## 7e. Gợi ý khóa học bằng AI

**Khách thấy gì.** Khối "Thử điều mới cho {bé}" ở trang chủ dùng thẳng AI khi tính năng đang bật (thêm dòng thứ tư "Gợi ý từ AI"; tắt AI thì khối quay về danh sách theo luật như cũ). Trang /today có thẻ "Gợi ý khóa học bằng AI". Bấm "Khám phá hôm nay", nếu người học (bản thân hoặc một bé) chưa làm khảo sát sở thích thì hiện popup ba câu hỏi (có nút Bỏ qua, bỏ qua cũng được ghi nhận, không hỏi lại). Sau đó mở trang riêng với thanh tiến trình và các câu vui, rồi hiện một lưới khóa học, mỗi khóa có một dòng lý do. Cuối trang có 👍/👎 kèm lý do nhanh và nút "Tìm kiếm thêm" dẫn sang trang tìm kiếm. Khách chưa đăng nhập vẫn làm được khảo sát (lưu trên trình duyệt) và được yêu cầu đăng nhập để nhận gợi ý; câu trả lời tự chuyển vào tài khoản khi đăng nhập, đăng ký hoặc khi bé được tạo từ thông tin khách đã nhập.

**Cách hoạt động (để biết vì sao tiết kiệm).** Hệ thống lọc trước bằng luật của mục 7d (đúng tuổi, không trùng lịch, chưa mua, khóa đang hiện cho khách) và thêm khóa theo sở thích, điều phụ huynh muốn bé học, khóa phổ biến cùng tuổi. Chỉ số khóa đã chọn (mặc định 50) được gửi cho AI, mỗi khóa một dòng ngắn (tên, hình thức, tuổi, giá, tag, mô tả ngắn) cùng hồ sơ người học. AI trả về các khóa hợp nhất kèm lý do. Kết quả được lưu theo từng người học theo ngày: **mỗi người học chỉ gọi AI một lần mỗi ngày**; tài khoản nhiều bé thì mỗi bé một lần. AI đang tắt hoặc không gọi được (mạng, hết hạn mức) thì khách thấy gợi ý theo luật và lần sau thử gọi lại. Nếu AI đã trả lời nhưng không dùng được thì danh sách theo luật được lưu cho cả ngày (vẫn tính một lần gọi và có token), trang Gợi ý AI ghi số lần này là "lỗi, dùng luật". Mỗi đối tác tối đa 4 khóa trong số khóa gửi cho AI.

**Cài đặt** (Cài đặt > Vận hành > Gợi ý khóa học bằng AI):
- Bật gợi ý bằng AI: tắt thì thẻ gợi ý biến mất khỏi trang chủ và /today.
- Số khóa gửi cho AI (10 đến 100, mặc định 50): nhiều thì chọn kỹ hơn nhưng tốn token hơn.
- Số khóa AI trả về (4 đến 24, mặc định 12, không lớn hơn số khóa gửi): chọn số chia hết cho 2, 3, 4 như 12 để lưới đủ hàng trên mọi màn hình. Thay đổi áp dụng cho các lần gợi ý mới, danh sách đã lưu trong ngày giữ nguyên.

**Số liệu.** Menu Khóa học > **Gợi ý AI**: số lần gọi AI (kèm số lần lỗi phải dùng luật), số người học, token gửi và nhận, lượt mở danh sách, lượt xem khóa (chỉ tính khi khách bấm vào khóa từ danh sách), tỷ lệ danh sách có bấm xem khóa, số bé đặt khóa trong 30 ngày sau khi bấm, số 👍 và 👎, lý do bị chê nhiều nhất và danh sách phản hồi kèm góp ý.

**Phản hồi cải thiện gợi ý thế nào.** Với mỗi bé, 3 phản hồi gần nhất (khóa đã gợi ý, thích hay chưa hài lòng, lý do, góp ý) và 3 lý do bị chê nhiều nhất của toàn hệ thống trong 30 ngày được đưa vào lần gợi ý sau để AI tránh lặp lại. Không cần huấn luyện lại gì.

**Theo dõi token của mọi tính năng AI.** Menu Khóa học > **Dùng AI (token)**: tổng số lần gọi, lỗi, token gửi đi và nhận về của tất cả tính năng dùng Anthropic (gợi ý khóa học, so sánh khóa học, quiz viết câu hỏi và chấm đáp án), chia theo tính năng, theo mô hình và theo ngày (7, 30 hoặc 90 ngày), kèm 10 lỗi gần nhất. Mỗi bảng và thẻ tổng có thêm **chi phí ước tính (USD)**, tính theo giá niêm yết của Anthropic cho từng mô hình (bảng "Theo mô hình" ghi giá gửi đi và nhận về trên 1 triệu token), chưa tính giảm giá cache hay phụ phí prompt dài. **Chọn mô hình cho từng tính năng:** khối "Mô hình cho từng tính năng" ngay trên các bảng, mỗi tính năng một danh sách chọn (kèm giá mỗi 1 triệu token), bấm Lưu là áp dụng từ lần gọi kế tiếp, không cần deploy; tính năng chưa chọn dùng mô hình mặc định của máy chủ. Giá nằm trong `AiPricing`, cùng danh sách mô hình được phép chọn; khi đổi mô hình hoặc Anthropic đổi giá thì cần cập nhật ở đó, mô hình chưa có giá được tính $0 và trang có cảnh báo. Số liệu chỉ có từ lúc bản này được triển khai; trang Gợi ý AI vẫn giữ số cũ của riêng nó.

**Cần có.** Khóa API của Anthropic đặt ở biến `ANTHROPIC_API_KEY` trên máy chủ (mục 11). Không có thì trang Gợi ý AI báo "chưa có khóa" và thẻ gợi ý ẩn.

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
| Tính đánh giá cao trong (ngày) | Khoảng thời gian lấy đánh giá cho khối "Top khóa học được đánh giá cao" trên trang chủ (7 đến 3650) | 90 ngày |
| Thưởng thêm khi có ảnh (anyPoint) | Cộng thêm khi đánh giá có ít nhất một ảnh. 0 = tắt | 20 |
| Nhắc phụ huynh viết đánh giá | Nhắc khi học nửa khóa và khi hết khóa (mục 7c) | Bật |
| Vòng đời học viên | Xem bảng riêng bên dưới | |
| Gợi ý khóa học | Bật/tắt từng loại gợi ý; số ngày không nhắc lại sau "Không quan tâm" (mục 7d) | Bật cả 5 loại, 30 ngày |
| Cập nhật chỉ mục ngay | Chạy lại toàn bộ chỉ mục tìm kiếm, gồm cả khóa học và danh sách trường / chuyên gia (mất vài phút) | |

### Vòng đời học viên: nhắc lịch, gia hạn, hậu mãi

Cùng trang cài đặt, thẻ **Vòng đời học viên**. Mọi tin gửi **cả trong app (kèm push) và email**, tôn trọng công tắc thông báo của từng người (Tài khoản > Thông báo). Email sửa nội dung ở **Cài đặt Emails** (4 mẫu mới: "Sắp khai giảng", "Bé vắng học liên tiếp", "Khảo sát giữa khóa", "Gia hạn khóa học / nhắc học phí"; mẫu "Xác nhận đơn hàng" có thêm thông tin lớp).

| Mục | Ý nghĩa | Mặc định |
|---|---|---|
| Bật nhắc tự động | Tắt thì không gửi nhắc khai giảng, vắng học, khảo sát (nhắc gia hạn và học phí vẫn chạy) | Bật |
| Giờ gửi tin | Chỉ gửi trong khoảng giờ này; tin đến hạn ban đêm gửi vào sáng hôm sau | 8 đến 21 giờ |
| Nhắc trước khai giảng (ngày) | Các mốc, cách nhau dấu phẩy. Tin kèm giờ tập trung, địa điểm, link học online, đồ mang theo lấy từ lớp (Khóa học > Lịch học) | 3, 1 |
| Bật báo vắng học | Công tắc của tin "bé vắng học liên tiếp". **Mặc định tắt** vì nhiều lớp chưa ghi điểm danh đủ; bật khi phụ huynh và admin đã điểm danh đều | Tắt |
| Báo khi vắng liên tiếp (buổi) | Phụ huynh nhận tin hỏi thăm kèm cách xin nghỉ / đổi lịch; admin nhận thông báo để gọi. Chỉ áp dụng lớp có điểm danh; buổi đã duyệt nghỉ không tính là vắng; chỉ báo khi lần vắng gần nhất trong 14 ngày | 2 |
| Khảo sát giữa khóa (%) | Hỏi phụ huynh chấm 1 đến 5 sao khi bé học được tỷ lệ này của số buổi. Câu hỏi hiện đầu trang Hôm nay đến khi trả lời | 50% |
| Điểm bị coi là thấp | Từ mức này trở xuống, admin nhận thông báo kèm ghi chú của phụ huynh | 2 sao |
| Nhắc gia hạn gói khi còn (buổi) | Gói mua theo số buổi | 3 buổi |
| Nhắc gia hạn trước ngày kết thúc (ngày) | Khóa tính theo thời gian | 14 ngày |
| Nhắc học phí trước hạn (ngày) | Các mốc, cách nhau dấu phẩy. Quá hạn có một nhắc nhẹ nhàng riêng ("chưa nhận được học phí") | 7, 1 |
| Thưởng anyPoint khi điểm danh đủ | Tặng một lần cho tài khoản phụ huynh khi bé có mặt đủ mọi buổi của khóa (khóa đã kết thúc hết số buổi đã mua); buổi xin nghỉ được duyệt không tính là có mặt. 0 = tắt | 0 |
| Tặng anyPoint khi gia hạn sớm | Tặng khi phụ huynh bấm Gia hạn lúc gói / kỳ cũ còn hiệu lực và đơn được thanh toán; mỗi lần gia hạn một lần. 0 = tắt | 0 |

**Điểm danh**: phụ huynh bấm "Đã đến lớp" cho buổi hôm nay trên trang Hôm nay, hoặc cho buổi quá khứ (120 ngày gần nhất) bằng cách bấm vào buổi học trong **Tài khoản > Lịch học** rồi "Đánh dấu đã đến lớp". Trang Hôm nay của phụ huynh có khối **Buổi chưa điểm danh** (3 buổi gần nhất trong 30 ngày chưa ai điểm danh, nút "Điểm danh bù"), và trong Lịch học các buổi đó có nhãn "Chưa điểm danh". Admin điểm danh (và bỏ điểm danh) ở menu **Theo dõi lịch học**, cột **Điểm danh** của từng buổi đã diễn ra. Điểm danh là căn cứ của báo vắng học và thưởng đủ buổi, nên nên kiểm tra lại khi bật thưởng.

Lưu ý: nút **Gia hạn** ở trang Hôm nay thêm đúng khóa, đúng bé, đúng lớp vào giỏ rồi mở trang thanh toán; nếu lớp đã đóng đăng ký thì mở trang chọn lại. Khoản tặng hiện trong lịch sử anyPoint của khách là "Thưởng gia hạn sớm". Danh sách mẫu ZNS cần đăng ký: `docs/zns-templates.md`.

Đơn bị hủy do quá hạn mà khách vẫn chuyển khoản: tiền được ghi lại ở mục cần kiểm tra và admin nhận thông báo để xử lý, không mất tiền.
Khách có đơn của cùng khóa và cùng bé đã thanh toán ở đơn khác thì không bị nhắc.

---

## 9. Nhu cầu của khách

- **Nhờ tìm khóa học** (thanh trên cùng, bên trái chuông: "Nhờ tìm"): khách điền "Nhờ anyLEARN tìm giúp" khi không thấy khóa cần. Trạng thái: mới, đang liên hệ, đã có khóa phù hợp, chưa có đối tác, đã đóng. Chọn "đã có khóa phù hợp" phải nhập mã khóa; khách có tài khoản sẽ được báo kèm link. Mỗi số điện thoại gửi tối đa 3 yêu cầu mỗi ngày.
- **Rẻ hơn** (thanh trên cùng, bên trái chuông; trước đây là "Báo giá rẻ hơn"): khách báo giá thấp hơn ở nơi khác. Các trạng thái: mới, đang kiểm tra, đã xử lý (khách có tài khoản được cảm ơn), từ chối. Đây là cam kết "giá bằng hoặc rẻ hơn tại trường".
- **Xu hướng nhu cầu** (Nội dung & phân tích): từ khóa được tìm nhiều, từ khóa tìm không ra kết quả (xuất CSV để tìm đối tác mới), nhu cầu theo độ tuổi, khu vực, lĩnh vực; lĩnh vực nhiều lượt xem mà ít đơn.

Mỗi lần khách tìm (chỉ trang kết quả đầu) được ghi lại theo trình duyệt, kèm bộ lọc và số kết quả. Tìm lại cùng từ khóa trong vòng 10 giây được tính là một lần tìm đã chỉnh bộ lọc.

---

## 10. Thông báo và thanh toán

- **Người nhận thông báo admin** (Cài đặt > Thông báo): ngoài các tài khoản admin, thêm thành viên nhận thông báo đơn mới, chuyển khoản, yêu cầu của khách. Họ bật thông báo ở Tài khoản > Thông báo để nhận trên điện thoại; họ không vào được trang admin.
- **Tài khoản ngân hàng** (Cài đặt > Thanh toán): tài khoản nhận tiền hiện trong mã QR ở trang đơn hàng. Chọn ngân hàng thì mã BIN tự điền. Nội dung chuyển khoản dạng `ALQR{mã đơn}` do hệ thống tạo, không sửa.
- **Kiểm toán anyPoint**: kiểm tra số dư điểm của thành viên.
- Luôn viết **anyPoint** (không viết "điểm"); giá trị quy đổi ghi "~120.000đ".
- **Hoạt động (đăng ký học thử, test đầu vào, tham quan):** menu Quản lý thành viên > Hoạt động. Mỗi dòng chờ duyệt có hai nút **Duyệt** và **Từ chối**; bấm nút nào cũng mở hộp để nhập nội dung gửi khách qua thông báo. Duyệt: ghi thêm giờ, địa điểm, đồ cần mang (không bắt buộc). Từ chối: **bắt buộc** nhập lý do. Nếu người đăng ký là bé thì thông báo gửi cho phụ huynh. Nội dung đã gửi hiện lại dưới trạng thái của dòng đó.
- **Số đỏ trên menu và thanh trên cùng:** các mục **Đơn hàng** (đơn khách đã bấm thanh toán, đang chờ), **anyPoints** (nạp/rút đang chờ duyệt), **Hoạt động** (đăng ký chưa duyệt), **Nghỉ / đổi lịch** (yêu cầu chờ xử lý), **Nhờ tìm** (thanh trên cùng) (mọi yêu cầu chưa ở trạng thái "Đã đóng", gồm mới, đang liên hệ, đã có khóa phù hợp, chưa có đối tác) và **Rẻ hơn** (thanh trên cùng) (mọi báo cáo chưa ở trạng thái cuối "Đã chỉnh giá" hoặc "Không đúng", gồm mới và đang kiểm tra) hiện số bản ghi chưa xử lý xong; số tự cập nhật mỗi phút và mỗi khi chuyển trang. Hết việc thì số biến mất.
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
  - `ANTHROPIC_API_KEY`: khóa API Anthropic cho gợi ý khóa học bằng AI (mục 7e). Không có thì tính năng tự ẩn.
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
| Không có nhắc vắng học cho một lớp | Công tắc "Bật báo vắng học" đang tắt, hoặc lớp không có điểm danh nào (không đo được) | Điểm danh ít nhất một buổi, hoặc bật nút "Vào lớp" cho lớp online |
| Bé học đủ buổi nhưng phụ huynh không nhận anyPoint điểm danh | Đặt 0, còn buổi chưa điểm danh (kể cả buổi xin nghỉ được duyệt), khóa chưa hết số buổi đã mua, hoặc đã nhận cho khóa đó | Mở Theo dõi lịch học, điểm danh các buổi còn thiếu; kiểm tra mục 8 |
| Phụ huynh không nhận anyPoint gia hạn sớm | Đặt 0, đơn chưa thanh toán, đã nhận cho lần gia hạn đó, hoặc gói cũ đã hết khi bấm Gia hạn | Kiểm tra mục 8 và lịch sử anyPoint của khách |
| Phụ huynh không thấy thẻ gợi ý | Chưa có khóa nào hợp (tuổi, giờ, đã mua), bé chưa nhập ngày sinh (loại Anh chị em), loại gợi ý đang tắt, hoặc đã bấm Không quan tâm | Kiểm tra mục 7d; bé cần có ngày sinh; tạo lộ trình cho khóa đang học |
| Thẻ "Gợi ý khóa học bằng AI" không hiện | Công tắc AI đang tắt, hoặc máy chủ chưa có `ANTHROPIC_API_KEY` | Bật ở Cài đặt > Vận hành, nhờ người cài đặt thêm khóa (mục 11) |
| Gợi ý AI hiện lý do kiểu luật, không có 👍/👎 | AI lỗi hoặc quá thời gian nên hệ thống trả gợi ý theo luật (không lưu) | Xem trang Gợi ý AI và nhật ký máy chủ; người dùng thử lại sau |
| Phụ huynh không viết được đánh giá | Tài khoản chưa có đơn đã giao của khóa đó | Kiểm tra đơn ở mục Đơn hàng; đơn chưa thanh toán chưa được tính |
| Không tải được ảnh đánh giá | Chưa cấu hình kho ảnh (AWS) | Nhờ người cài đặt (mục 11) |
| Đối tác không thấy nút Trả lời | Không đăng nhập bằng tài khoản sở hữu khóa | Đăng nhập đúng tài khoản đối tác, mở khóa của họ |
| Người theo dõi không nhận thông báo khóa mới | Khóa đã báo một lần, hoặc khóa đã bật sẵn từ trước | Chỉ khóa chuyển từ tắt sang bật mới báo; tạo khóa ở trạng thái tắt rồi bật khi sẵn sàng |
| "Thử điều mới" trống | Không có khóa nào khớp tuổi và khu vực | Kiểm tra độ tuổi và tọa độ cơ sở của khóa |
| Danh sách trường / chuyên gia (trang anySCHOOL, anyPROFESSOR, khối đối tác nổi bật) thiếu người | Chỉ đối tác đã bật **Ký HĐ** mới được liệt kê; hoặc danh sách chưa cập nhật sau khi bật Ký HĐ hàng loạt | Bật Ký HĐ cho đối tác (Thành viên), rồi bấm Cập nhật chỉ mục ngay |
| Bộ sưu tập không hiện trên trang chủ | Đang tắt, ngoài khoảng ngày, hoặc không còn khóa nào đang mở | Kiểm tra công tắc Hiện, khoảng ngày và danh sách khóa |
| Khách không thấy "Trả góp 0%" | Tổng đơn dưới mức "Từ đơn" của phương thức (mặc định 3.000.000đ), hoặc đang tắt | Vào Cài đặt > Thanh toán > Phương thức thanh toán, kiểm tra công tắc và hai ô số tiền |

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

### Phương thức thanh toán bật tắt được

Khách thấy danh sách các cách thanh toán ở trang thanh toán và khi thử lại thanh toán đơn. Danh sách này không còn cố định trong code.

- **Nhập ở đâu:** menu người dùng góc phải > "Cài đặt" > nhóm "Thanh toán" > "Phương thức thanh toán". Mỗi dòng có công tắc **Bật**, **Tên hiện cho khách** (để trống = tên mặc định), **Từ đơn** và **Đến đơn** (đồng).
- **Luật:** phương thức chỉ hiện khi đang bật và tổng tiền các khóa trong giỏ (trước khi trừ mã giảm giá và anyPoint) nằm trong khoảng Từ đơn – Đến đơn; "Đến đơn" = 0 là không giới hạn. Mặc định: Trả góp 0% từ 3.000.000đ; MoMo từ 1.000đ đến 50.000.000đ; còn lại không giới hạn. Phải bật ít nhất một phương thức.
- **Tắt rồi thì sao:** khách không chọn được, và hệ thống từ chối cả khi ai đó cố gửi phương thức đã tắt. Đơn cũ đã chọn phương thức đó vẫn xử lý bình thường.
- **Sau khi đổi:** có hiệu lực ngay, không cần làm gì thêm.

### Chat lớp và kiểm duyệt

Phụ huynh cùng một lớp (có bé đăng ký cùng một khóa học, kể cả khác ca) trao đổi trong **Nhóm lớp** ở tab "Cộng đồng" trên app. Phụ huynh chỉ thấy tên hiển thị tự chọn (ví dụ "Mẹ Bin"), không thấy số điện thoại hay email. Tài khoản của bé không vào chat.

- **Mỗi khóa học một nhóm**, tự tạo khi có người đăng ký (đã thanh toán) và mở tab Cộng đồng; khóa không chia ca vẫn có nhóm. Tên phụ huynh trong nhóm được hệ thống thêm lớp đang học, ví dụ "Mẹ Bin · Thứ 2 18:00", và phụ huynh được báo điều này khi vào nhóm. Đối tác của khóa học tự là người kiểm duyệt (ghim tin, ẩn tin, gửi thông báo cả lớp). Hết khóa, thành viên còn đọc được số ngày đặt trong Cài đặt rồi tự rời nhóm.
- **Xử lý báo cáo:** menu "Quản lý thành viên" > "Chat lớp" > tab "Báo cáo tin nhắn" (số đỏ ở menu là báo cáo chờ xử lý). Các nút: Ẩn tin; Ẩn tin + khóa 7 ngày; Ẩn tin + khóa chat (khóa người gửi ở mọi nhóm); Bỏ qua (không vi phạm). Tin bị ẩn hiện "Tin nhắn này đã bị ẩn" cho mọi người.
- **Thêm giáo viên / người hỗ trợ:** tab "Nhóm lớp" > Quản lý > nhập **ID người dùng**, chọn "Kiểm duyệt (giáo viên)" để người đó nhắn, ghim, ẩn tin, gửi thông báo cả lớp. Cũng ở đây: cho thành viên rời nhóm, khóa/mở khóa chat, ẩn tin cũ, khóa cả nhóm (mọi người chỉ đọc, giáo viên vẫn nhắn được).
- **Tab "Người bị khóa chat"** để mở khóa. **Tab "Cài đặt":** bật/tắt chat toàn hệ thống, đối tác có tự là người kiểm duyệt không, số tin tối đa mỗi phút (mặc định 20), số ngày còn đọc được sau khi hết khóa (mặc định 30), danh sách từ cấm (tin chứa từ cấm không gửi được), và nội quy hiện khi vào nhóm lần đầu.
- Nội quy mặc định: chỉ chủ đề học, tôn trọng nhau không đả kích, không tôn giáo, chính trị, không quảng cáo/chèo kéo, không chia sẻ số điện thoại, địa chỉ, ảnh trẻ. Câu chữ điều khoản sử dụng cho phần cộng đồng cần chủ sản phẩm duyệt.
- Có hiệu lực ngay, không cần lập lại chỉ mục. Chưa có: gửi ảnh, tắt tiếng từng nhóm, gộp thông báo tin mới.

### Hạn dùng anyPoint

Điểm của thành viên mua khóa học có hạn dùng; điểm của đối tác không bao giờ hết hạn. Khách đọc giải thích ở trang `/info/anypoint-expiry` và thấy dòng "X anyPoint dùng được đến hết ngày …" dưới số dư ở Tài khoản > anyPoint.

- **Nhập ở đâu:** Cài đặt > Vận hành > nhóm "Hạn dùng anyPoint": công tắc **Bật hạn dùng**, **Hạn dùng (tháng)** (mặc định 12), **Bắt đầu tính hạn từ ngày** (mặc định 01/01/2027).
- **Luật:** mỗi lần nhận điểm là một phần riêng, hết hạn sau số tháng kể từ ngày nhận; điểm nhận trước ngày bắt đầu cũng tính từ ngày bắt đầu. Với mặc định, sớm nhất đến 01/01/2028 mới có điểm bị xóa (dùng được đến hết 31/12/2027). Khi thanh toán, hệ thống dùng phần điểm sắp hết hạn trước. Điểm đơn bị hủy hoàn lại được tính là phần mới.
- **Hằng ngày lúc 00:10:** điểm quá hạn bị xóa (xuất hiện dòng "anyPoint hết hạn" trong lịch sử, thành viên nhận thông báo); thành viên được nhắc trước 30 ngày và 7 ngày (thông báo trong app + push, tắt được ở Tài khoản > Thông báo > "Nhắc anyPoint sắp hết hạn").
- **Sau khi đổi:** có hiệu lực ngay cho cả điểm đang có (đổi số tháng hoặc ngày bắt đầu là đổi hạn của mọi phần điểm). Tắt công tắc thì ngừng xóa và ngừng nhắc, điểm không bị mất. Điểm đã bị xóa không tự khôi phục: cần cộng bù tay.

### Lượt mở trang khóa học theo người dùng

Hệ thống ghi mỗi người đã đăng nhập mở khóa nào, gộp theo ngày (một dòng cho mỗi người, khóa và ngày), giữ 60 ngày rồi tự xóa. Gợi ý AI dùng 5 khóa vừa xem trong 30 ngày làm một tín hiệu. Không có gì phải nhập hay cấu hình.


### Hạng thành viên và ưu đãi gia đình

Menu "Cài đặt" (đáy menu trái) > nhóm "Vận hành" > "Hạng & ưu đãi gia đình".

- **Hạng thành viên:** Thành viên, Bạc, Vàng, Kim cương theo tổng tiền các đơn đã hoàn tất trong 12 tháng gần nhất. Chỉ tài khoản thành viên (không phải đối tác). Mặc định: Bạc từ 3.000.000đ, Vàng từ 10.000.000đ, Kim cương từ 30.000.000đ. Hạng tự tính lại mỗi đêm và mỗi khi một đơn của người đó được thanh toán; nút "Tính lại ngay" để tính cho mọi người.
- **Quyền lợi hiện có:** hệ số nhân anyPoint khi mua (mặc định Bạc x1,2, Vàng x1,5, Kim cương x2). Hệ số chỉ áp cho phần anyPoint người mua tự nhận, không đổi điểm của đối tác hay người giới thiệu. **Hệ số làm tăng chi phí anyPoint**; đặt bằng 1 để không thưởng thêm. Trang khóa học vẫn hiện điểm cơ bản, giỏ hàng và đơn hiện điểm đã nhân. Phụ huynh thấy hạng, thanh tiến độ và "Còn X đ nữa lên hạng Y" ở đầu Tài khoản và trang anyPoint; trong nhóm chat lớp, hạng Bạc/Vàng/Kim cương hiện bên cạnh tên.
- **Ưu đãi gia đình:** bé thứ 2 trở lên của cùng tài khoản được giảm % (mặc định 5%) khi đăng ký trong số ngày cài đặt (mặc định 30) kể từ lúc bé khác đăng ký, hoặc cùng một giỏ hàng. Bé đầu tiên không được giảm; đơn bị hủy không tính. Giỏ hàng hiện dòng "Ưu đãi gia đình", số tiền chuyển khoản trên đơn là số đã giảm. Đặt 0% hoặc tắt công tắc để dừng.
- **Phụ huynh thấy ở đâu:** trang "Ưu đãi của tôi" (Tài khoản > Ưu đãi của tôi) gom anyPoint, hạng, ưu đãi gia đình và mã giới thiệu. Thẻ gợi ý khóa học cho bé hiện nhãn "Giảm X% ưu đãi gia đình" khi anh/chị của bé vừa đăng ký trong thời hạn. Đổi % hay số ngày ở trang này thì các nơi trên đổi theo. Voucher chưa nằm trong trang này.
- **Chưa có:** giảm theo từng đối tác, ưu tiên giữ chỗ, voucher sinh nhật, hỗ trợ ưu tiên.
- Thay đổi ngưỡng có hiệu lực với lần tính lại tiếp theo (bấm "Tính lại ngay" để áp dụng luôn).

### So sánh khóa học

Không có trang riêng trong admin. Phụ huynh bấm "So sánh" trên khóa học (tối đa 3 khóa) rồi mở bảng `/compare`.

- **Số liệu lấy từ dữ liệu bạn nhập:** học phí, số buổi (từ "chu kỳ" của khóa), lịch của các ca, độ tuổi, có học thử không, địa chỉ cơ sở (để tính khoảng cách), anyPoint. Khóa thiếu thông tin nào thì bảng ghi "Chưa có thông tin", nên nhập đủ các trường này sẽ giúp khóa được so sánh đầy đủ (xem trang "Thiếu thuộc tính").
- **Không chấm điểm, không xếp hạng.** Chỉ tô đậm giá trị tốt nhất của từng hàng (rẻ nhất, gần nhất) khi có khác biệt rõ.
- **AI đọc mô tả:** phần "Ý chính trong mô tả khóa học" do AI rút ra từ mô tả khóa (phù hợp với ai, cách học, đã bao gồm, cần chuẩn bị, kết quả mong đợi), chỉ ghi lại điều mô tả nêu, mục không nêu thì trống. **Mô tả viết rõ các ý này thì bảng đầy đủ hơn.** Sửa mô tả thì AI đọc lại ở lần xem tiếp theo (mỗi khóa tốn một lần gọi AI cho tới khi mô tả đổi).
- Dùng chung công tắc "Gợi ý AI" ở Cài đặt > Vận hành và khóa `ANTHROPIC_API_KEY`: tắt thì không đọc thêm khóa mới (các khóa đã đọc vẫn hiện).
- **Cảnh báo khác lĩnh vực:** nếu một khóa không chung danh mục hoặc tag nào với các khóa còn lại, bảng so sánh ghi chú "khác lĩnh vực". Vì vậy cần gán đúng danh mục và tag cho khóa; khóa chưa có danh mục và tag thì không bị cảnh báo.

### Tải ảnh lên (khóa học, bài viết, avatar)

- Có thể chọn ảnh gốc từ máy ảnh hoặc điện thoại, **tối đa 10MB mỗi ảnh**. Hệ thống tự thu nhỏ về cạnh dài tối đa 1080px (avatar 720px) và nén trước khi lưu, nên ảnh hiển thị nhanh hơn và không cần nén trước.
- Ảnh đã nhỏ và nhẹ (dưới khoảng 400KB), ảnh GIF và ảnh định dạng webp được giữ nguyên. Ảnh PNG có nền trong suốt vẫn là PNG.
- Ảnh quá lớn (trên 10MB hoặc trên 60 triệu điểm ảnh) bị từ chối kèm thông báo.

### Link giới thiệu (/ref)

- Mỗi thành viên có link `https://anylearn.vn/ref/{số điện thoại}` (xem ở "Ưu đãi của tôi"). Người đăng ký qua link được ghi nhận người giới thiệu (cột người giới thiệu của thành viên), nên hoa hồng giới thiệu hiện có áp dụng cho các đơn của họ. Mã sai thì vẫn đăng ký bình thường, chỉ không có người giới thiệu.
- Nếu link có thêm `?game=...` (dùng cho Vui học) thì sau khi đăng ký người mới được đưa tới trò chơi đó; link không có thì tới trang giới thiệu anyLEARN (`/info`).

### Vui học: Sự kiện game và Điểm danh & quà

Menu "Vui học" có trang "Vui học"; "Tiền game", "Điểm danh & quà", "Sticker" và "Kho câu hỏi" mở bằng các nút ở góc phải trên của trang đó. Menu "Vui học" hiện số đỏ khi có gói quà sticker đang chờ bạn duyệt.

- **Sự kiện game**: danh sách mọi việc xảy ra trong các game (mở quà điểm danh, đăng ký qua link giới thiệu, và các game sau này), mới nhất ở trên, lọc theo game. Phía trên là số người chơi, số sự kiện, tiền game (Leo Xu) đã phát và số lượt đăng ký từ link giới thiệu trong ngày. Trang tự làm mới mỗi 30 giây.
- **Điểm danh & quà**: mỗi thành viên mở một quà mỗi ngày trên trang Vui học. Nhập số Leo Xu (tiền game, không phải anyPoint) cho từng ngày 1 đến 7 của chuỗi (ngày 7 là quà lớn; sau ngày 7 quay lại ngày 1). Bỏ một ngày thì chuỗi bắt đầu lại từ ngày 1. **Leo Xu phát ra là tiền game, chưa quy ra tiền thật, nhưng sau này có thể đổi được nên nên giữ trong tầm kiểm soát**, vì vậy có "Trần phát ra mỗi ngày" (0 = không giới hạn): khi chạm trần, người mở quà sau đó vẫn giữ chuỗi nhưng hôm đó không nhận Leo Xu. Trang hiện chi phí ước tính mỗi ngày để so với trần. Công tắc ở đầu trang tắt hẳn quà điểm danh. Thay đổi có hiệu lực ngay với lượt mở tiếp theo.

### Vui học: Kho câu hỏi (quiz leo rank)

Menu "Giải trí" > "Vui học" > nút "Kho câu hỏi" ở góc phải trên. Đây là kho câu hỏi cho quiz leo rank (trò chơi đã mở cho thành viên ở Vui học > Leo rank; kho cần đủ câu ở mọi chủ đề và mức khó mà các rank dùng).

- **Bảng số câu**: mỗi dòng là một chủ đề, mỗi cột là một mức độ khó (Rất dễ, Dễ, Vừa, Khó, Rất khó). Mỗi ô cho biết số câu đang dùng so với mục tiêu, số chờ duyệt, tỉ lệ trả lời đúng và tỉ lệ AI viết trùng trong 30 ngày. **Ô nào cũng cần đủ câu** vì mỗi rank lấy câu ở nhiều mức khác nhau. 300 mỗi ô là mục tiêu để AI bù tới, không phải trần, bạn đổi con số này ở phần Cấu hình.
- **Chủ đề**: bảng "Chủ đề" cho thêm, đổi tên, sắp thứ tự, ẩn chủ đề. Ô "Mô tả cho AI" nói chủ đề gồm những gì (ví dụ "lịch sử Việt Nam và thế giới: nhân vật, sự kiện, triều đại"), AI viết câu hỏi theo đúng mô tả đó, nên viết cụ thể. Ẩn một chủ đề thì không tạo thêm và không ra câu mới, câu cũ vẫn giữ. Mới đầu có 8 chủ đề: Nuôi dạy con, Tiếng Anh, Âm nhạc, Mỹ thuật, Khoa học, Lịch sử, Địa lý, Xã hội & đời sống.
- **Tỉ lệ độ khó theo rank**: mỗi rank bốc câu theo tỉ lệ riêng. Mặc định Đồng 100% Rất dễ; Bạc 80% Rất dễ và 20% Dễ; Vàng 30/50/20% (Rất dễ/Dễ/Vừa); lên cao dần tới Huyền thoại 10% Vừa, 30% Khó, 60% Rất khó. Sửa các ô rồi bấm "Lưu tỉ lệ"; mỗi dòng phải cộng đúng 100%. Rank nào dùng mức nào thì mức đó cần có câu.
- **Tạo thêm**: nút ở cuối mỗi dòng nhờ AI viết một lượt cho ô đó; nút "Đề xuất AI tạo thêm" ở trên cùng tạo cho các ô đang thiếu nhiều nhất. Mỗi lượt tốn tiền gọi AI. AI tự loại câu trùng với kho, rồi tự trả lời lại từng câu: câu AI chọn **khớp** đáp án đã viết có nhãn "AI chấm khớp", câu **lệch** bị ẩn sẵn, câu AI không chắc chờ bạn xem.
- **Cấu hình**: "Tự tạo mỗi đêm" (mặc định tắt vì tốn tiền; bật thì 2h20 sáng hệ thống tự bù cho ô thiếu nhất, tối đa số lần gọi đã đặt), mục tiêu mỗi ô, số câu mỗi lần gọi, và "Câu AI chấm khớp vào dùng ngay, không cần duyệt" (bật thì câu AI chấm khớp vào game luôn, không qua bạn; nên để tắt cho tới khi bạn duyệt tay vài chục câu mỗi ô và thấy chất lượng ổn).
- **Duyệt và quản lý**: mặc định hiện câu "Chờ duyệt". Đọc câu và đáp án (đáp án đúng màu xanh), bấm "Duyệt" hoặc tick nhiều câu rồi duyệt hàng loạt, "Ẩn" câu sai hoặc dở, "Sửa" để chỉnh chữ hay đổi đáp án đúng (câu sau khi sửa cần duyệt lại). Lọc theo trạng thái, chủ đề, độ khó, từ khóa hoặc "Chỉ câu bị báo lỗi".
- **Báo lỗi**: người chơi sẽ có nút báo câu sai; câu bị 3 người báo tự ẩn cho tới khi bạn xem lại (duyệt lại sẽ xóa các báo lỗi).
- Cần khóa `ANTHROPIC_API_KEY` và công tắc "Gợi ý AI" bật (dùng chung với gợi ý khóa học); thiếu thì trang báo màu vàng và không tạo được câu mới.

### Vui học: Leo rank (game quiz)

Thành viên vào Vui học > Leo rank: bấm "Sẵn sàng" để nhận một câu hỏi từ Kho câu hỏi, có 20 giây trả lời. Đúng thì +1 sao, sai thì -1 sao; đủ sao thì thanh đầy (ví dụ 5/5), trả lời đúng thêm một câu nữa mới lên hạng và vào hạng mới với 1 sao (Đồng 5 sao, Bạc 6, Vàng 7, Bạch kim 8, Kim cương 10, Thông thái 12, Siêu phàm 15, Huyền thoại không giới hạn). Thưởng lên hạng (xu, khiên, sticker) chỉ nhận một lần cho mỗi hạng, rớt xuống rồi lên lại không nhận nữa. Mất hết sao thì chưa rớt hạng ngay (hết bảo hộ), sai thêm lần nữa mới rớt xuống hạng dưới với số sao tối đa trừ 1 (ví dụ Bạc 1 sao: sai xuống 0 sao, sai tiếp về Đồng 4 sao). Đáp án được chấm trên máy chủ, rời màn hình hoặc hết giờ tính là sai.

**Bảng xếp hạng và tổng kết.** Trong Leo rank có nút "Bảng xếp hạng": Cùng hạng (theo sao), Tuần này và Tháng này (theo số sao tăng ròng trong kỳ, đúng cộng, sai trừ, dùng Khiên thì không tính), Mọi thời (theo hạng rồi sao). Tên trên bảng chỉ là hai từ cuối của tên thành viên, không có điện thoại hay email, và thành viên có thể tự bấm "Ẩn tôi khỏi bảng". Câu bị gắn cờ không được cộng vào bảng tuần và tháng.

Vào menu "Vui học" > "Vui học" > nút "Quiz Leo rank" (số đỏ ở "Vui học" là số câu bị gắn cờ trong 14 ngày) để:
- **Tổng quan**: số người chơi, phân bố hạng, tỉ lệ đúng theo chủ đề 30 ngày.
- **Bảng xếp hạng**: xem bảng như người chơi thấy.
- **Tổng kết & thưởng**: top 3 mỗi tuần (thứ Hai 00:05) và mỗi tháng (ngày 1, 00:10) nhận vật phẩm ngẫu nhiên, tháng thêm một sticker, thông báo cho người trúng. Tự động khi bật "Tự động tổng kết", hoặc bấm "Trao thưởng" cho một kỳ đã kết thúc (mỗi kỳ chỉ trao một lần, người bị ẩn hoặc bị chặn không nhận).
- **Gắn cờ**: câu trả lời đúng dưới 1,5 giây hoặc rời trang. "Bỏ cờ" khi thấy bình thường, "Chặn BXH" để người đó không lên bảng và không nhận thưởng. Hệ thống không tự cấm ai.
- **Cấu hình**: bật tắt game, số sao mỗi hạng, giây trả lời, xu thưởng lên hạng, tỉ lệ rơi, giá và tỉ trọng từng vật phẩm, thưởng top 3 (ví dụ 3,2,1 là hạng nhất nhận 3 vật phẩm). Lưu xong có hiệu lực từ câu kế tiếp, không cần khởi động lại.

- **Vật phẩm**: Sao may mắn x2/x3, Khiên bảo hộ, Chọn chủ đề (dùng trước câu); 50:50, Hỏi cộng đồng, Thêm 15 giây, Đổi câu (dùng trong câu, mỗi loại một lần mỗi câu). Nhận từ hộp quà khởi động mỗi ngày (luôn 1 món trước câu và 1 món trong câu), rơi ngẫu nhiên sau mỗi câu (khoảng 12%, tăng dần nếu lâu không rơi, đúng liên tiếp 3, 6, 9... câu thì chắc chắn rơi, tối đa 8 món rơi mỗi ngày), thưởng lên hạng (1 Khiên), hoặc **mua bằng Leo Xu** (giá 15 đến 60, tối đa 5 món mỗi ngày). Kho mỗi loại có trần (Sao x3 tối đa 3, Khiên 5, loại khác 10).
- **Thưởng lên hạng**: 20 Leo Xu, 1 Khiên và 1 sticker ngẫu nhiên. Không cộng tiền theo từng câu. Mọi thưởng và giá đều bằng Leo Xu, không phải anyPoint; mua vật phẩm và thưởng hiện trong "Tiền game" với nguồn "quiz_item" và "quiz_rank".
- **Câu không lặp**: một người không gặp lại câu đã làm trong 30 ngày; hết câu mới thì game nới độ khó, cuối cùng mới lặp lại câu cũ, nên kho cạn sẽ không làm game dừng nhưng người chơi thấy câu cũ.
- **Cài đặt (chưa có trang riêng, trang cấu hình sẽ có ở giai đoạn 5)**: mọi con số là dòng `quiz/...` trong bảng `configurations` và đã có mặc định, không cần nhập gì: `quiz/game_enabled` (0 = tắt game), `quiz/seconds` (20), `quiz/extra_seconds` (15), `quiz/rank_stars` (danh sách 7 số, ví dụ `5,6,7,8,10,12,15`), `quiz/rank_reward_coins` (20), `quiz/drop_base` (12), `quiz/drop_pity_step` (4), `quiz/drop_pity_max` (12), `quiz/drop_wrong_bonus` (8), `quiz/drop_daily_cap` (8), `quiz/streak_every` (3), `quiz/buy_daily_cap` (5), `quiz/price_{mult2|mult3|shield|topic|fifty|community|time|swap}`, `quiz/weight_{...}` (tỉ lệ rơi từng loại), `quiz/no_repeat_days` (30). Tỉ lệ độ khó theo rank vẫn chỉnh ở Kho câu hỏi. Công tắc `fun/enabled` tắt cả Vui học.
- Chưa có: bảng xếp hạng, tổng kết tuần/tháng, danh sách người bị gắn cờ trong admin (hệ thống đã ghi cờ khi trả lời quá nhanh hoặc rời màn hình, sẽ hiện ở giai đoạn 5).

### Vui học: Sticker

Menu "Giải trí" > "Vui học" > nút "Sticker". Người chơi sưu tầm sticker trên trang Vui học > Sticker: nhận khi điểm danh, nhận gói quà khi được bạn mời, và đổi với bạn bè.

- **Bộ sưu tập**: sticker được chia thành nhiều bộ (ví dụ "Leo ham học", "Leo vui chơi"), mỗi bộ có số sticker tùy bạn (12 hoặc nhiều hơn). Ở đầu tab "Bộ sticker" có khung "Bộ sưu tập": thêm bộ (tên, mô tả, hình hoặc emoji, thứ tự), sửa, xóa (chỉ xóa được bộ không còn sticker). Mỗi bộ có **thưởng đủ bộ riêng** (Leo Xu); để trống thì dùng mức mặc định ở tab Cấu hình, 0 là không thưởng. Người chơi nhận thưởng một lần cho mỗi bộ. Tắt một bộ thì sticker của bộ không rơi nữa và không tính vào thưởng, ai đã có vẫn giữ và vẫn đổi được. Khi thêm hoặc sửa sticker phải chọn bộ; bảng sticker lọc được theo bộ. Trên trang Sticker của người chơi, các bộ hiện thành thẻ chuyển qua lại kèm tiến độ từng bộ; chỉ có một bộ thì không hiện thẻ. Đổi sticker vẫn theo luật cùng độ hiếm, và đổi được giữa các bộ với nhau.
- **Bộ sticker**: mỗi sticker có tên, nội dung ngắn, hình (PNG vuông nền trong, tải lên) hoặc emoji khi chưa có hình, độ hiếm (Thường, Hiếm, Siêu hiếm), tỉ lệ rơi (trọng số, cột "Tỉ lệ rơi" cho thấy phần trăm thật trong các sticker đang dùng) và công tắc "Đang dùng". Có sẵn 12 sticker mẫu dùng emoji; hãy thay bằng hình thật. Tắt một sticker thì không rơi nữa nhưng ai đã có vẫn giữ. Thêm sticker mới làm bộ dài ra, người đã đủ bộ phải sưu tầm thêm.
- **Cách sticker rơi**: quà điểm danh ngày 7 của chuỗi luôn có 1 sticker (tắt được trong Cấu hình); ngày thường có sticker theo tỉ lệ phần trăm bạn đặt. Gói quà cho người được mời không bao giờ có sticker Siêu hiếm.
- **Luật đổi** (người chơi thấy trên trang Sticker): chỉ đổi 1 lấy 1, **cùng độ hiếm**, sticker mình trùng lấy sticker mình thiếu. Hai người chỉ đổi với nhau 1 lần trong 30 ngày, mỗi người tối đa 3 lần mỗi tuần và 10 người khác nhau mỗi tháng. Bên nhận phải bấm đồng ý. Sticker nhận từ gói quà bị khóa đổi 7 ngày. Mọi con số sửa được ở tab Cấu hình.
- **Gói quà 3 sticker**: người đăng ký qua link giới thiệu nhận 1 sticker thường ngay, và 2 sticker nữa (tối đa 1 hiếm, tỉ lệ đặt ở Cấu hình) sau khi điểm danh ngày thứ 2. Người mời nhận 1 sticker khi người mới đủ điều kiện (tài khoản từ 3 ngày và điểm danh đủ 3 ngày, sửa được), tối đa 10 lượt mỗi tháng. Thưởng đủ bộ (mặc định 200 Leo Xu cho bộ không đặt mức riêng, 0 = tắt) trao một lần cho mỗi người, mỗi bộ, người đó phải đủ điều kiện, và sticker còn đang bị khóa không tính vào đủ bộ.
- **Chống nhiều tài khoản**: ứng dụng gửi một mã ngẫu nhiên của trình duyệt. Hệ thống cộng điểm rủi ro khi nhiều tài khoản chung thiết bị, chung IP trong 24 giờ, cùng người mời đăng ký sát nhau, hoặc chỉ đổi với đúng một người rồi bỏ đi. **Hệ thống không tự khóa ai.** Điểm từ ngưỡng (mặc định 50) thì gói quà đợt 2 vào tab "Chờ duyệt & rủi ro": bạn xem rồi bấm Duyệt hoặc Hủy. Ở tab Thành viên bạn có thể Khóa (người đó không đổi được và quà luôn phải duyệt), Bỏ qua cảnh báo, hoặc Về tự động.
- **Chợ đổi sticker (tab "Chợ đổi")**: người chơi đăng tin "Mình có a, b, c, cần x" ở Vui học > Sticker > Chợ đổi sticker (tối đa 3 sticker trùng cùng độ hiếm với sticker cần, sticker cần phải là sticker họ chưa có). **Sticker đã rao bị khóa**: không đổi, không đưa vào lời mời khác, không đăng thêm tin khác cho tới khi gỡ tin, tin hết hạn hoặc có người đổi. Người khác bấm "Đổi", chọn một trong các sticker còn thiếu và đưa sticker họ trùng mà người đăng cần; hệ thống kiểm lại mọi luật đổi (đủ điều kiện, giới hạn tuần, cặp, tháng) như khi nhận lời mời, rồi đổi ngay và báo cho người đăng. Chợ không dùng xu. Tab liệt kê mọi tin (lọc theo trạng thái Đang rao / Đã đổi / Đã gỡ / Hết hạn) kèm nút **Gỡ** để mở khóa sticker khi cần (ví dụ tin của tài khoản bị nghi gian lận). Lượt đổi qua chợ cũng hiện ở tab "Giao dịch đổi" và hủy được ở đó. Ở tab Cấu hình chỉnh "số tin mở tối đa mỗi người" (mặc định 3) và "tin hết hạn sau" (mặc định 7 ngày).
- **Album người chơi**: sticker chưa sưu tầm hiện dấu "?" (ẩn hình và tên), sticker đã có hiện to hơn với hiệu ứng độ hiếm rộng hơn. Ảnh Leo đã được tách nền: dùng thư mục `assets/sticker_leo_set_1/transparent/` khi tải hình sticker lên (ảnh gốc có nền trắng).
- **Thành viên**: tìm theo tên hoặc số điện thoại để xem album, tặng thêm hoặc thu hồi một bản. **Giao dịch đổi** liệt kê mọi lượt đổi và nút Hủy trả lại sticker cho hai bên (không hủy được nếu một người đã không còn sticker vừa nhận); phía trên cảnh báo các cặp đổi nhiều lần. Mọi việc ghi vào "Vui học" (game Sticker).

### Vui học: Tiền game (Leo Xu)

Menu "Giải trí" > "Vui học" > nút "Tiền game". Các game dùng **một đồng tiền riêng, mặc định tên "Leo Xu"**, không phải anyPoint: nó không đụng ví anyPoint, không tạo giao dịch ví và không gửi thông báo anyPoint. Lý do là anyPoint gắn với tiền thật nên thưởng game bằng anyPoint dễ làm lệch cân đối tài chính và vướng pháp lý. Việc đổi Leo Xu sang anyPoint hoặc quà sẽ thiết kế sau.

- **Tên đồng tiền**: đổi ở ô "Tên đồng tiền" (tối đa 20 ký tự); hiện ngay ở mọi màn hình của game. Số dư không đổi khi đổi tên.
- **Số liệu**: Leo Xu đang lưu hành, số người đang giữ, phát ra hôm nay và 7 ngày qua, chia theo nguồn (điểm danh, đủ bộ sticker, admin điều chỉnh), 10 người giữ nhiều nhất.
- **Điều chỉnh một thành viên**: tìm theo tên hoặc số điện thoại, nhập số dương để cộng hoặc số âm để trừ và **bắt buộc ghi lý do** (lưu vào lịch sử và Sự kiện game). Mỗi lần tối đa 1.000.000; không trừ quá số dư.
- **Lịch sử**: mọi lần cộng trừ đều có một dòng (ai, bao nhiêu, nguồn, số dư sau đó), xem chung hoặc theo từng thành viên.
- Mức thưởng điểm danh và thưởng đủ bộ sticker (đơn vị Leo Xu) chỉnh ở "Điểm danh & quà" và "Sticker" > Cấu hình.

### Vui học: Banner thành tích

Menu "Giải trí" > "Vui học" > nút "Banner thành tích". Khi người chơi **lên hạng Leo rank lần đầu, đạt mốc chuỗi điểm danh, đứng top 3 tuần hoặc tháng, hoặc đủ một bộ sticker**, hệ thống tạo một banner (ảnh dọc có mã QR) và gửi thông báo "Bạn có banner thành tích". Họ bấm vào để chia sẻ qua Zalo, Messenger, lưu ảnh hoặc chép liên kết; người nhận mở trang chia sẻ và bấm "Cùng chơi" để đăng ký qua link giới thiệu của người đó.

- **Cấu hình**: công tắc chung, công tắc riêng từng loại và các mốc chuỗi điểm danh (mặc định 7, 14, 30, 60, 100 ngày). Mỗi người chỉ có một banner cho mỗi thành tích (ví dụ mỗi hạng một lần).
- **Hiệu quả**: banner đã tạo, lượt bấm chia sẻ, lượt mở trang chia sẻ, số người đăng ký đến từ banner và số người đã chơi sau khi đăng ký. Bảng "Banner gần đây" cho thấy từng banner.
- Tên trên banner chỉ gồm hai từ cuối của tên người chơi, không có số điện thoại. Banner dùng địa chỉ trang web trong biến `NEXT_PUBLIC_SITE_URL` (mặc định https://anylearn.vn) cho mã QR.
- Người dùng có thể tắt thông báo banner ở "Tài khoản > Thông báo > Vui học".

### Vui học: ví Leo Xu và sticker (cập nhật)

- Trang Vui học chỉ hiện số dư Leo Xu; bấm vào thẻ ví để xem **lịch sử có phân trang** (20 dòng một trang).
- Sticker rơi (điểm danh, lên hạng, tổng kết) **chọn bộ đều nhau trước**, rồi mới chọn sticker trong bộ theo tỉ lệ rơi, nên nhiều bộ vẫn được phát đều.
- Nếu bạn sửa trực tiếp bảng cấp sticker trong cơ sở dữ liệu, album của người chơi tự cân lại số bản khi họ mở trang Sticker. Nút đổi chỉ hiện khi người chơi có **sticker trùng**.

### Vui học: Khám phá

Menu "Giải trí" > "Khám phá" (số đỏ = bình luận bị báo cáo chờ xử lý). Muốn có bài mẫu để thử, chạy `scripts/seed_explore_demo.sql` (chỉ dữ liệu thử). Người chơi vào Vui học > Khám phá để lướt từng bài toàn màn hình, thích, bình luận, chia sẻ; nút ✕ trên cùng để quay về.

- **Bài viết**: bấm "+ Bài mới". Có 3 loại: **bài viết** (chỉ chữ), **hình ảnh** (tải hình lên hoặc dán đường dẫn https) và **clip** (dán đường dẫn YouTube hoặc file mp4; hình đại diện không bắt buộc). Có thể **gắn một khóa học** (nhập mã khóa học) để người xem bấm "Xem khóa học". Bài mới ở **Nháp**; chọn **Đang hiện** để người chơi thấy, **Ẩn** để gỡ mà không xóa. **Ghim** đưa bài lên đầu. Bài xếp theo ghim rồi mới nhất.
- **Số liệu** trên đầu trang và từng dòng: lượt xem (mỗi người một lần mỗi lần mở), thích, chia sẻ, bình luận.
- **Bình luận**: mặc định xem tab "Bị báo cáo" (kèm lý do). **Ẩn** bình luận sẽ đóng các báo cáo của nó; **Giữ lại** đóng báo cáo và giữ bình luận; **Khóa bình luận người này** chặn người đó viết tiếp (mở khóa cùng nút đó). Người viết chỉ hiện hai từ cuối của tên.
- **Cấu hình**: bật / tắt cả Khám phá, bật / tắt riêng bình luận, số bình luận tối đa mỗi phút (mặc định 5) và danh sách từ bị chặn (không phân biệt dấu, hoa thường).
- Liên kết chia sẻ một bài mở trình lướt đúng bài đó, người nhận cần đăng nhập.

### Vui học: mở dần từng game và theo dõi sức khỏe

Menu "Giải trí" > "Vui học", kéo xuống hai khối cuối trang.

- **Mở dần từng game**: mỗi game (Điểm danh, Quiz Leo rank, Sticker, Khám phá) có 3 chế độ: **Mở cho mọi người**, **Chỉ nhóm thử** (chỉ các số điện thoại trong danh sách bên dưới và admin dùng được, người khác không thấy game trên trang Vui học và các lệnh gọi bị từ chối) và **Đóng** (chỉ admin). Nên mở theo thứ tự: nhóm thử vài chục người, xem "Sức khỏe game" vài ngày, rồi mở cho mọi người. Công tắc bật tắt riêng của từng game vẫn còn ở trang cấu hình của game đó.
- **Trần Leo Xu mỗi ngày**: số Leo Xu tối đa một người nhận được từ game trong một ngày (điểm danh, thưởng lên hạng, đủ bộ sticker...), 0 là không giới hạn. Phần vượt trần không được cộng. Điều chỉnh tay của admin không bị cắt. Dùng khi nghi có người cày hoặc dùng nhiều tài khoản.
- **Sức khỏe game, 7 ngày qua**: Leo Xu phát ra và đã tiêu (theo nguồn), số người chơi từng game, tỉ lệ trả lời đúng của quiz, tỉ lệ vật phẩm rơi trên mỗi câu đúng, số câu bị gắn cờ và người bị gắn cờ nhiều nhất, tài khoản rủi ro và gói quà chờ duyệt, số người chạm trần hôm nay. Cách đọc để chỉnh: tỉ lệ đúng quá cao (trên 80%) thì tăng độ khó ở "Kho câu hỏi" > tỉ lệ độ khó mỗi hạng; Leo Xu phát ra nhiều hơn nhiều lần so với tiêu thì giảm thưởng hoặc thêm vật phẩm bán trong shop; vật phẩm rơi quá nhiều thì giảm tỉ lệ rơi ở Cấu hình quiz.

### Vui học: nhiệm vụ tuần, vật phẩm điểm danh, thưởng chia sẻ và mời bạn, video Khám phá (plan 15)

- **Nhiệm vụ tuần** (menu "Giải trí" > "Vui học", khối "Nhiệm vụ tuần" nằm dưới bảng sự kiện): 6 nhiệm vụ cố định (điểm danh 5 ngày, trả lời đúng 20 câu Leo rank, tập luyện 10 câu, xem 5 bài Khám phá, đổi hoặc bán 1 sticker trùng, chia sẻ 1 thành tích). Mỗi nhiệm vụ chỉnh được **mục tiêu**, **thưởng Leo Xu** và công tắc **bật**. Làm xong **đủ số nhiệm vụ** (mặc định 5) thì người chơi nhận thêm **1 sticker miễn phí** của tuần. Tuần tính từ thứ Hai 00:00 đến Chủ nhật (giờ Việt Nam). Tiến độ đếm từ nhật ký sự kiện game, người chơi bấm "Nhận" cho từng nhiệm vụ, mỗi nhiệm vụ một lần mỗi tuần. Đổi số giữa tuần có hiệu lực ngay, phần đã nhận không bị thu lại. Nhiệm vụ đi theo chế độ mở của game **Điểm danh** ("Mở dần từng game"). Dòng "Tối đa mỗi người mỗi tuần" cho biết ngân sách Leo Xu lớn nhất của nhiệm vụ (chưa tính sticker).
- **Vật phẩm điểm danh** ("Điểm danh & quà" > "Ngày tặng vật phẩm Leo rank"): mặc định ngày **3 và 5** của chuỗi, mở quà điểm danh xong người chơi nhận thêm 1 vật phẩm Leo rank ngẫu nhiên (theo tỉ trọng rơi, không vượt trần mỗi loại). Nhập `0` để tắt.
- **Thưởng chia sẻ** ("Banner thành tích"): chia sẻ một banner **lần đầu** được 10 Leo Xu (mỗi banner một lần), tối đa 2 lần được thưởng mỗi ngày. Hai số chỉnh ở cùng trang (đặt 0 để tắt).
- **Thưởng mời bạn** ("Sticker" > Cấu hình > "Leo Xu người mời nhận thêm"): cùng lúc người mời nhận sticker (khi bạn được mời đủ điều kiện, trong trần mỗi tháng) họ nhận thêm 50 Leo Xu. Đặt 0 để tắt.
- **Video Khám phá bằng Bunny Stream**: khi server có 3 biến `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST`, form bài loại **Clip** có nút **Tải video lên**. Chọn file, thanh tiến trình chạy, xong thì ô đường dẫn clip và hình đại diện tự điền (đường dẫn dạng `.m3u8`). File đi thẳng từ trình duyệt lên Bunny, không qua server; Bunny cần vài phút để xử lý trước khi phát được, nên để bài ở Nháp ít phút rồi mới chọn Đang hiện. Chưa cấu hình ba biến này thì nút không hiện và bạn vẫn dán link YouTube hoặc mp4 như cũ. Cách tạo tài khoản: tạo một "Video Library" trên Bunny, lấy Library ID, API key của thư viện và host của pull zone (dạng `vz-xxxx.b-cdn.net`).
- **Leo trong Leo rank**: Leo nhỏ có bong bóng thoại ở sảnh (gần lên hạng, sắp hết năng lượng, có hộp quà, đang tập luyện) và ở màn hình kết quả (đúng, sai, chuỗi đúng 3 câu trở lên, lên hạng, mất sao, khiên cứu, rớt hạng). Lời thoại nằm trong code, không chỉnh ở back office.

### Vui học: Cửa hàng Leo Xu, năng lượng và gói tập luyện (kế hoạch 15, phần A)

Menu "Giải trí" > "Vui học" > nút "Cửa hàng Leo Xu". Người chơi thấy trang **Cửa hàng Leo Xu** (thẻ ví trên trang Vui học) với 3 tab: **Mua**, **Bán**, **Lịch sử** (sổ Leo Xu, link cũ `/fun/coins` tự chuyển về đây). Trong Leo rank có cửa hàng nhỏ (vật phẩm và gói tập luyện), trang Sticker có lối tắt mua rương. Mọi nơi dùng **một danh mục**, nên đổi giá ở đây là các chỗ khớp ngay.

- **Món bán**: 8 vật phẩm Leo rank (giá vẫn là giá ở trang Quiz Leo rank, hai trang sửa cùng một số), **gói tập luyện** (mặc định 10 câu; theo cấp độ Rất dễ đến Rất khó giá 5, 7, 9, 12, 15; theo chủ đề mọi cấp 10; chủ đề + cấp tính theo giá cấp), **nạp năng lượng** (+10 năng lượng, 10 Leo Xu, tối đa 3 lần mỗi ngày, không vượt mức tối đa), **rương sticker thường** (30, 1 sticker theo tỉ lệ rơi, tối đa 3 mỗi ngày) và **rương hiếm** (90, chắc chắn hiếm hoặc siêu hiếm, tối đa 1 mỗi ngày).
- **Bán lại cho Leo**: sticker trùng (thường 3, hiếm 10, siêu hiếm 30; chỉ bản trùng không bị khóa, luôn giữ lại 1 bản; tối đa 10 lần mỗi ngày) và vật phẩm Leo rank (30% giá mua, làm tròn xuống, tối thiểu 1, tối đa 5 lần mỗi ngày). Giá bán thấp hơn giá mua nhiều nên không có cách kiếm lời bằng mua rồi bán.
- **Mọi giá, giới hạn mỗi ngày và công tắc từng món** sửa ở trang này (giá trị 0 ở công tắc là ngừng bán món đó; công tắc "Cửa hàng" tắt cả trang). Giới hạn 0 nghĩa là hôm nay không ai mua được món đó.
- **Năng lượng** (khối "Năng lượng" của trang): tối đa 30, hồi 1 mỗi 5 phút, mỗi câu **leo rank** tốn 1 (đổi câu bằng vật phẩm không tốn thêm). Hết năng lượng người chơi thấy "Hết năng lượng, hồi 1 sau mm:ss" và có thể nạp bằng Leo Xu. Tập luyện không tốn năng lượng.
- **Gói tập luyện**: người chơi mua gói rồi vào Leo rank, mục "Gói tập luyện của tôi", chọn chủ đề (gói theo cấp độ chọn được nhiều chủ đề, các gói khác một chủ đề) và bấm Lưu để dùng; nút "Sẵn sàng" đổi thành "Tập luyện". Mỗi câu phát ra trừ 1 lượt. Câu tập luyện **không tính sao, không rơi vật phẩm, không vào bảng xếp hạng, không dùng vật phẩm** và hiện đáp án đúng sau khi trả lời. Số câu mỗi gói sửa ở "Số câu của một gói tập luyện". Gói cần có câu hỏi trong Kho câu hỏi; chủ đề hoặc cấp chưa có câu hỏi thì hệ thống nới sang cấp gần nhất (chủ đề thì không đổi).
- Cách đọc để chỉnh: xem "Sức khỏe game" (Leo Xu phát ra / đã tiêu theo nguồn: nguồn mới là Mua gói tập luyện, Nạp năng lượng, Mua rương sticker, Bán cho Leo). Tiêu quá ít thì giảm giá hoặc thêm món; người chơi tiêu hết liên tục thì tăng giá nạp năng lượng hoặc giảm giới hạn mỗi ngày.
- Sự kiện mới trong "Sự kiện game": `buy_pack`, `buy_energy`, `sell_item` (Leo rank), `practice` (mỗi câu tập luyện), `chest` và `sell` (sticker).

### Cài đặt Bunny Stream để tải video lên Khám phá (làm một lần)

Bunny Stream là dịch vụ lưu và phát video. Khi cài xong, form bài loại **Clip** có nút **Tải video lên**. Chưa cài thì vẫn đăng clip bằng cách dán link YouTube hoặc link mp4.

1. Vào bunny.net, đăng ký tài khoản và nạp một ít tiền (vài USD là đủ để thử).
2. Menu **Stream** > **Add Video Library**. Đặt tên (ví dụ `anylearn`), chọn vùng lưu gần Việt Nam (Singapore), bấm Add.
3. Mở library vừa tạo, tab **API**. Copy ba giá trị:
   - **Library ID**: dãy số ở đầu trang hoặc trong đường dẫn.
   - **API Key**: khóa của riêng library này (không phải khóa tài khoản).
   - **CDN Hostname**: ở tab Delivery, dạng `vz-xxxxxxxx-xxx.b-cdn.net`.
4. Trên GitHub, vào repo > Settings > Secrets and variables > Actions, tạo 3 secret: `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST` với ba giá trị trên.
5. Chạy deploy lại. Sau khi deploy, mở Khám phá > **+ Đăng clip**: nút Tải video lên đã hiện.
6. Tải thử một video ngắn, chờ vài phút cho Bunny xử lý, rồi chuyển bài sang Đang hiện.

Nếu nút vẫn không hiện: kiểm tra đủ cả 3 secret và không có ô nào để trống.
