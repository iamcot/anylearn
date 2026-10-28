# Quiz leo rank (Vui học, Plan 14: Vui học, nội dung giải trí lúc chờ con)

Mockup bấm thử: https://claude.ai/artifact/T9UANV9XQxwBmuZrHiCqux (bấm "Leo rank" ở cảnh chính).
**Cập nhật 28/10/2026: mọi chỗ trong tài liệu này nói thưởng bằng anyPoint nay đổi thành tiền game riêng "Ali Xu" (xem `plans/PROGRESS.md`); mua item cũng trả bằng Ali Xu, không bằng anyPoint.**
Trạng thái: giai đoạn 0 đến 3 đã code (xem `plans/PROGRESS.md`); từ giai đoạn 4 là thiết kế.

## 1. Vòng chơi một câu

1. Người chơi mở "Leo rank", thấy hạng, sao, bảo hộ.
2. Tùy chọn **chuẩn bị**: Sao may mắn x2/x3, Khiên bảo hộ, Chọn chủ đề (dùng một lần, trừ kho ngay khi bấm Sẵn sàng).
3. Bấm **Sẵn sàng**: server mới chọn câu và gửi đề (đáp án đúng không nằm trong response). Đồng hồ 20 giây bắt đầu.
4. Trong câu: 50:50, Hỏi cộng đồng, Thêm 15 giây, Đổi câu (mỗi loại tối đa 1 lần/câu).
5. Trả lời: server chấm, trả kết quả sao/hạng, màn kết quả có nút Tiếp tục về màn chuẩn bị. Không có giới hạn số câu, chơi lúc rảnh.

Rời màn hình, thoát giữa chừng hoặc hết giờ đều tính là sai (đề đã được phát nên đã có người "xem" câu hỏi).

## 2. Luật sao, hạng, bảo hộ

| Hạng | Sao để lên hạng tiếp |
|---|---|
| Đồng | 5 |
| Bạc | 6 |
| Vàng | 7 |
| Bạch kim | 8 |
| Kim cương | 10 |
| Thông thái | 12 |
| Siêu phàm | 15 |
| Huyền thoại | không giới hạn, chỉ cộng sao |

(Con số chỉnh được trong cài đặt, bảng `quiz_ranks`.)

- Đúng: +1 sao (x2/x3 nếu dùng item). Đủ sao thì lên hạng, sao dư chuyển sang hạng mới, và được bảo hộ đầu hạng.
- Sai: -1 sao (khiên thì không mất).
- **Bảo hộ đầu hạng**: ở 0 sao, sai lần đầu chỉ mất bảo hộ (`guard = 0`), sai lần hai thì rớt hạng. Rớt xuống hạng dưới với `max - 1` sao và có bảo hộ lại. Có thêm 1 sao thì bảo hộ phục hồi. Hạng Đồng không rớt thêm.
- Sao may mắn chỉ cộng khi đúng; nếu sai thì mất item, không phạt thêm. Mỗi câu chỉ dùng 1 loại nhân.
- Thưởng lên hạng: 20 anyPoint (giá trị trong cài đặt), 1 Khiên, 1 sticker. Đúng liền 3, 6, 9... câu: 1 item ngẫu nhiên.
- anyPoint chỉ thưởng ở mốc (lên hạng, top tuần/tháng), không cộng theo từng câu, để không thành cách kiếm điểm hàng loạt. Không đặt cược anyPoint.

## 3. Item và cách có item

| Item | Lúc dùng | Tác dụng |
|---|---|---|
| Sao may mắn x2, x3 | Trước câu | Đúng thì +2/+3 sao |
| Khiên bảo hộ | Trước câu | Sai không mất sao hay bảo hộ |
| Chọn chủ đề | Trước câu | Câu kế tiếp thuộc chủ đề mình giỏi |
| 50:50 | Trong câu | Bỏ 2 đáp án sai |
| Hỏi cộng đồng | Trong câu | Hiển thị % (xem mục 4) |
| Thêm 15 giây | Trong câu | +15 giây |
| Đổi câu | Trong câu | Rút câu khác cùng chủ đề, cùng độ khó |

Nguồn có item: quà check-in hằng ngày và quà mốc 7 ngày, đúng liên tiếp, thưởng lên hạng, top BXH tuần/tháng, nhiệm vụ tuần (ví dụ "đọc 3 bài"), mua bằng anyPoint (giá 20-50, tối đa 5 món/ngày, mua khi hết hàng ngay trong lúc chơi) hoặc đổi 1 sticker trùng. Kho item lưu theo người dùng, có trần mỗi loại (ví dụ 20) để không tích trữ vô hạn.

"Hỏi cộng đồng": giai đoạn đầu, phân bố giả lập từ đáp án đúng + nhiễu (nhãn nên ghi "gợi ý từ cộng đồng"). Khi có đủ dữ liệu (>= 30 lượt trả lời cho câu) dùng tỉ lệ chọn thật theo đáp án từ `quiz_attempts`; câu ít dữ liệu vẫn dùng bản giả lập.

## 4. Kho câu hỏi AI

- Chủ đề ban đầu: Nuôi dạy con, Tiếng Anh, Âm nhạc, Mỹ thuật, Khoa học (thêm theo danh mục khóa học). Độ khó 1-3: Đồng/Bạc = 1, Vàng/Bạch kim = 2, Kim cương trở lên = 3; hạng rất cao có thể thêm mức 4-5.
- **Sinh trước (offline)**: job đêm gọi Anthropic API (Claude Haiku, forced tool call `write_questions` giống `AiSuggestionService`) cho từng cặp chủ đề + độ khó: đề, 4 đáp án, index đúng, giải thích ngắn, nguồn/ghi chú. Mỗi lô 20-30 câu, lưu `status = 'pending'`.
- **Kiểm tra**: lọc trùng (hash chuẩn hóa đề, `PersonNames.normalize` như các chỗ khác, và so gần giống bằng từ khóa), AI lượt hai chấm lại "chỉ có đúng 1 đáp án đúng, không mơ hồ", các đáp án sai hợp lý, tránh số liệu dễ lỗi thời. Qua kiểm tra mới `active`. Có hàng đợi duyệt tay trong back office ("Kho câu hỏi") và nút báo lỗi ở FE; câu bị báo >= 3 lần tự ẩn chờ duyệt.
- Đủ số dự trữ: giữ ít nhất 300 câu `active` mỗi cặp chủ đề + độ khó; thấp hơn thì job sinh thêm. Chi phí bị chặn vì chỉ sinh theo ngưỡng, không sinh theo lượt chơi.
- **Chống trùng 30 ngày/người**: bảng `quiz_attempts` ghi mỗi lần phát đề. Khi chọn: `question_id NOT IN (đã gặp của user trong 30 ngày)` và đúng chủ đề (nếu dùng item) và độ khó theo hạng. Hết câu mới thì hạ ngưỡng: bỏ ràng buộc chủ đề, rồi nới độ khó +-1, cuối cùng mới lặp lại câu cũ nhất; đồng thời báo admin kho cạn. Thứ tự đáp án xáo mỗi lần phát nên học thuộc vị trí không có tác dụng.

## 5. Chống tra Google và gian lận

- Chấm hoàn toàn server: đề không chứa đáp án; đồng hồ do server giữ (`issued_at`, `expires_at`, lệch mạng cộng ân hạn 2 giây).
- Đề chỉ được phát sau khi bấm Sẵn sàng; mỗi người chỉ có một đề đang mở (mở thiết bị khác thì đề cũ tính sai).
- Câu hỏi viết theo hướng khó tra nhanh trong 20 giây: tình huống, so sánh, suy luận thay vì "năm nào" hay "ai là"; thêm cờ `searchable` do AI chấm, ưu tiên câu `searchable = false` ở hạng cao.
- Tín hiệu bất thường: thời gian trả lời quá ổn định (dưới 2 giây nhiều lần liên tiếp), tỉ lệ đúng quá cao ở độ khó cao, rời tab (FE gửi `visibilitychange`). Chỉ cảnh báo, không tự cấm: gắn `flagged` và đưa vào back office. Người bị gắn cờ có thể bị loại khỏi BXH tuần/tháng.
- Nói thẳng trong luật: không ai chống được 100% việc tra cứu, mục tiêu là làm nó không đáng và không phá BXH. Phần thưởng lớn là item và sticker, không phải tiền.

## 6. Bảng xếp hạng

- **Cùng hạng**: xếp theo sao trong từng hạng (chọn hạng ở hàng chip), luôn ghim dòng của mình.
- **Leo nhanh tuần / tháng**: số sao ròng tăng trong kỳ (đúng +, sai -, bảo hộ không tính). Reset thứ Hai 00:00 và ngày 1. Top 3 nhận hộp item (tháng thêm sticker hiếm).
- **Mọi thời**: theo hạng rồi tới sao.
- Có thể thêm "Lớp của tôi" như bản quiz cũ (bạn cùng lớp chat).
- Hiển thị tên hiển thị (như chat lớp), không lộ điện thoại hoặc email, cho phép ẩn khỏi BXH ở cài đặt.
- Dùng bảng tổng hợp `quiz_rank_weekly` (cộng dồn khi chấm) thay vì quét `quiz_attempts` mỗi lần mở BXH; cache ngắn 1 phút.

## 7. Schema gợi ý (migration kế tiếp V46+)

```
quiz_ranks(id, ord, name, stars_needed, icon, min_difficulty)
quiz_profiles(user_id PK, rank_id, stars, guard, streak, best_rank_id, games, correct, wrong,
              guard_updated_at, active_attempt_id, updated_at)
quiz_questions(id, topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation,
               hash UNIQUE, status pending|active|hidden, searchable, report_count, created_at)
quiz_attempts(id, user_id, question_id, rank_id, stars_before, stars_after, option_order JSON,
              answer, is_correct, items_used JSON, issued_at, expires_at, answered_at, flagged,
              INDEX(user_id, question_id), INDEX(user_id, issued_at))
quiz_user_items(user_id, item_key, qty, PRIMARY KEY(user_id, item_key))
quiz_item_log(id, user_id, item_key, delta, source ready|streak|rankup|gift|buy|sticker|mission, ref, created_at)
quiz_rank_weekly(user_id, period 'W2026-44' | 'M2026-10', net_stars, PRIMARY KEY(user_id, period))
quiz_question_reports(id, question_id, user_id, reason, created_at)
```

Mọi thay đổi anyPoint đi qua `WalletService` (mua item, thưởng lên hạng), không ghi `wallet_c` trực tiếp. Loại giao dịch mới `quiz_buy_item`, `quiz_rank_reward` phải thêm vào `UserService.WALLET_C_TYPES` và `AuditService.WALLET_TYPES`.

## 8. API gợi ý

- `GET /api/quiz/me`: hạng, sao, bảo hộ, kho item, thống kê hôm nay.
- `POST /api/quiz/start {items:{mult,shield,topic}}`: trừ item, phát đề.
- `POST /api/quiz/lifeline {attemptId, item}`: dùng 50:50, hỏi cộng đồng, thêm giờ, đổi câu.
- `POST /api/quiz/answer {attemptId, option}`: chấm, trả kết quả, sao, hạng, thưởng.
- `POST /api/quiz/items/buy {item}`: mua bằng anyPoint hoặc sticker (giới hạn ngày).
- `GET /api/quiz/leaderboard?type=rank|week|month|all&rank=`.
- `POST /api/quiz/report {questionId, reason}`.
- Admin: `/admin/quiz/questions` (duyệt, ẩn, sinh thêm), `/admin/quiz/settings` (sao từng hạng, thưởng, giá item, trần, giới hạn), `/admin/quiz/flagged`, báo cáo (số người chơi, phân bố hạng, tỉ lệ đúng theo chủ đề, chi phí AI).

## 9. Điểm cần chốt với chủ sản phẩm

1. Có đặt giới hạn số câu/ngày để chống nghiện không (hiện thiết kế là không giới hạn, kiểm soát bằng anyPoint chỉ thưởng ở mốc)?
2. Con số sao mỗi hạng và giá item ở mục 2-3 là đề xuất, cần xem lại sau khi có dữ liệu chơi thử.
3. Thành viên là phụ huynh hay có chế độ cho bé tự chơi (bé không có tài khoản, dùng hồ sơ bé)? Hiện thiết kế gắn với tài khoản phụ huynh.
4. Thưởng anyPoint khi lên hạng có thuộc diện hết hạn như điểm thường không (đi qua `WalletService.credit` thì có).
5. Bản đầu dùng "Hỏi cộng đồng" giả lập, có chấp nhận ghi rõ nhãn không.

---

# Bổ sung (vòng 2): trang riêng, banner chia sẻ, ref đăng ký, admin Vui học

## 10. Game và sticker là trang riêng

Quiz leo rank, sticker, chia sẻ thành tích đều là trang đầy đủ có nút "←" quay về (không popup). Route gợi ý: `/vui-hoc` (cảnh chính), `/vui-hoc/quiz`, `/vui-hoc/sticker`, `/vui-hoc/chia-se?type=`. Hộp xác nhận mua item vẫn là bảng nhỏ trong trang vì chỉ là bước phụ. Khám phá giữ trình lướt toàn màn hình, nút ✕ đóng.

## 11. Banner thành tích để chia sẻ

- Các loại: lên hạng mới, kỷ lục chuỗi ngày, top cao khi tổng kết tuần, tổng kết tháng (thêm sau: đủ bộ sticker, siêu phàm đầu tiên).
- Banner là ảnh 4:5 dựng từ mẫu (tiêu đề, câu phụ, màu nền, biểu tượng, tên hiển thị) + chân banner có **link giới thiệu và mã QR**: `https://anylearn.vn/ref/{SĐT}?game=quiz`.
- Tạo ảnh: server render (hoặc canvas phía FE) → lưu `achievements.image_url`; nút "Chia sẻ" dùng Web Share trên điện thoại, kèm "Sao chép liên kết" và "Lưu ảnh".
- Phát sinh khi: lên hạng (ngay), chuỗi đạt mốc kỷ lục cá nhân (ví dụ 7, 14, 30 ngày), job tổng kết tuần/tháng cho top N. Người chơi nhận thông báo (`achievement`, topic mới, nhớ thêm vào `NotificationTopics` và `config/notificationTopics.ts`) có nút mở trang chia sẻ.
- Ảnh xem trước khi chia sẻ link (Open Graph): trang `/ref/{SĐT}?game=quiz` trả meta ảnh banner để Zalo/Facebook hiện đẹp.

## 12. Ghi nhận giới thiệu khi đăng ký (tính năng thật, làm được ngay)

Hiện trạng đã kiểm tra trong repo:
- `users.refcode` đã được gán bằng số điện thoại khi đăng ký (`AuthService.register`) và `GET /me/rewards` trả `referral.link = https://anylearn.vn/ref/{refcode}`.
- Người được giới thiệu là các user có `users.user_id` = người giới thiệu (không phải con), nhưng `register` **chưa nhận tham số ref nên không ghi `user_id`**, và FE chưa có route `/ref/[code]`.

Thiết kế:
1. FE `/ref/[code]` (server component): kiểm tra mã hợp lệ qua `GET /api/ref/{code}` (trả tên hiển thị của người giới thiệu, không lộ SĐT đầy đủ), lưu `ref` và `game` vào cookie/`localStorage` 30 ngày, rồi chuyển tới `/register?ref=...&game=...`. Link cũ của người đã chia sẻ vẫn hoạt động.
2. `RegisterForm` đọc ref từ URL hoặc kho lưu, hiện dòng "Bạn được {tên} giới thiệu", gửi `ref` cùng đăng ký. Cũng áp dụng khi đăng nhập lần đầu bằng OTP nếu có luồng tạo tài khoản.
3. Backend `AuthService.register(..., ref)`: tìm người có `refcode = ref`, chấp nhận khi tồn tại, không phải chính mình, không phải tài khoản con, chưa có `user_id`; ghi `user_id`. Mã sai thì bỏ qua và vẫn đăng ký bình thường (không chặn người dùng). Ghi dòng vào `referral_events(id, referrer_id, new_user_id, source, game_id, created_at)` để admin thống kê, không phụ thuộc `user_id`.
4. Điều hướng sau đăng ký: chỉ có ref → trang giới thiệu (`/info/why-anylearn`); có `game` (ví dụ `quiz`) → `/vui-hoc` (mở thẳng game đó). Không có ref thì như cũ về `/`.
5. Thưởng giới thiệu: hoa hồng hiện có qua `commission` khi người được giới thiệu mua; có thể thêm thưởng nhỏ khi bạn bè chơi đủ 5 câu (cấu hình ở admin, cấp qua `WalletService`). Chống gian lận: một thiết bị/SĐT chỉ tính một lần, tự giới thiệu không được tính.
6. Test: `AuthServiceTest` cho mã đúng, sai, tự giới thiệu, tài khoản con; test FE cho hàm đọc/lưu ref.

## 13. Back office "Vui học" (mockup riêng: https://claude.ai/artifact/JWPM9b1v3FMhJXT3TpZhND)

Menu mới nhóm "Vui học" trong `anylearn_admin`, mỗi mục một trang:
1. **Sự kiện game**: bảng mọi sự kiện (quiz, sticker, điểm danh, khám phá, banner, ref) có lọc theo game, chỉ số trong ngày. Nguồn: bảng `game_events(id, user_id, game, type, detail JSON, points, created_at)` ghi từ mỗi service qua một `GameEventService` duy nhất.
2. **Sticker**: bộ sticker (bật/tắt), upload hình (S3), tên, nội dung, độ hiếm, tỉ lệ rơi, xem sở hữu theo thành viên, tặng sticker, danh sách giao dịch đổi/cấp phát.
3. **Điểm danh & quà**: anyPoint từng ngày trong chuỗi, loại quà mốc 7 ngày, tỉ lệ sticker, ngân sách ngày (có ước tính chi phí và trần; chạm trần thì quà chỉ còn sticker).
4. **Quiz leo rank**: ma trận kho câu theo chủ đề × độ khó (số câu, mức dùng, tỉ lệ trùng), nút "Đề xuất AI tạo thêm" (hàng đợi tạo, duyệt, chấm lại), phân bố hạng thành viên, BXH các loại, danh sách gắn cờ, tổng kết tuần/tháng và nút trao thưởng (tay hoặc tự động), cấu hình sao/thưởng/giá item.
5. **Banner thành tích**: bật/tắt và sửa mẫu, điều kiện phát, số chia sẻ, lượt mở link, tỉ lệ đăng ký và chơi.
6. **Khám phá**: danh sách bài, soạn bài (bài viết, ảnh, clip, gắn khóa học), quản lý bình luận (ẩn, báo cáo, cấm bình luận), thống kê view/like/share/comment.
Badge menu mới: câu bị báo lỗi, người bị gắn cờ, bình luận bị báo cáo (qua `GET /admin/badges`).

Lưu ý vận hành: sau khi làm xong cần cập nhật `docs/huong-dan-admin.md` và CLAUDE.md theo quy tắc của dự án.

## 14. Gợi ý thứ tự làm

1. Ref đăng ký + route `/ref/[code]` + điều hướng (nhỏ, độc lập, giá trị ngay).
2. Khung `/vui-hoc`: điểm danh, sticker (đã có thiết kế), `GameEventService`.
3. Quiz leo rank (kho câu AI trước, vì cần thời gian sinh và duyệt).
4. Banner thành tích + admin banner.
5. Admin Vui học và Khám phá.

---

# Bổ sung (vòng 3): sảnh, ván game, phát item ngẫu nhiên

## 15. Cấu trúc màn hình quiz

- **Sảnh** (tab 1): hạng, sao, bảo hộ, hộp khởi động, item hỗ trợ trước trận, nút "Sẵn sàng", thành tích và chia sẻ.
- **Bảng xếp hạng** (tab 2).
- **Ván game**: trang câu hỏi, rồi **trang kết quả ván**. Hai trang này không có tab. Trang kết quả có: kết quả (+sao/-sao, lên hạng, vật phẩm rơi), hạng và sao, hàng **item hỗ trợ trước trận** (thay cho dòng "đúng +1 sai -1"), và hai nút: nút phụ nhỏ bên trái "← Về sảnh", nút chính "Chơi tiếp" vào thẳng câu kế tiếp (trừ item đã chọn). Nút "←" ở đầu trang kết quả cũng về sảnh. Thoát giữa câu tính là sai.
- Dòng bảo hộ ("hết bảo hộ, sai nữa sẽ rớt hạng") chỉ hiện ở trang kết quả khi đang 0 sao, vì lúc đó người chơi cần biết để chọn Khiên.

## 16. Cách nhận item ngẫu nhiên

Mọi lần quay chạy **trên server**, ghi `quiz_item_log` (nguồn, seed, item) để kiểm tra và hoàn tác.

**Bảng trọng số** (cấu hình ở admin): 50:50 25, Hỏi cộng đồng 20, Thêm 15 giây 20, Đổi câu 12, Khiên 8, Sao ×2 8, Chọn chủ đề 5, Sao ×3 2 (tổng 100, nên ×3 khoảng 2% mỗi lần rơi). Trần kho: Sao ×3 tối đa 3, Khiên 5, loại khác 10. Quay trúng loại đã chạm trần thì loại khỏi bảng và quay lại; hết loại thì không rơi.

**1. Hộp khởi động mỗi ngày** (đầu game): lần đầu mở Sảnh trong ngày có một hộp, mở một lần, luôn ra **2 item**: 1 item trước trận (Sao ×2, Sao ×3, Khiên, Chọn chủ đề) và 1 item trong trận (50:50, Hỏi cộng đồng, Thêm giờ, Đổi câu), mỗi nhóm quay theo trọng số trong nhóm. Như vậy ván đầu tiên luôn có thứ để dùng cả hai loại. Hộp tính theo ngày giờ Việt Nam, không dồn sang hôm sau.

**2. Rơi sau mỗi ván** (quay sau khi chấm câu):
- Xác suất cơ bản 12%.
- Cộng 4% cho mỗi ván liên tiếp không rơi (`pity`), tối đa chắc chắn rơi ở ván thứ 12 không rơi.
- Trả lời sai cộng thêm 8% (bù cho người vừa mất sao).
- Đúng liên tiếp 3, 6, 9... câu: rơi chắc chắn một item.
- Rơi xong `pity` về 0.
- Trần rơi trong ngày: 8 item (không tính hộp khởi động và quà điểm danh) để chơi dài không làm lạm phát.

**3. Hạng và độ hiếm**: hạng càng cao, mỗi lần rơi tăng nhẹ trọng số item đắt (ví dụ từ Kim cương trở lên Khiên và Sao ×2 tăng 25%), vì ở hạng cao sai tốn nhiều hơn. Phần này làm sau, bản đầu dùng bảng cố định.

**4. Trợ cấp khi cạn kho**: nếu đầu ngày tổng item còn dưới 2, hộp khởi động cộng thêm 1 item phổ biến (50:50 hoặc Thêm giờ), để người chơi không bị kẹt vì thiếu item và phải mua.

**5. Nguồn khác** (giữ như thiết kế cũ): thưởng lên hạng (1 Khiên), quà điểm danh mốc, top BXH, mua bằng anyPoint hoặc đổi sticker trùng (giới hạn ngày).

**Dữ liệu**: thêm `quiz_drop_state(user_id, pity, drops_today, drops_day, starter_day)`; log ở `quiz_item_log`. Cấu hình admin trong "Quiz leo rank" > cấu hình: trọng số, trần kho, xác suất cơ bản, bước pity, trần rơi mỗi ngày, số item hộp khởi động.

**Điểm cần bạn chốt**: (a) xác suất 12% và pity 12 ván có hợp nhịp chơi không (dự kiến người chơi nhận khoảng 1 item mỗi 5 đến 6 ván), (b) hộp khởi động luôn 2 item hay thêm item hiếm bất ngờ (ví dụ 5% ra Sao ×3), (c) chủ đề "Chọn chủ đề" có nên chọn được cho cả chuỗi 3 câu hay chỉ 1 câu như hiện tại.

---

# Bổ sung (vòng 4): chia sẻ sticker, gói quà 3 sticker, luật đổi và chống nhiều tài khoản

## 17. Chia sẻ sticker để kéo người vào chơi

- Thêm loại banner "Sticker" (vừa có sticker hiếm, đủ bộ...) và nút "Mời bạn nhận gói quà 3 sticker" ngay trong trang Sticker. Link dùng cơ chế ref ở phần 12: `/ref/{SĐT}?game=sticker` → đăng ký xong vào trang Sticker.
- **Gói quà chào mừng cho người được mời: 3 sticker**, chia hai đợt để bắt buộc có hoạt động thật:
  - Đợt 1 (1 sticker thường): ngay sau khi đăng ký và xác thực SĐT bằng OTP.
  - Đợt 2 (2 sticker): sau khi người mới điểm danh ngày thứ 2 hoặc chơi đủ 5 câu quiz. Trong gói không có siêu hiếm, tối đa 1 hiếm với xác suất thấp (cấu hình ở admin).
- Người mời nhận thưởng (sticker hoặc item, không phải anyPoint) khi người mới hoàn thành đợt 2, tối đa 10 lượt mỗi tháng.

## 18. Luật đổi sticker

- Mỗi cặp hai tài khoản chỉ đổi được **1 lần trong đời** (khóa `pair_key = min(userId)-max(userId)`, unique trong `sticker_trades`). Bạn nên chốt: có mở lại sau 90 ngày không.
- Chỉ đổi 1 lấy 1, **cùng độ hiếm** (thường với thường, hiếm với hiếm, siêu hiếm với siêu hiếm). Đây là chốt chặn quan trọng nhất: tài khoản phụ không "đào" được sticker hiếm bằng cách đổi sticker thường.
- Chỉ đổi sticker mình đang trùng, lấy sticker mình chưa có (như mockup).
- Giới hạn tối đa 3 lần đổi mỗi tuần và 10 người bạn đổi khác nhau mỗi tháng.
- Sticker nhận từ gói quà chào mừng bị khóa đổi 7 ngày.

## 19. Chống một người tạo nhiều tài khoản

Không chống được 100%, mục tiêu là làm việc đó tốn công hơn giá trị nhận được. Sticker không đổi ra tiền; phần duy nhất gần tiền là thưởng đủ bộ (200 anyPoint), nên cần chặn cả chỗ này.

1. **Tài khoản đủ điều kiện**: SĐT xác thực OTP, tài khoản trên 3 ngày và có ít nhất 3 ngày điểm danh hoặc 5 câu quiz. Chỉ tài khoản đủ điều kiện mới được đổi sticker, nhận đợt 2 của gói quà và tính là lượt mời.
2. **Luật cùng độ hiếm và đổi một lần mỗi cặp** (mục 18) cắt phần lớn lợi ích: nhiều tài khoản chỉ để đẩy gói quà 3 sticker thường lên tài khoản chính vẫn không cho ra thứ hiếm.
3. **Tín hiệu rủi ro**, cộng điểm cho mỗi tài khoản (hệ thống không tự cấm, chỉ gắn cờ):
   - cùng mã thiết bị (FE gửi một id ngẫu nhiên lưu ở trình duyệt, như `sk` của tìm kiếm) hoặc cùng IP đăng ký trong 24 giờ;
   - nhiều tài khoản cùng một ref đăng ký sát nhau, SĐT liền số hoặc tên giống nhau;
   - tài khoản nhận quà rồi chỉ đổi cho đúng một người và không hoạt động nữa;
   - đổi qua lại trong cụm vài tài khoản khép kín.
4. **Giữ chờ**: khi điểm rủi ro cao, thưởng mời và sticker đợt 2 ở trạng thái "chờ duyệt", admin xem rồi bấm duyệt hoặc hủy. Trang admin Sticker có thêm hai mục: danh sách gắn cờ và sơ đồ ai đổi với ai.
5. **Thưởng đủ bộ** chỉ trao 1 lần mỗi người, và chỉ với tài khoản đủ điều kiện; sticker nhận qua ref trong 7 ngày đầu không tính vào đủ bộ.
6. **Hoàn tác**: admin có thể thu hồi sticker, hủy một giao dịch đổi và khóa quyền đổi của một tài khoản; mọi thứ ghi `game_events` để truy vết.
7. Dữ liệu cần: `sticker_trades(id, a_user, b_user, pair_key UNIQUE, a_sticker, b_sticker, created_at)`, `device_ids(user_id, device_id, ip, first_seen)`, `risk_flags(user_id, score, reasons JSON, status)`, `referral_events` (đã có ở phần 12).

Điểm cần bạn chốt: đổi một lần mỗi cặp là mãi mãi hay mở lại sau một thời gian, và có chấp nhận luật "cùng độ hiếm" không (ít linh hoạt hơn nhưng chống đào hiệu quả nhất).

---

# Lộ trình làm (Plan 14: Vui học, nội dung giải trí lúc chờ con)

Đã chốt thêm: đổi sticker **mỗi cặp 30 ngày một lần** (không phải trọn đời), chỉ đổi **cùng độ hiếm**. Cập nhật `pair_key` thành unique theo `pair_key + cửa sổ 30 ngày` (kiểm tra bằng lần đổi gần nhất của cặp).

Ước lượng cho một lập trình viên, mỗi giai đoạn là một cụm commit trên cùng branch của thread, có test và cập nhật `docs/huong-dan-admin.md`, `CLAUDE.md`, `http/*.http`. Mỗi game có công tắc bật/tắt (`fun/enabled`, `fun/quiz_enabled`...) để đưa lên production dần.

| # | Giai đoạn | Nội dung chính | Ước lượng |
|---|---|---|---|
| 0 | Ref đăng ký | Route `/ref/[code]`, lưu mã 30 ngày, `register` nhận `ref` và ghi `user_id`, `referral_events`, điều hướng (chỉ ref → giới thiệu, có `game` → Vui học), test. Độc lập, dùng được ngay | 1 ngày |
| 1 | Nền Vui học | Route `/vui-hoc` (cảnh chính, trang riêng có nút về), `game_events` + `GameEventService`, điểm danh + quà hằng ngày + cấu hình anyPoint và ngân sách ở admin, admin "Sự kiện game" và "Điểm danh & quà" | 3 ngày |
| 2 | Kho câu hỏi AI (chạy sớm, song song với 1) | Bảng câu hỏi, job sinh theo chủ đề × độ khó bằng Claude Haiku, lọc trùng, AI chấm lại, hàng đợi duyệt, nút báo lỗi. Cần khoảng 300 câu mỗi ô (15 ô), nên bắt đầu sớm để kịp duyệt | 3 ngày + thời gian duyệt |
| 3 | Sticker | Schema, trang album và đổi, bộ sticker và upload ở admin, độ hiếm, sở hữu, giao dịch; luật đổi (30 ngày/cặp, cùng độ hiếm, trần tuần/tháng); gói quà 3 sticker 2 đợt qua link giới thiệu; mã thiết bị và điểm rủi ro cơ bản, hàng chờ duyệt | 4 ngày |
| 4 | Quiz leo rank lõi | Hạng/sao/bảo hộ, API phát đề, chấm, quyền lợi item, rơi item (hộp khởi động, pity), kho item, giờ chạy phía server, FE sảnh / ván game / trang kết quả, mua item bằng anyPoint qua `WalletService` | 5 ngày |
| 5 | BXH và tổng kết | Bảng cộng dồn tuần/tháng, 4 loại BXH, job tổng kết và trao thưởng, admin quiz (ma trận kho, hạng thành viên, gắn cờ, cấu hình) | 3 ngày |
| 6 | Banner thành tích | Mẫu banner, tạo ảnh, trang chia sẻ, ảnh xem trước (Open Graph) cho link ref, thông báo `achievement`, admin banner và thống kê chuyển đổi | 3 ngày |
| 7 | Khám phá thật | Bài viết, ảnh, video, bình luận, báo cáo, thống kê view/like/share, admin soạn bài và duyệt bình luận, nối FE trình lướt vào dữ liệu thật | 4 ngày |
| 8 | Hoàn thiện và thử | Chỉnh trọng số và tỉ lệ rơi theo dữ liệu, chống gian lận thêm, thử với nhóm nhỏ, bật dần từng game, ghi hướng dẫn admin | 2 đến 3 ngày |

Tổng khoảng 4 đến 5 tuần làm tuần tự. Có thể gộp giai đoạn 1 và 2 song song nếu có hai người.

Lý do thứ tự: ref trước vì mọi chia sẻ dựa vào nó và làm xong là có giá trị ngay; kho câu hỏi chạy sớm vì cần thời gian sinh và duyệt; sticker trước quiz vì sticker độc lập hơn và dùng chung cơ chế quà, giới thiệu; banner và Khám phá sau cùng vì cần dữ liệu từ các game trước.

Rủi ro cần để mắt: chi phí gọi AI khi sinh lô lớn (giới hạn theo ngưỡng kho), số liệu cân bằng (sao mỗi hạng, nhịp rơi item) cần chỉnh sau khi có người chơi thật, và nội dung Khám phá cần có người duyệt để tránh spam bình luận.
