# Plan 16: Creator đăng bài Khám phá

Mục tiêu: ngoài admin, một nhóm người dùng được chọn (creator) cũng đăng bài Khám phá từ trang `/fun`; người xem tìm bài và lướt dạng lưới.

## 16.1 Creator (back office)

- Bảng `explore_creators` (user_id, `level` = `creator` | `s_creator`, ghi chú, người thêm, ngày thêm).
- Back office "Khám phá" > tab "Creator": tìm thành viên theo tên / SĐT / email để thêm, đổi loại, gỡ.
- `creator`: bài mới hoặc bài sửa phải chờ admin duyệt. `s_creator`: tự đăng, không cần duyệt (admin vẫn ẩn được).

## 16.2 Trạng thái bài của creator

- `explore_posts.author_id` (NULL = bài của anyLEARN/admin), trạng thái thêm `pending` (chờ duyệt) và `rejected` (bị từ chối, có lý do), `hidden_by` (`creator` | `admin`) + `review_note`.
- Creator lưu bài: s-creator → `published`; creator → `pending`. Clip đang tải: bài ở `draft` với cờ `submit_after_upload`, tải xong mới chuyển sang `pending`/`published` (và lúc đó mới báo admin).
- Creator ẩn bài → `hidden` (hidden_by creator). Hiện lại: s-creator → `published`; creator → `published` nếu nội dung đã được duyệt và chưa sửa, ngược lại `pending`. Bài admin ẩn hoặc từ chối: "Hiện" = gửi duyệt lại.
- Xóa chỉ khi bài đang ẩn / bị từ chối / nháp.
- Thông báo: creator gửi bài (hoặc gửi lại) → mọi người nhận thông báo admin (`findAdminNotificationRecipients`). Admin duyệt / từ chối / ẩn / hiện / sửa / xóa bài của creator → creator nhận thông báo, route `/fun/explore/mine`.

## 16.3 Tags và khóa học gắn kèm

- **Dùng chung từ điển `tags` với khóa học** (bảng nối `explore_post_tags`). Lý do: cùng một chữ "Tiếng Anh" thì clip và khóa học nối được với nhau, để (a) dưới clip gợi ý khóa học cùng tag, (b) người đã mua / thích khóa học tag X thì được ưu tiên clip tag X. Creator chỉ chọn tag có sẵn (gõ để tìm); tag mới vẫn do admin tạo ở trang Tags (giữ từ điển sạch).
- Gắn khóa học: ô tìm khóa học (dùng tìm kiếm công khai), hiện gọn 1 thẻ (ảnh nhỏ, tên, giá, nút ×), thay cho ô nhập mã.

## 16.4 Tìm kiếm và lưới trên `/fun`

- Index Meilisearch `explore_posts`: `title`, `body`, `tagNames` (tìm được), lọc theo `status`, `kind`, `authorId`, `tagIds`; sắp theo `publishedAt`, `likes`. Ghi index mỗi lần lưu / đổi trạng thái; dựng lại cùng lúc 5h sáng và nút reindex. Meili lỗi thì rơi về SQL `LIKE`.
- `/fun`: dưới thẻ Khám phá có ô tìm + lưới 3 cột (ô chữ nhật 9:16 như TikTok), 12 bài mỗi lần, cuộn xuống tự tải thêm. Không gõ gì = lưới theo gợi ý (16.6). Nhấn một ô mở trình xem toàn màn hình bắt đầu từ bài đó và lướt tiếp trong cùng danh sách (kết quả tìm hoặc gợi ý).
- Creator thấy nút "Bài đăng của tôi" dưới ô tìm.

## 16.5 Trang của creator

- `/fun/explore/mine` (nút back): lưới 3 cột bài của mình, nhãn trạng thái (Chờ duyệt / Bị từ chối / Đã ẩn), nút "Đăng bài mới" dính cạnh dưới.
- Nhấn ô: bài đang hiện → Xem / Sửa / Ẩn; bài đang ẩn → Hiện / Sửa / Xóa.
- `/fun/explore/compose[?id=]` (nút back): form như admin (loại bài, tiêu đề, mô tả, hình hoặc video, ảnh bìa, tags, khóa học).
- Lưu: đóng form, về trang của tôi; ô đầu tiên nền xám với vòng tròn % tải; tải xong hiện ảnh bìa và toast "Đã tải xong". Việc tải chạy ngoài trang (đổi trang trong app vẫn tiếp tục, đóng tab thì dừng).

## 16.6 Không trùng bài, đúng nhu cầu

- `explore_seen` (user, post, lần đầu, lần cuối, số lần): mỗi lần mở bài ghi lại.
- Thứ tự gợi ý: bài ghim chưa xem → bài **chưa xem** trước, bài đã xem xuống cuối; trong mỗi nhóm xếp theo điểm = độ hợp tag + độ mới + tương tác (thích, bình luận, chia sẻ trên lượt xem).
- Độ hợp tag của một người = tag của các bài họ đã thích + tag của khóa học họ đã mua, đang trong giỏ hoặc đã thích.
- Thứ tự ổn định trong một lượt lướt: trình duyệt gửi `since` (lúc mở), bài xem sau mốc đó không làm xáo trang sau.
- Làm sau: ghi thời gian xem (lướt qua nhanh = không thích), tuổi của bé trên bài, "người thích bài này cũng thích".
