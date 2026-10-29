# Plan 19: Marketing kéo khách về site và tool video AI (t2m)

Mục tiêu: đưa phụ huynh từ Google, Facebook và các mạng xã hội khác về anyLEARN, giữ họ quay lại bằng Vui học / Khám phá, rồi chuyển thành đơn. Nội dung (video 60s, ảnh chế, bài viết) do tool **t2m** (repo `iamcot/t2m`) làm bằng AI, người duyệt trước khi đăng.

Bản phác thảo đã duyệt cùng chủ sản phẩm (có lịch sử comment): https://claude.ai/artifact/BHN5TKNSfbUupXumdfE9r9. File này là bản để thực thi; tiến độ ở `plans/PROGRESS.md` (Giai đoạn 5).

## 0. Hiện trạng (đọc từ code, 29/10/2026)

- anylearn_v2 **chưa có** `app/sitemap.ts` và `app/robots.ts`. Trang khóa học `/class/[id]/[slug]`, bài viết `/article/[id]/[slug]`, đối tác `/partner/[id]`, bộ sưu tập, lộ trình đã render phía server và có OG (`lib/seo/shareMeta.ts`).
- Khám phá: `/api/explore*` bắt đăng nhập, trình xem là `/fun/explore?p=ID`; người lạ mở link chia sẻ không xem được. Creator (`explore_creators`, level `creator` = bài chờ duyệt) và tải clip Bunny TUS đã có (plan 16, 15.9).
- Đã có dữ liệu cho nội dung: `search_logs`, `course_requests`, "Xu hướng nhu cầu", `quiz_questions` + `quiz_topics`, `collections`, review, `arena_*`, `referral_events`, link giới thiệu `/ref/{code}` và `/fun?ref=`.
- Back office chỉ cho role `admin` đăng nhập.
- Repo t2m trống.

## 1. Đã chốt với chủ sản phẩm (29/10/2026)

1. Link Khám phá chia sẻ ra ngoài làm như Facebook: xem được video đó không cần đăng nhập, xem tiếp / thích / bình luận thì phải đăng nhập hoặc đăng ký. Link nằm trong `/fun`: `/fun/explore/{id}/{slug}`, không redirect; link cũ `?p=ID` chuyển 301.
2. Dạng nội dung: đố vui, khoa học, lịch sử, STEM, trí tuệ dân gian, bé tuổi nào học gì, bộ sưu tập mùa, mẹo nuôi dạy, gặp đối tác, kết quả Đấu trường; thêm ảnh chế / meme / truyện nhiều khung có cái kết hài, cảm động hoặc bất ngờ.
3. t2m chạy trên Mac M5 48 GB của chủ sản phẩm. Bước AI chọn được `--ai api | claude-code` (Claude Code `claude -p` dùng gói Claude đang có).
4. Người duyệt: quản trị viên hoặc người được phân quyền. Bước duyệt chính nằm trong back office (trang Khám phá đã có), nên cần quyền "Duyệt nội dung".
5. Ngân sách: có, nhưng ưu tiên gói tiết kiệm (TTS chạy tại máy thử trước, ảnh / nhạc miễn phí, quảng cáo chỉ boost video đã chạy tốt, có trần ngày).
6. Giọng đọc đổi theo video: khoa học trầm ấm, hài thì giọng trẻ nhí nhảnh; mỗi template có hồ sơ giọng.
7. Đã có fanpage Facebook và Zalo OA; TikTok và YouTube sẽ tạo (YouTube Brand Account, TikTok Business, chung một tên).
8. Thành phố làm trước: TP Hồ Chí Minh.
9. Làm song song phần anyLEARN và phần t2m.
10. UTM lưu vào database của mình (nguồn đầu tiên của mỗi tài khoản).
11. Hoàn tiền: đăng ký mà lớp không mở thì được hoàn tiền. Chỉ nói đúng câu này trong nội dung, không hứa thêm.

## 2. Phần A: anyLEARN (repo này)

### 19.A1 Sitemap và robots

- `app/sitemap.ts`: khóa học hiển thị (`ItemVisibility`), đối tác live, bài viết, bộ sưu tập đang hiện, lộ trình, bài Khám phá `published`, trang đích (19.A7). `lastmod` = ngày sửa. Chia nhiều file khi quá 50.000 link. Backend: một endpoint gọn trả `{type, id, slug, updatedAt}` (ví dụ `GET /api/seo/sitemap?type=`), cache 1 giờ.
- `app/robots.ts`: chặn `/account`, `/checkout`, `/order`, `/today`, `/compare`, `/add2cart`, `/learn`; trỏ tới sitemap.
- Nộp Search Console và Bing **một lần**; khóa mới tự vào sitemap. Tùy chọn: gửi IndexNow (Bing) khi một khóa vừa thành live (cùng chỗ `FollowService.announceIfNewlyOpen`).

### 19.A2 Dữ liệu có cấu trúc (JSON-LD)

- `Course` + `AggregateRating` (review đang hiện) trên trang khóa học; `EducationalOrganization` / `LocalBusiness` cho đối tác có địa chỉ (`user_locations` có tọa độ); `VideoObject` cho bài Khám phá; `BreadcrumbList`; `FAQPage` cho `/info/why-anylearn` (`WHY_FAQ`).
- Một helper `lib/seo/jsonLd.ts`, pure, có test.

### 19.A3 Trang công khai bài Khám phá

- Route `/fun/explore/[id]/[slug]` render phía server: video / ảnh / bài, tiêu đề, mô tả, tag, thẻ khóa học gắn kèm, lượt thích và vài bình luận chỉ đọc, OG video + ảnh poster, `VideoObject`.
- Khách chưa đăng nhập: vuốt sang bài kế, bấm thích, bình luận, mở bài khác → thẻ "Đăng nhập hoặc đăng ký để xem tiếp" (dùng lại form của `RequireLogin`). Đăng nhập xong vẫn ở link đó, trang thành feed bắt đầu từ bài này.
- Backend: `GET /api/explore/public/{id}` (permitAll, chỉ bài `published`, không trả dữ liệu người bình luận ngoài tên hiển thị); feed và thao tác khác vẫn bắt đăng nhập. Đếm view cho khách bằng `item_events`-style bảng ẩn danh hoặc bỏ qua (chọn khi làm).
- `?p=ID` cũ chuyển 301 sang link mới. Slug từ tiêu đề (`slugify` có dấu → không dấu).
- Không cho Google thấy nhiều hơn người dùng (không cloaking).

### 19.A4 Ghi nguồn khách (UTM)

- FE: lần đầu vào site có `utm_*` thì lưu vào `localStorage` (cùng kiểu `referral:v1`, 30 ngày, giữ nguồn đầu tiên), gửi kèm khi đăng ký (`POST /api/register` thêm `utm`).
- Bảng `user_acquisition` (một dòng mỗi tài khoản): `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (mã video / bài), `explore_post_id`, `ref`, `landing_path`, `first_seen_at`.
- Bảng `landing_visits` (ngày × nguồn × chiến dịch × nội dung, đếm lượt vào kể cả khách chưa đăng ký) qua `POST /api/track/landing` (public, giới hạn tốc độ).
- Trang admin **"Nguồn khách"**: lượt vào, đăng ký, đơn đầu tiên theo kênh / chiến dịch / video, 7 / 30 / 90 ngày.

### 19.A5 Quyền "Duyệt nội dung"

- Một thành viên được admin gán quyền `content_reviewer` (bảng quyền nhỏ hoặc cờ, chọn khi làm) đăng nhập back office nhưng chỉ thấy trang Khám phá (duyệt bài, bình luận) và hàng đợi đăng social (19.A6); không thấy đơn hàng, tiền, thành viên.
- Admin login và các controller admin phải kiểm quyền theo trang, không chỉ role `admin`.

### 19.A6 Bài từ t2m

- Tài khoản creator "anyLEARN Studio" (level `creator`, nên mọi bài chờ duyệt). Khóa API cho máy (token dài hạn chỉ dùng cho route creator + vài route đọc số liệu), env mới theo "Production env checklist".
- Cột `explore_posts.source` (`t2m` / `creator` / `admin`).
- Kiểu bài `album` (nhiều ảnh, vuốt từng khung) cho truyện tranh; bản đầu dùng ảnh dọc ghép sẵn nên làm sau.
- Hàng đợi đăng social (`social_queue`: post, kênh, caption, giờ hẹn, trạng thái, link sau khi đăng): người duyệt chọn giờ, backend hoặc t2m đăng đúng giờ. Bản đầu chỉ là danh sách để đăng tay.

### 19.A7 Trang đích theo nhu cầu (SEO)

- Trang "{môn} cho trẻ {tuổi} tại {quận}" ở TP Hồ Chí Minh, ví dụ `/hoc/boi/5-tuoi/quan-7`: kết quả `/api/search` (tag, tuổi, quận), đoạn giới thiệu do AI viết và admin duyệt, FAQ, bản đồ.
- Chỉ sinh trang khi có ít nhất 3 khóa thật; danh sách tổ hợp lấy từ `search_logs` + "Xu hướng nhu cầu" + quận có nhiều khóa.
- Admin: danh sách trang đích (bật / tắt, sửa đoạn giới thiệu).

### 19.A8 Tài liệu

- `CLAUDE.md`, `docs/huong-dan-admin.md` (Nguồn khách, Duyệt nội dung, trang đích, hàng đợi social), `http/` cho API mới.

## 3. Phần B: t2m (repo `iamcot/t2m`)

### 19.B1 Khung dự án

- Python 3.12, CLI `t2m plan | script | render | review | publish | stats`, job trong SQLite, file trong `jobs/{id}/` (`script.json`, `audio/`, `frames/`, `final.mp4`, `poster.jpg`, `captions.json`).
- Schema kịch bản (pydantic): câu mở, cảnh (lời đọc, chữ trên màn hình, hình, giọng, thời lượng), lời kêu gọi, caption + hashtag từng kênh, UTM.
- Bước AI: `--ai api` (Anthropic SDK, tool call có schema) hoặc `--ai claude-code` (`claude -p`, ghi đúng `script.json`). Ghi token vào bảng `ai_usage`.
- Kiểm tra tự động: 140 đến 170 từ cho 60s, tên / giá khóa khớp API, chỉ lời hứa có trong `config/promise.ts`, viết đúng "anyPoint" và "Leo Xu", không có câu hứa hoàn tiền khác câu đã chốt.

### 19.B2 Dựng video

- Mỗi cảnh là HTML (font Be Vietnam Pro, màu thương hiệu, hình Leo trong `public/fun`) chụp bằng Playwright; ảnh khóa / đối tác từ API; Pexels khi cần.
- ffmpeg: 1080x1920 30 fps, `zoompan`, `xfade`, phụ đề ASS tô từng từ, nhạc nền hạ khi có giọng (`sidechaincompress`), `loudnorm`, mã hóa `h264_videotoolbox` trên Mac; xuất poster.
- Căn phụ đề bằng Whisper tại máy (`whisper.cpp` / `mlx-whisper`) khi TTS không trả mốc từng từ.

### 19.B3 Giọng đọc

- Lớp `TtsProvider` (đổi nhà không sửa chỗ khác). Thử: TTS chạy tại Mac, FPT.AI, Viettel AI, Zalo AI, Azure, Google; chọn bằng tai, ghi giá thật khi chọn.
- Hồ sơ giọng theo template + giọng theo nhân vật trong kịch bản. Giọng trẻ em: so giọng trẻ có sẵn, giọng nữ trẻ nâng cao độ, hoặc nhân bản giọng một người lớn lồng tiếng trẻ có hợp đồng đồng ý; không nhân bản giọng em bé thật.

### 19.B4 Template "Giới thiệu tính năng" (làm đầu tiên)

- Playwright mở site thật ở khung điện thoại bằng tài khoản demo (dữ liệu `scripts/seed_today_demo.sql`, không bao giờ dữ liệu khách thật), quay từng thao tác theo kịch bản, ffmpeg ghép khung điện thoại + chữ + giọng; cùng lúc xuất ảnh chụp cho carousel. 15 trong 28 bài của chiến dịch ra mắt (mục 4) cần template này.

### 19.B5 Template nội dung

- Đố vui cùng Leo (`quiz_questions` đã duyệt), khám phá khoa học, lịch sử 60 giây, STEM tại nhà (người duyệt kiểm tra an toàn), trí tuệ dân gian (thêm topic `folk` vào `quiz_topics`), bé tuổi nào học gì, bộ sưu tập mùa, mẹo nuôi dạy, gặp đối tác, kết quả Đấu trường.
- Video kiến thức có bước kiểm tra sự thật (Claude đánh dấu câu không chắc). Tỉ lệ mỗi tuần khoảng 3 kiến thức / giải trí cho 2 bán hàng.

### 19.B6 Ảnh chế, meme, truyện nhiều khung

- Kịch bản theo khung, 3 phiên bản cái kết để chọn. Bộ nhân vật cố định vẽ một lần (Leo, bố, mẹ, bé trai, bé gái, cô giáo; 10 đến 15 tư thế mỗi nhân vật) + kho nền; t2m ghép bằng template HTML, chữ do template vẽ. Thử model ảnh chạy tại máy (Flux qua MLX) sau.
- Xuất ảnh dọc nhiều khung, bộ ảnh từng khung (carousel), video 15 đến 30s hiện từng khung. Góc ảnh có logo + link ngắn. Không dùng ảnh meme có bản quyền hay mặt người thật.

### 19.B7 Duyệt và đăng

- Trang duyệt của t2m (FastAPI) chỉ để sửa câu và dựng lại một cảnh trước khi gửi.
- Gửi lên Khám phá qua API creator (tải clip Bunny TUS, gắn tag, `item_id`) → chờ duyệt trong back office.
- Social: bản đầu xuất file + caption để đăng tay; sau đó YouTube Data API và Facebook Graph API (Page Reels) khi app được duyệt; TikTok Content Posting API sau cùng. Mọi link có UTM, trỏ về `/fun/explore/{id}/{slug}`.

### 19.B8 Đo và học lại

- `t2m stats` mỗi ngày: số liệu Khám phá (views, likes, shares, comments) + số liệu các kênh + đăng ký theo UTM (19.A4); `t2m plan` tuần sau đọc bảng này để ưu tiên dạng và chủ đề chạy tốt.

## 4. Phần C: Vận hành marketing

### 19.C1 Kênh

- Tạo YouTube (Brand Account) và TikTok (Business), chung tên; Search Console + Bing; Google Business Profile; Meta Pixel + Conversions API trước khi chạy quảng cáo.

### 19.C2 Chiến dịch ra mắt phiên bản mới (28 ngày, 02/11 đến 29/11/2026)

Mỗi ngày một bài Facebook, mở bằng nỗi lo của phụ huynh rồi tới tính năng, link đúng trang, `utm_campaign=ra-mat-v2`. Cùng nội dung lên Khám phá, tin Zalo OA tóm tắt cuối tuần, blog `/article` tổng hợp mỗi tuần. Giờ đăng: thử 12:00 và 21:00 tuần đầu (tránh 20:00 trùng Đấu trường, trừ ngày 22/11 đăng 18:00).

| Ngày | Tính năng | Góc nói | Dạng | Link |
|---|---|---|---|---|
| T2 02/11 | Ra mắt phiên bản mới | "Tìm lớp cho con giờ chỉ còn vài chạm": 6 điểm mới | Video 60s tổng hợp | `/info/why-anylearn` |
| T3 03/11 | Giao diện mới, cài như app | Không cần tải app từ store | Carousel | Trang chủ |
| T4 04/11 | Tìm kiếm thông minh | Lọc theo tuổi bé, học thử miễn phí, đang giảm giá | Video quay màn hình | `/search` |
| T5 05/11 | Tìm theo vị trí, bản đồ | "Lớp đá banh trong 3 km quanh nhà" | Video quay màn hình | `/search/map` |
| T6 06/11 | Ảnh chế | Mẹ tìm lớp cho con: trước và sau anyLEARN | Truyện 4 khung | `/search` |
| T7 07/11 | Vui học và Leo | Chờ con tan lớp cũng vui: điểm danh nhận quà | Video | `/fun` |
| CN 08/11 | Lời hứa giá | Giá bằng hoặc rẻ hơn tại trường, lớp không mở thì hoàn tiền, thấy rẻ hơn thì báo | Bài + ảnh | `/info/why-anylearn` |
| T2 09/11 | So sánh khóa học | 3 khóa cạnh nhau bằng số liệu, AI đọc mô tả giúp | Video quay màn hình | `/compare` |
| T3 10/11 | Gợi ý AI cho bé | Trả lời vài câu về sở thích, nhận lớp hợp tuổi, hợp lịch | Video | `/ai-suggest` |
| T4 11/11 | Lộ trình học | Học xong lớp này thì lên lớp nào | Carousel | một `/pathway/...` |
| T5 12/11 | Bộ sưu tập | Lớp hay cho mùa Tết / hè, chọn sẵn | Carousel | một `/collections/...` |
| T6 13/11 | Đánh giá thật | Chỉ người đã học mới đánh giá, có ảnh, đối tác trả lời | Ảnh review (xin phép) | một trang khóa |
| T7 14/11 | Đố vui cùng Leo | 3 câu đố, trả lời dưới bình luận | Video quiz | `/fun/quiz` |
| CN 15/11 | Tìm giúp tôi | Không thấy lớp cần? anyLEARN tìm giúp | Bài ngắn | `/search` |
| T2 16/11 | anyPoint rõ ràng | Biết trước mỗi khóa nhận bao nhiêu anyPoint, hạn dùng | Infographic | `/info/anypoint` |
| T3 17/11 | Thanh toán 1 chạm | Quét QR là xong, tự xác nhận, công tắc dùng anyPoint | Video quay màn hình | một trang khóa |
| T4 18/11 | Hạng thành viên | Bạc, Vàng, Kim cương nhân anyPoint | Infographic | `/account/rewards` |
| T5 19/11 | Ưu đãi gia đình | Bé thứ hai được giảm | Ảnh chế 2 khung | `/account/rewards` |
| T6 20/11 | Gia hạn 1 chạm | Sắp hết buổi thì được nhắc, bấm một lần là gia hạn | Video | `/today` |
| T7 21/11 | Giới thiệu bạn bè | Gửi link cho bạn, cả hai có quà | Bài + ảnh | `/account/rewards` |
| CN 22/11 | Đấu trường Leo | 20:00 tối nay, cả nhà cùng đấu | Video + nhắc giờ | `/fun` |
| T2 23/11 | Lịch học cả nhà | Mọi lớp của các con trên một trang | Video quay màn hình | `/today` |
| T3 24/11 | Điểm danh, xin nghỉ, đổi lịch | Con ốm báo nghỉ vài chạm | Carousel | `/account/schedule` |
| T4 25/11 | Nhắc lịch bằng thông báo | Không quên giờ đưa con đi học | Bài ngắn + ảnh động | `/account/notifications` |
| T5 26/11 | Nhóm chat lớp | Phụ huynh cùng lớp hỏi nhau, giáo viên trả lời | Video | `/community` |
| T6 27/11 | Khóa học video | Học mọi lúc, lịch tự học, xem trọn đời | Video | một khóa video |
| T7 28/11 | Sticker Leo | Sưu tập và đổi sticker với bạn | Video vui | `/fun/sticker` |
| CN 29/11 | Tổng kết tháng | Nhắc lại 4 tuần, mời theo dõi TikTok / YouTube | Video tổng hợp | Trang chủ |

Câu chữ: so sánh chỉ nói "đặt cạnh nhau bằng số liệu, AI đọc mô tả giúp", không nói AI chọn khóa tốt nhất; phần trăm ưu đãi gia đình và mức hạng lấy từ cài đặt thật lúc viết.

### 19.C3 Nhịp thường xuyên (sau chiến dịch)

- Facebook 1 bài mỗi ngày (Reels t2m 3 bài / tuần, bộ sưu tập, review, banner thành tích / Đấu trường, mini-game), group "Phụ huynh tìm lớp cho con TP.HCM", một Đấu trường riêng mỗi tháng.
- TikTok + YouTube Shorts 1 video mỗi ngày, Instagram Reels 3 / tuần, Zalo OA 1 tin / tuần, blog 2 bài / tuần (chủ đề từ từ khóa không có kết quả trong `search_logs`).
- Quảng cáo thử: boost 1 đến 2 Reels tốt nhất, phụ huynh 25 đến 45 tuổi, bán kính 5 km quanh quận nhiều đối tác, trần ngày, dừng khi không ra đăng ký.

## 5. Chỉ số theo dõi (đặt mục tiêu sau 2 tuần số liệu nền)

Click từ Google và số trang được index (Search Console); lượt xem, tỉ lệ xem hết, chia sẻ mỗi video; người dùng mới theo kênh (`user_acquisition`); người chơi Vui học quay lại trong 7 ngày (`game_events`); đơn đầu tiên theo kênh; chi phí AI + TTS mỗi video (`ai_usage` của t2m).

## 6. Thứ tự

Song song: A1, A2, A3, A4 (cần trước video đầu tiên ra social) cùng B1, B2, B3, B4 (cần cho chiến dịch ra mắt). Sau đó A5, A6, B7, C2; rồi A7, B5, B6, B8, C3.
