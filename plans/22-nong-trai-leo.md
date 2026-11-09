# Plan 22: Nông trại anyLEARN (game trồng trọt trong Vui học)

Ngày: 09/11/2026. Nối tiếp plan 14 (Vui học), 15 (kinh tế Leo Xu), 18 (Đấu trường), 21 (gamification đơn đầu). Prompt tạo ảnh: `plans/22-nong-trai-leo-asset-prompts.md`.

Mọi con số dưới đây là **mặc định**, admin chỉnh được. Plan này chưa viết code. Quyết định của chủ sản phẩm (09/11/2026) ở mục 14. Tên game: **Nông trại anyLEARN** (chủ sản phẩm gõ "Nông Trại AnyLearn", viết theo thương hiệu anyLEARN).

## 0. Mục tiêu và nguyên tắc

Một game "ghé vườn" nhẹ nhàng: mỗi ngày phụ huynh (và bé) mở 2-3 lần, mỗi lần 2-5 phút, gieo hạt, tưới, bón, thu hoạch, giao đơn, ghé vườn hàng xóm tưới giúp hoặc hái trộm một bông hoa. Leo là người làm vườn. Game giữ người dùng quay lại app mỗi ngày, rồi dẫn họ tới phần học thật (hạt giống Tri thức chỉ có khi bé đi học hoặc học video).

Nguyên tắc:

1. **Dùng chung kinh tế Leo Xu** (`CoinService`). Không tạo đồng tiền mới. **nông trại chỉ được thêm một phần nhỏ Leo Xu ròng** vào túi người chơi, và phần đó **có trần cứng theo lãi ròng** (mục 4.3), không theo sản lượng.
   **[Cập nhật 09/11] Đổi Leo Xu lấy voucher đã TẮT (rủi ro giấy phép G1, NĐ 147/2024): vật phẩm ảo không đổi ra giá trị ngoài game. Các mốc voucher bên dưới chỉ để tham khảo lịch sử; tương tác giữa người chơi (hàng xóm, tưới giúp, hái trộm) cũng tạm dừng (`farm/social_enabled` = 0, ẩn tab Hàng xóm); vẫn có nút mời bạn ở trang Vui học.**
2. **Tiến bộ không có trần, xu thì có.** Chăm vườn lâu hơn luôn được nhiều hơn: kinh nghiệm (XP), cấp vườn, đơn hàng, bộ sưu tập, đồ trang trí, cây mới. Chỉ phần đổi ra Leo Xu là bị chặn. Đây là cách "kết quả tương xứng với thời gian" mà không lạm phát.
3. **Không phạt nặng.** Cây không bao giờ chết. Quên tưới thì cây lớn chậm hơn và ít quả hơn; chín lâu không thu thì héo bớt, phần héo thành phân ủ.
4. **Tương tác có giới hạn và không chuyển được giá trị.** Tưới, bón giúp chỉ tiết kiệm thời gian cho chủ vườn; hoa hái trộm và quà tặng **không bán được ra chợ** (chỉ dùng cho đơn hàng, bó hoa, bộ sưu tập), nên tài khoản phụ không thể "bơm" xu cho nhau.
5. **Server quyết mọi thứ.** Thời gian lớn tính từ giờ máy chủ (`Clock` bean), không có job chạy mỗi phút: trạng thái ô đất được tính lười khi đọc (như năng lượng Leo rank, `QuizEnergy`).
6. **Admin chỉnh được mọi số** (một bảng `FIELDS` như `QuizGameSettings` / `NumberSettings`), sửa được danh mục cây, chương, việc hằng ngày, đồ trang trí; có trang sức khỏe kinh tế và **máy tính mô phỏng** thu nhập (mục 11.3).
7. Nhắc mỗi ngày **tối đa 1 thông báo đẩy** cho nông trại, có lùi dần khi người dùng không mở (mục 9).

## 1. Hiện trạng dùng lại (đọc từ code)

| Cần | Dùng lại | Ghi chú |
|---|---|---|
| Tiền | `CoinService.credit/debit` | Nguồn mới: `farm_sell`, `farm_order`, `farm_task`, `farm_chapter`, `farm_level` (vào); `farm_seed`, `farm_expand`, `farm_decor`, `farm_tool`, `farm_item` (ra). Nhãn ở `lib/fun/coins.ts` và admin `FunCoins.jsx`. Trần ngày chung `fun/daily_earn_cap` vẫn áp dụng. |
| Sự kiện | `GameEventService.record(userId, "farm", type, detail, coins)` | Nhiệm vụ tuần đếm từ đây: thêm `Def` `farm_harvest`, `farm_help` vào `MissionRules.DEFS`. |
| Mở dần | `FunAccessRules.GAMES` + `FunAccessInterceptor` (`/api/farm/**`) + `GET /api/fun/access` | Game key `farm`, chế độ all / testers / off. |
| Lối tắt | `FunShortcuts` | Thêm ô "Nông trại" (ảnh Leo cầm bình tưới). |
| Thưởng lớn | `LeoReward` (Leo tặng xu), `AchievementService.grant` (type `farm`), `StickerService.dropRandom` | Bộ sticker mới "Nông trại Leo" (12 sticker) trong `sticker_collections`. |
| anyPoint mốc lớn | `WalletService` (transaction type mới `farm_milestone`, thêm vào `WALLET_C_TYPES` và `AuditService.WALLET_TYPES`) | Mặc định 0, chỉ cho N tài khoản đầu (như `first_order_budget`). |
| Hành trình | `JourneyRules.DEFS` | Thêm nhiệm vụ tùy chọn "Thu hoạch vụ đầu tiên" ở chương 2. |
| Học thật | `course_completions`, `item_video_lesson_user_links.completed_at`, `attendances` | Sinh "Hạt Tri thức" (mục 3.4). |
| Thông báo | `NotificationService.createNotification` + topic `fun` | Types mới `farm_ripe`, `farm_digest`, `farm_comeback`, `farm_neighbor` (thêm vào `NotificationTopics` và `config/notificationTopics.ts`). |
| Chống gian lận | `StickerService.eligible` (tuổi tài khoản + số ngày điểm danh), `RiskService.signals`, `device_ids` | Chỉ người đủ điều kiện mới tương tác xã hội. |
| Tên hiển thị | `QuizBoardRules.displayName` | 2 chữ cuối, không bao giờ SĐT / email. |
| Leo | `assets/leo-3-views-sheet.png`, `components/fun/Leo.tsx` | Leo làm vườn là ảnh PNG mới (prompt ở file asset), vẫn đúng hình Leo. |
| Cài đặt | `NumberSettings` / mẫu `FIELDS` | `farm/*` rows trong `configurations`. |

Migration mới nhất: V82 → nông trại bắt đầu từ **V83**.

## 2. Vòng chơi cốt lõi

```
Mua hạt (Leo Xu) → Gieo lên ô đất → Tưới (1-3 lần tùy cây) → [Bón phân: +1 sản lượng] → Chín → Thu hoạch (XP)
   → Bán ở Chợ Leo (Leo Xu, có trần lãi)  hoặc  Giao đơn hàng (XP + đồ + ít xu)  hoặc  Cất kho / Ủ phân / Bó hoa
```

### 2.1 Ô đất

- Bắt đầu **4 ô**, mở thêm tới **12 ô** (mục 5.2). Thêm **3 chỗ cây lâu năm** riêng.
- Trạng thái một ô (tính lười từ `planted_at`, `water_due_at`...): `empty` → `growing` (có thể `thirsty`) → `ripe` → `wilting` → `withered`.
- **Tưới**: mỗi cây cần `water_needs` lần (0-3). Lần tưới kế tiếp mở khi cây đi được tới mốc `1/(n+1)`, `2/(n+1)`... thời gian lớn. Cây đang khát **lớn chậm lại** (`farm/thirsty_speed` = 50%), không dừng hẳn. Mỗi lần khát quá `farm/thirst_grace_minutes` (60) mà chưa tưới thì **-1 sản lượng** (tối thiểu còn `farm/min_yield` = 2).
- **Bón phân**: 1 lần mỗi vụ, trước khi chín: **+1 sản lượng**. Phân bón lấy từ thùng ủ (miễn phí, mục 2.4), việc hằng ngày, hoặc mua 3 Leo Xu.
- **Chín**: giữ nguyên trong `farm/ripe_hours` = max(4 giờ, thời gian lớn của cây). Sau đó **héo dần**: mỗi `farm/wilt_step_hours` (6) mất 1 đơn vị, tới `min_yield`. Phần mất chuyển thành "lá héo" vào thùng ủ.
- **Thu hoạch**: nhận sản lượng vào kho + XP của cây. "Thu tất cả" và "Tưới tất cả" có sẵn từ đầu (không bán tiện lợi).

### 2.2 Sản lượng

`sản lượng = base_yield (4) + 1 nếu bón − số lần khát quá hạn − phần héo − phần bị hái trộm`, chặn dưới `min_yield`.

Ví dụ cây 8 giờ (hạt 20 xu, giá 6 xu/quả): chăm đủ 4 quả = 24 xu (lãi 4); bón thêm 5 quả = 30 xu (lãi 10, trừ phân 0-3); quên tưới 2 lần còn 2 quả = 12 xu (lỗ 8, nhưng vẫn có XP và phân ủ).

### 2.3 Kho

- Sức chứa `farm/storage_base` 60 đơn vị, nâng bằng Leo Xu (mục 5.2). Nông sản trong kho **không hỏng**.
- Kho tách 2 loại: **của mình trồng** (bán được) và **nhận được** (hái trộm, quà): chỉ dùng cho đơn hàng, bó hoa, bộ sưu tập, ủ phân.

### 2.4 Thùng ủ phân

- 5 đơn vị nông sản bất kỳ hoặc 5 lá héo → 1 bao phân sau `farm/compost_minutes` (120). Tối đa 2 mẻ cùng lúc.
- Đây là chỗ xả nông sản thừa khi chợ đã đủ trần, và là nguồn phân miễn phí.

## 3. Cây trồng (đa dạng, sáng tạo)

Bốn nhóm: **Rau củ** (không bị hái trộm), **Hoa** (bị hái trộm được, dùng bó hoa), **Cây diệu kỳ** (chủ đề học tập), **Cây lâu năm** (ô riêng, thu nhiều lần). Thêm **Cây theo mùa** do admin bật theo dịp.

Các mức thời gian dùng chung bảng giá (mục 4.1), nên thêm cây mới chỉ cần chọn mức.

### 3.1 Rau củ

| Key | Tên | Lớn | Mở cấp | Nét sáng tạo |
|---|---|---|---|---|
| `rau_mam` | Rau mầm sương mai | 5 phút | 1 | Mầm nhỏ đội giọt sương lấp lánh |
| `ca_rot_cau_vong` | Cà rốt cầu vồng | 30 phút | 1 | Củ có sọc 7 màu |
| `bap_rang` | Bắp rang nổ | 2 giờ | 2 | Khi chín hạt bắp tự nổ bung thành bỏng ngô |
| `khoai_cuoi` | Khoai lang tím mặt cười | 4 giờ | 3 | Củ tím có khuôn mặt cười ngộ nghĩnh |
| `ca_chua_bong_bay` | Cà chua bóng bay | 8 giờ | 5 | Quả chín lơ lửng như bóng bay buộc dây vào thân |
| `bi_den_long` | Bí ngô đèn lồng | 12 giờ | 7 | Phát sáng ấm áp ban đêm (đổi ảnh khi tối) |
| `bap_cai_may` | Bắp cải mây | 24 giờ | 10 | Lá xốp trắng xanh như đám mây |
| `ot_tia_lua` | Ớt tia lửa | 2 giờ | 8 | Quả đỏ có tia lửa nhỏ lách tách |

### 3.2 Hoa (hái trộm được)

| Key | Tên | Lớn | Mở cấp | Nét sáng tạo |
|---|---|---|---|---|
| `hoa_nang_mai` | Hoa nắng mai | 30 phút | 2 | Cánh vàng tỏa tia như mặt trời nhỏ |
| `hoa_not_nhac` | Hoa nốt nhạc | 2 giờ | 4 | Cánh hình nốt nhạc, rung khi chạm |
| `huong_duong_cuoi` | Hướng dương mặt cười | 4 giờ | 6 | Nhụy là khuôn mặt cười, quay theo Leo |
| `tulip_anh_trang` | Tulip ánh trăng | 8 giờ | 9 | Cánh bạc xanh, nở sáng hơn ban đêm |
| `hoa_bay_sac` | Hoa bảy sắc | 12 giờ | 12 | Mỗi cánh một màu cầu vồng |
| `hoa_pha_le` | Hoa pha lê tuyết | 24 giờ | 15 | Cánh trong như pha lê, bông tuyết nhỏ bay quanh |

### 3.3 Cây diệu kỳ (chủ đề học tập)

| Key | Tên | Lớn | Mở cấp | Nét sáng tạo |
|---|---|---|---|---|
| `day_so_dem` | Dây leo số đếm | 2 giờ | 6 | Quả hình số 1, 2, 3 treo trên dây |
| `cay_chu_cai` | Cây chữ cái | 4 giờ | 5 | Quả là chữ cái A, B, C nhiều màu |
| `cay_but_chi` | Cây bút chì màu | 8 giờ | 8 | Thân như bút chì, quả là những đầu chì màu |
| `nam_thien_van` | Nấm thiên văn | 12 giờ | 11 | Mũ nấm xanh đêm có chòm sao lấp lánh |
| `cay_tri_thuc` | Cây Tri thức | 24 giờ | 3 | Chỉ trồng từ **Hạt Tri thức** (mục 3.4); quả là cuốn sách nhỏ phát sáng |

Quả cây diệu kỳ bán như rau củ, nhưng đơn hàng hay đòi chúng hơn, và mỗi lần thu có `farm/magic_sticker_chance` (3%) rơi sticker bộ "Nông trại Leo".

### 3.4 Hạt Tri thức: nối với việc học thật

Bé (hoặc tài khoản) được **1 Hạt Tri thức** khi có một trong các việc sau trong ngày (tối đa `farm/knowledge_seeds_daily` = 1/ngày/tài khoản):

- điểm danh một buổi học (`attendances`, nguồn bất kỳ),
- học xong một bài video (`completed_at` trong ngày),
- hoàn thành một khóa (`course_completions`, thưởng thêm 2 hạt một lần).

Hạt không mua được. Cây Tri thức không tốn hạt nên toàn bộ là lãi, nhưng vẫn nằm trong trần lãi (mục 4.3). Trên `/today`, thẻ buổi học đã điểm danh có dòng nhỏ "Leo gửi bạn 1 Hạt Tri thức".

### 3.5 Cây lâu năm (chỗ cây riêng)

| Key | Tên | Trồng | Lớn tới khi ra quả | Ra quả mỗi | Số lần | Mở cấp |
|---|---|---|---|---|---|---|
| `bui_dau_sao` | Bụi dâu sao băng | 45 xu | 1 ngày | 8 giờ | 12 | 9 |
| `cam_mat_troi` | Cây cam mặt trời | 60 xu | 2 ngày | 12 giờ | 10 | 12 |
| `tao_ngoi_sao` | Cây táo ngôi sao | 80 xu | 3 ngày | 12 giờ | 10 | 14 |

Mỗi lần ra quả 3 đơn vị, tưới 1 lần mỗi chu kỳ, không bón. Hết số lần thì cây "nghỉ" và có thể nhổ (nhận 1 sticker hoặc phân). Đây là cây "tiện" cho người bận: ít lần ghé.

### 3.6 Cây theo mùa (admin bật, `season_from` / `season_to`)

| Key | Tên | Dịp | Nhóm |
|---|---|---|---|
| `mai_vang` | Hoa mai vàng | Tết | Hoa |
| `buoi_trung_thu` | Bưởi mặt cười | Trung thu | Rau củ (quả) |
| `thong_keo_gay` | Cây thông kẹo gậy | Giáng sinh | Diệu kỳ |
| `hoa_cam_tu_cau` | Cẩm tú cầu khai giảng | Tháng 9 | Hoa |

Đơn hàng mùa và đồ trang trí mùa đi kèm (mục 6.2).

### 3.7 Vật nuôi (giai đoạn sau, 22.7)

Gà Bông (trứng mỗi 6 giờ, ăn 1 hạt cải), Ong Mật (mật mỗi 12 giờ, cần ít nhất 2 ô hoa đang trồng), Bò Sữa Đốm (sữa mỗi 12 giờ, ăn 2 bắp cải mây). Dùng cùng khung "chu kỳ" của cây lâu năm.

## 4. Kinh tế (chống lạm phát Leo Xu)

### 4.1 Bảng giá theo mức thời gian

Sản lượng chuẩn 4, bón +1. Giá hạt đặt sao cho **chăm đủ thì lãi mỏng (10-20%)**, bón phân thì lãi khá (35-50%), quên chăm thì lỗ nhẹ.

| Mức | Thời gian | Giá hạt | Giá bán / quả | Chăm đủ (4 quả) | Bón phân (5 quả) | XP / vụ | Lãi bón / giờ |
|---|---|---|---|---|---|---|---|
| T1 | 5 phút | 3 | 1 | +1 | +2 | 2 | 24 |
| T2 | 30 phút | 7 | 2 | +1 | +3 | 4 | 6 |
| T3 | 2 giờ | 10 | 3 | +2 | +5 | 8 | 2,5 |
| T4 | 4 giờ | 14 | 4 | +2 | +6 | 12 | 1,5 |
| T5 | 8 giờ | 20 | 6 | +4 | +10 | 20 | 1,25 |
| T6 | 12 giờ | 27 | 8 | +5 | +13 | 28 | 1,1 |
| T7 | 24 giờ | 40 | 12 | +8 | +20 | 45 | 0,8 |

Cây ngắn có lãi/giờ cao nhưng **cần ghé liên tục** (không ai ngồi 5 phút một lần cả ngày), cây dài lãi/vụ cao, hợp người ghé 2 lần/ngày. Tức là "kết quả tương xứng với công sức ghé". Admin sửa giá từng cây, bảng trên chỉ là mặc định của mức.

### 4.2 Giá chợ hằng ngày

- Mỗi cây có **giá hôm nay** = giá gốc × hệ số ngẫu nhiên 0,8-1,2 (seed = ngày + key cây, `mulberry32`-kiểu, ai cũng thấy cùng giá). Chợ có dòng "Hôm nay Cô Thỏ mua hoa nắng mai giá cao!".
- **Bán nhiều cùng một loại trong ngày thì giá giảm**: sau `farm/same_crop_full_units` (12) quả, các quả tiếp theo 70%, sau 24 quả 40%. Khuyến khích trồng đa dạng.

### 4.3 Trần lãi ròng (chốt chặn chính)

- **Lãi ròng trong ngày** = Leo Xu thu từ nông trại (bán chợ + đơn hàng + hộp việc hằng ngày) − Leo Xu chi cho hạt giống và phân trong ngày.
- Trần ngày = `farm/profit_cap_base` (8) + `farm/profit_cap_per_level` (0,5) × cấp vườn, tối đa `farm/profit_cap_max` (18).
- Trần tuần (tuần ISO) `farm/weekly_profit_cap` (**70**).
- Khi bán, server chỉ trả tối đa phần còn lại của trần (`ShopRules`-kiểu, thuần, có test); phần vượt thì **chợ không mua**: nông sản ở lại kho. Màn chợ luôn hiện "Hôm nay chợ còn mua thêm được: lãi 6 Leo Xu" bằng thanh tiến độ, không giấu.
- Không tính vào trần: thưởng chương, thưởng lên cấp (một lần, ngân sách cố định mục 4.5). Vẫn tính trần ngày chung `fun/daily_earn_cap` nếu admin bật.
- Mua hạt bằng Leo Xu rồi bán ngày khác: hạt được tính vào ngày mua, nên mua hôm nay bán mai chỉ làm mai có trần thoáng hơn đúng bằng tiền hạt hôm qua, không tạo thêm lãi tổng (trần tuần chặn).

### 4.4 Thu nhập dự kiến

| Kiểu người chơi | Cách chơi | Lãi Leo Xu ròng / tuần | So với thu nhập game hiện có (~215-245/tuần) |
|---|---|---|---|
| Ghé 1 lần/ngày | 4-6 ô cây 24 giờ, không bón | 20-35 | +10-15% |
| Ghé 2-3 lần/ngày | 8-10 ô, bón phân, đơn hàng | 55-70 (chạm trần tuần) | +25-30% |
| Chơi nhiều | 12 ô, cây ngắn | 70 (trần) | +30% |

Người chơi nhiều tiếp tục có XP, cấp, đơn hàng, đồ trang trí, sticker; xu không tăng thêm.

~~**Mốc so với voucher (đã chốt 09/11)**: shop đang bán voucher 500 Leo Xu = giảm 10% tối đa 50.000đ, và 1.000 Leo Xu = giảm 15% tối đa 100.000đ (1 tháng chỉ dùng 1 lần). Tức mỗi Leo Xu đáng tối đa ~100đ khi giỏ hàng đủ lớn (đơn từ 500.000đ cho gói 1, từ ~670.000đ cho gói 2). Trần lãi nông trại 70 xu/tuần = tối đa ~7.000đ/tuần, ~28.000đ/tháng; người chơi rất chăm (mọi game ~300 xu/tuần) đổi được gói 1.000 xu sau khoảng 3-4 tuần, vừa khớp luật 1 lần/tháng. Trang sức khỏe hiện "số tuần chơi chăm để đổi voucher rẻ nhất" để theo dõi; nếu thấy voucher đổi quá dễ thì hạ trần tuần trước, không đụng giá voucher.~~ (đã tắt, xem ghi chú 09/11 ở đầu mục 1)

### 4.5 Phần thưởng một lần (ngân sách cố định)

| Nguồn | Leo Xu | Khác |
|---|---|---|
| Gói khởi đầu (chương 1) | 0 (tặng 6 hạt rau mầm + 4 hạt cà rốt + 2 phân) | |
| Thưởng chương 1-6 | 20 / 40 / 60 / 80 / 100 / 150 (tổng 450) | ô đất, đồ trang trí, sticker, banner thành tích chương 3 và 6 |
| Lên cấp | 5 × cấp mới ở cấp chẵn (cấp 2-30: tổng ~1.200 trong vài tháng) | đồ trang trí / hạt mới |
| anyPoint | Cấp 10, 20, 30 và hết chương 6: mặc định **0** | ngân sách `farm/anypoint_accounts` (N tài khoản đầu) |

### 4.6 Chỗ tiêu (sink) phải lớn hơn chỗ kiếm

| Món | Giá | Kiểu |
|---|---|---|
| Hạt giống | 3-40 / vụ (cây lâu năm 45-80) | lặp lại |
| Phân bón (khi thiếu phân ủ) | 3 | lặp lại |
| Ô đất 5-12 | 30, 60, 100, 150, 220, 300, 400, 500 (cần cấp 2, 4, 6, 8, 11, 14, 17, 20) | một lần, tổng 1.760 |
| Chỗ cây lâu năm 1-3 | 100, 250, 500 (cấp 9, 13, 18) | một lần |
| Nâng kho 60 → 90 → 130 → 200 | 50, 120, 250 | một lần |
| Bình tưới cấp 2-3 (tưới 3 / 6 ô một lần) | 80, 200 | một lần, tiện lợi |
| Thùng ủ thứ 2 | 120 | một lần |
| Bù nhìn (chặn hái trộm 12 giờ) | 5 | lặp lại |
| Đồ trang trí (hàng rào, ghế, xích đu, ao cá, đèn lồng, nhà Leo...) | 10-400 | không giới hạn, thuần thẩm mỹ |
| Trang phục Leo làm vườn (nón, yếm, ủng) | 60-300 | thẩm mỹ |
| Hộp hạt hiếm (hạt cây cấp cao sớm hơn 2 cấp) | 30 | lặp lại, tối đa 1/ngày |

Tổng sink một lần ~3.000+ xu, gấp nhiều lần tổng thưởng một lần (~1.650). Đồ trang trí là sink không đáy cho người chơi lâu.

### 4.7 Chống lách

- Chỉ nông sản **do mình trồng** mới bán ra chợ (kho tách 2 loại, mục 2.3).
- Tưới / bón giúp không cho người giúp xu (chỉ XP + tim hàng xóm), và chỉ giúp chủ vườn tiết kiệm thời gian.
- Đơn hàng sinh từ server, phần thưởng xu tính vào trần lãi.
- Tốc độ tay: mỗi tài khoản tối đa `farm/actions_per_minute` (60) thao tác; thao tác nhanh bất thường ghi `risk_flags`.
- Mọi thời gian từ server; FE chỉ hiển thị đếm ngược bằng `clockOffset`.

## 5. Cấp vườn và mở khóa

### 5.1 XP và cấp

- XP từ: thu hoạch (bảng 4.1), giao đơn (2 × XP các món), việc hằng ngày (20/việc), giúp hàng xóm (3/lần), ủ phân (2), chương.
- XP lên cấp L → L+1 = `round(40 × L^1.4)` (`farm/xp_base`, `farm/xp_exp`). Cấp tối đa 30.
- Người chăm (~250 XP/ngày): cấp 5 sau ~3-4 ngày, cấp 10 sau ~2 tuần, cấp 20 sau ~2,5-3 tháng, cấp 30 sau ~7 tháng. Người ghé 1 lần/ngày (~90 XP) chậm gấp 2,5 lần.

### 5.2 Mở khóa theo cấp (tóm tắt)

| Cấp | Mở |
|---|---|
| 1 | 4 ô, rau mầm, cà rốt, thùng ủ, chợ |
| 2 | Bắp rang, hoa nắng mai, ô 5 (mua) |
| 3 | Khoai mặt cười, Cây Tri thức, bảng đơn hàng |
| 4 | Hoa nốt nhạc, hàng xóm (tưới giúp) |
| 5 | Cà chua bóng bay, cây chữ cái, **hái trộm hoa** |
| 6-8 | Hướng dương, dây số, bí đèn lồng, bút chì, ớt; đơn thứ 4 ở cấp 8 |
| 9-15 | Cây lâu năm, tulip, nấm thiên văn, hoa bảy sắc, hoa pha lê; đơn thứ 5 ở cấp 15 |
| 16-30 | Trang trí cao cấp, trang phục Leo, vật nuôi (khi có), cây mùa sớm hơn |

## 6. Đơn hàng và việc hằng ngày

### 6.1 Bảng đơn hàng ("Bảng tin của Bác Bù Nhìn")

- 3 đơn cùng lúc (4 ở cấp 8, 5 ở cấp 15). Mỗi đơn 1-3 loại nông sản, tổng 4-12 đơn vị, chọn theo cây người chơi đã mở (thuần `FarmOrderRules`, seed theo người + thời điểm).
- Thưởng: XP = 2 × tổng XP món, Leo Xu = 1,1 × giá gốc (tính vào trần lãi; hết trần thì đơn trả XP + 1 đồ thay xu, đơn vẫn giao được), đôi khi thêm 1 phân / hạt hiếm / mảnh trang trí.
- Đơn mới đến sau `farm/order_refill_minutes` (45). Bỏ đơn: miễn phí 1 lần mỗi 4 giờ.
- Đơn chấp nhận cả nông sản "nhận được" (hái trộm, quà): lý do để đi hái trộm và kết bạn.
- **Bó hoa**: 3 bông hoa khác loại → 1 bó hoa, giao cho đơn đặc biệt "Tặng cô giáo" (XP lớn) hoặc đặt thành đồ trang trí.

### 6.2 Việc hôm nay

- Mỗi ngày 3 việc rút từ danh sách (bảng `farm_task_defs`, admin sửa): thu 10 ô, tưới 6 lần, giao 1 đơn, ủ 1 mẻ phân, giúp 2 hàng xóm, ghé 3 vườn, trồng 3 loại khác nhau, trồng 1 cây diệu kỳ, bán 1 lần ở chợ.
- Mỗi việc: 20 XP + 1 phân hoặc 1 hạt. Xong cả 3: hộp nhỏ 3-6 Leo Xu (tính vào trần lãi) và 5% ra sticker.
- Việc ngày cũ không dồn sang hôm sau (không tạo áp lực "nợ việc").
- Việc "giúp hàng xóm" chỉ được rút khi người chơi đã có hàng xóm.

### 6.3 Nhiệm vụ tuần (dùng chung `MissionRules`)

Thêm 2 nhiệm vụ: `farm_harvest` "Thu hoạch 30 ô" (20 xu), `farm_help` "Giúp hàng xóm 10 lần" (15 xu, mặc định tắt cho tới khi có đủ người chơi). Hai nhiệm vụ này thuộc ngân sách nhiệm vụ tuần chung, không thuộc trần nông trại.

## 7. Chương nhiệm vụ: "Khu vườn của Leo"

Cốt truyện ngắn: Leo nhận lại mảnh vườn cũ của ông Mầm ở Đồi Nắng. Bé Mầm (tinh linh hạt giống) dẫn Leo hồi sinh vườn, kết bạn với chó Bông, Bác Bù Nhìn, Cô Thỏ ở chợ và cô Ong Mật. Mỗi chương mở một nhân vật và một phần vườn.

Nhịp: **chương chính kéo dài khoảng 4-5 tuần** với người ghé 2 lần/ngày (6-8 tuần nếu ghé 1 lần). Mỗi chương có ít nhất một nhiệm vụ cần **số ngày khác nhau** (để không làm xong trong một buổi) và một nhiệm vụ nối với anyLEARN.

| Chương | Tên | Mở khi | Nhiệm vụ (ví dụ) | Thưởng | Dự kiến |
|---|---|---|---|---|---|
| 1 | Hạt mầm đầu tiên | Vào lần đầu | Gieo 4 ô · Tưới 4 lần · Thu hoạch 1 vụ · Bán 1 lần ở chợ · Ủ 1 mẻ phân | 20 xu, ô 5 miễn phí, gói hạt | 15-20 phút, ngày 1 |
| 2 | Chợ Đồi Nắng | Xong chương 1 | Giao 3 đơn · Trồng 3 loại · Chăm vườn 2 ngày khác nhau · Đạt cấp 3 | 40 xu, Cô Thỏ, hàng rào gỗ | ngày 2-3 |
| 3 | Hạt giống Tri thức | Cấp 3 | Trồng 1 Cây Tri thức (cần đi học / học video) · Thu 1 quả diệu kỳ · Bón phân 5 lần · Chăm vườn 4 ngày | 60 xu, banner thành tích, sticker | ngày 4-7 |
| 4 | Hàng xóm thân thiện | Cấp 5 | Kết 1 hàng xóm (mời bạn hoặc gợi ý) · Tưới giúp 5 lần · Làm 1 bó hoa · Giao đơn "Tặng cô giáo" | 80 xu, chó Bông (canh hoa), xích đu | tuần 2 |
| 5 | Ngày hội hoa | Cấp 8 | Trồng đủ 4 loại hoa · Giao 10 đơn · Mở chỗ cây lâu năm · Xem 1 khóa học trên anyLEARN | 100 xu, cô Ong Mật, đèn lồng | tuần 3 |
| 6 | Đồi Nắng rực rỡ | Cấp 11 | Thu 100 ô · Đạt 10 loại cây trong sổ · Chăm vườn 14 ngày · Mời 1 bạn chơi | 150 xu, nhà Leo, banner, anyPoint (mặc định 0) | tuần 4-5 |

Sau chương 6: **Mùa** (sự kiện 2-3 tuần do admin tạo, mục 11.1): cây mùa, 5-6 nhiệm vụ, đồ trang trí mùa, không có anyPoint.

- Kiểu nhiệm vụ là danh sách cố định trong code (`FarmQuestTypes`: `plant`, `water`, `harvest`, `sell`, `order`, `compost`, `fertilize`, `distinct_days`, `distinct_crops`, `level`, `neighbor`, `help`, `bouquet`, `knowledge_tree`, `expand`, `perennial`, `view_course`, `invite`), mỗi kiểu kiểm bằng dữ liệu thật (như `JourneyService.done`). Nội dung chương (tên, thứ tự, kiểu + tham số, thưởng) nằm trong bảng, admin sửa được.
- Nhận thưởng: một lần (`farm_quest_claims`), qua hiệu ứng `LeoReward`.

## 8. Tương tác với người chơi khác

### 8.1 Hàng xóm

- Nguồn hàng xóm: người mời / người được mời (`users.user_id`), thêm bằng mã giới thiệu hoặc SĐT (bên kia đồng ý), và **"Vườn gợi ý"**: 6 vườn của bất kỳ người chơi đủ điều kiện, xếp ưu tiên vườn có ô khát nước và hoa có thể hái (chỉ ghé, tưới, hái, không xem hồ sơ).
- Tối đa `farm/max_neighbors` (30). Chỉ hiện tên 2 chữ cuối + cấp vườn + ảnh vườn. Không nhắn chữ tự do (tránh kiểm duyệt): chỉ **thả biểu cảm** dựng sẵn (Leo vẫy tay, tim, ngón cái, hoa).
- Chỉ người đủ điều kiện (`StickerService.eligible`: tài khoản ≥ 3 ngày, ≥ 3 ngày điểm danh) và không bị chặn mới tương tác.

### 8.2 Tưới và bón giúp

- Ghé vườn bạn, ô đang khát hiện giọt nước. Tưới giúp = như chủ tưới. Bón giúp dùng **phân của người giúp** (món quà thật).
- Giới hạn: người giúp `farm/help_daily` (10 lần/ngày); mỗi vườn nhận `farm/help_received_daily` (15 lần/ngày); mỗi ô mỗi lần khát chỉ 1 người giúp.
- Người giúp nhận 3 XP + 1 "tim hàng xóm" (đổi đồ trang trí hàng xóm như hộp thư, bảng tên; không đổi ra xu).
- Chủ vườn thấy trong bản tóm tắt cuối ngày (mục 9), không có thông báo từng lần.

### 8.3 Hái trộm hoa (có hạn chế)

- Chỉ **hoa** (và cây mùa nhóm hoa), chỉ ô **đã chín quá** `farm/steal_grace_minutes` (60) mà chủ chưa thu (tạo cửa sổ cho chủ thu trước).
- Mỗi lần hái **1 bông**; một ô bị hái tối đa `farm/steal_per_plot` (1) lần, và luôn để lại ít nhất 3 bông cho chủ.
- Người hái: `farm/steal_daily` (3 lần/ngày), mỗi vườn 1 lần/ngày. Mỗi vườn bị hái tối đa `farm/stolen_daily` (3 bông/ngày).
- **Chó Bông** (mở ở chương 4) canh vườn: `farm/catch_chance` (25%) bắt được, người hái về tay không và chủ vườn được 1 tim. **Bù nhìn** (5 xu) chặn hẳn 12 giờ.
- Hoa hái được vào kho "nhận được": **không bán ra chợ**, chỉ dùng cho đơn, bó hoa, bộ sưu tập.
- Công tắc "Cho hái trộm" trong vườn (mặc định bật): tắt thì vườn mình an toàn nhưng **mình cũng không hái được của ai** (công bằng).
- Câu chữ vui, không ác ý: "Leo hái lén 1 bông hoa nắng mai ở vườn Mẹ Bin... bị chó Bông đuổi chạy mất dép!".

### 8.4 Tặng quà

1 nông sản mỗi ngày cho mỗi hàng xóm, tối đa 3 món/ngày. Món nhận vào kho "nhận được". Không tặng xu, không tặng hạt.

## 9. Nhắc nhở hằng ngày mà không spam

Nguyên tắc: **ưu tiên dấu đỏ trong app, thông báo đẩy là ngoại lệ**.

- Trong app: chấm đỏ trên tab "Vui học", ô "Nông trại" ở `FunShortcuts` khi có ô chín / việc hôm nay chưa xong; `LeoGuide` có một câu ("Vườn có 3 ô chín rồi nè!") trên trang `/fun` và `/today`, theo luật hiện có (tối đa 1 lần tự mở mỗi trang mỗi ngày).
- Thông báo đẩy (`NotificationService`, topic `fun`, người dùng tắt được):
  - Tối đa **1 thông báo nông trại mỗi ngày** (`farm/push_daily_max`), chỉ trong `farm/push_from_hour`..`push_to_hour` (8-20), không gửi nếu cùng ngày đã có nhắc Đấu trường.
  - Chỉ gửi khi đáng: ≥ 50% ô đã chín, hoặc có ô sắp bắt đầu héo trong 2 giờ. Không gửi nếu người chơi vừa vào vườn trong 3 giờ qua.
  - **Gộp** tóm tắt xã hội vào cùng thông báo đó (19:00): "Vườn có 4 ô chín. Hôm nay 3 bạn tưới giúp, 1 bông hoa bị hái."
  - **Lùi dần**: 3 thông báo liên tiếp không mở → chỉ 1 thông báo mỗi 3 ngày; 7 ngày không vào vườn → ngừng hẳn; ngày thứ 14 gửi đúng **một** tin "Leo đã tưới giúp cả vườn, về thu hoạch nhé" (kèm 1 gói hạt), sau đó im lặng.
  - Trong vườn có lựa chọn: "Nhắc khi vườn chín" / "Chỉ tóm tắt" / "Không nhắc".
- Mỗi tin claim trước trong `farm_push_log` (khóa duy nhất người + ngày), nên không bao giờ gửi đôi. Không gửi email, không ZNS cho nông trại.

## 10. Giao diện (FE)

- Trang `/fun/farm` (full page, nút quay lại, không popup; bảng chọn dùng bottom sheet như ví voucher). Lưới **nhìn nghiêng 3/4** kiểu isometric mềm: 3 cột × 4 hàng ô hình thoi trên đồi cỏ, vừa 360 px. Vẽ bằng DOM + ảnh PNG xếp lớp + CSS (không thêm thư viện game). Cuộn dọc để xem chỗ cây lâu năm, ao, nhà Leo.
- Thanh dưới theo ngữ cảnh: chạm ô trống → hàng hạt cuộn ngang (giá, thời gian, "+lãi khi bón"); chạm ô đang lớn → Tưới / Bón / thời gian còn lại; ô chín → Thu. Nút lớn "Thu tất cả · Tưới tất cả".
- Leo làm vườn đi tới ô được chạm (CSS transition, 3 tư thế: tưới, thu, vẫy tay), đêm (sau 19:00 theo giờ máy) đổi nền tối, bí đèn lồng và tulip phát sáng.
- Thu hoạch: quả bay vào giỏ (CSS), XP chạy; thưởng lớn (chương, cấp) dùng `LeoReward`. Xu bay vào `CoinIcon`.
- Trang con: `/fun/farm/market` (chợ + thanh trần lãi), `/fun/farm/orders`, `/fun/farm/quests` (chương + việc hôm nay), `/fun/farm/neighbors` (hàng xóm, vườn gợi ý), `/fun/farm/visit/{userId}`, `/fun/farm/book` (sổ cây: đã trồng / chưa mở, như album sticker), `/fun/farm/decor` (chế độ đặt đồ trang trí).
- `/fun` thêm ô "Nông trại" trong `FunShortcuts` và thẻ nhỏ "Vườn của bạn: 3 ô chín" dưới banner Đấu trường. Leo xu, nhãn nguồn, tên Leo dùng `BrandText`.
- Ảnh chia sẻ: `shareCards.ts` thêm thẻ `farm`; `/fun/farm/visit/{id}` của người khác chia sẻ được ("Ghé vườn của Mẹ Bin").

## 11. Admin ("Giải trí" > "Nông trại Leo", `/fun-farm`)

### 11.1 Các tab

1. **Tổng quan**: người chơi hôm nay / 7 ngày, số vụ, ô đang trồng, phân bố cấp, tỉ lệ chạm trần lãi, top cây được trồng, top lãi ròng.
2. **Cây trồng**: CRUD danh mục (tên, nhóm, mức thời gian hoặc số tự đặt, giá hạt, giá bán, sản lượng chuẩn, số lần tưới, XP, cấp mở, hái trộm được, mùa, ảnh 4 giai đoạn + ảnh sản phẩm, bật/tắt, thứ tự). Mỗi dòng hiện **lãi chăm đủ, lãi bón, lãi/giờ** tính ngay khi sửa; dòng đỏ khi lãi bón > 60% hoặc lỗ khi chăm đủ.
3. **Kinh tế**: form `FIELDS` (`farm/*`, mục 12.2) + **máy mô phỏng** (11.3).
4. **Chương & mùa**: sửa chương, nhiệm vụ (chọn kiểu + tham số), thưởng; tạo mùa (tên, từ ngày, tới ngày, cây mùa, nhiệm vụ, đồ trang trí).
5. **Việc hằng ngày & đơn hàng**: danh sách việc, trọng số, thưởng; khung đơn (số món, hệ số thưởng, thời gian chờ).
6. **Cửa hàng nông trại**: đồ trang trí, trang phục Leo, nâng cấp, giá, bật/tắt (cùng danh mục `ShopService` để `/fun/shop` hiện chung, game `farm`).
7. **Hàng xóm & hái trộm**: giới hạn, nhật ký tương tác, người bị gắn cờ (thao tác bất thường, cùng thiết bị), chặn tương tác một người.
8. **Nhắc nhở**: công tắc, giờ gửi, ngưỡng, xem trước số người sẽ nhận hôm nay, thống kê mở.
9. **Người chơi**: tra theo SĐT, xem vườn, kho, sổ xu nông trại; tặng / trừ đồ, đặt lại vườn (ghi lý do, như "Tiền game").

### 11.2 Sức khỏe kinh tế (trong tab Tổng quan, cũng thêm vào `GET /admin/fun/health`)

- Leo Xu **vào / ra theo nguồn nông trại** 7 / 30 ngày, **lãi ròng trung bình mỗi người chơi / tuần**, phân vị 50 / 90 / 99.
- **Hệ số sink** = xu chi trong nông trại ÷ xu thu từ nông trại (mục tiêu ≥ 0,8; vàng < 0,8, đỏ < 0,6).
~~- "Số tuần chơi chăm để đổi voucher Leo Xu rẻ nhất" (đọc giá từ `voucher_groups.coin_price`).~~ (đã tắt, xem ghi chú 09/11 ở đầu mục 1)
- Cảnh báo khi lãi ròng tuần p90 vượt 90% trần tuần trong 2 tuần liền (gợi ý giảm giá bán / tăng giá hạt).

### 11.3 Máy mô phỏng (thuần, `FarmEconomySim`, có test)

Admin chọn hồ sơ (ghé 1 / 2 / 4 lần/ngày, số ô, có bón không, cấp) → máy tính chạy 7 ngày theo cấu hình hiện tại (cả cấu hình đang sửa chưa lưu): XP, cấp đạt được, Leo Xu thu, chi, lãi ròng, ngày chạm trần. Dùng để kiểm tra trước khi đổi giá.

## 12. Dữ liệu và backend

### 12.1 Bảng (V83__farm.sql, phác thảo)

```sql
CREATE TABLE farm_crops (            -- catalog, admin edits
  crop_key VARCHAR(40) PRIMARY KEY, name VARCHAR(80) NOT NULL,
  category VARCHAR(16) NOT NULL,     -- veg | flower | magic | tree | season
  grow_minutes INT NOT NULL, water_needs INT NOT NULL DEFAULT 1,
  seed_price INT NOT NULL, unit_price INT NOT NULL, base_yield INT NOT NULL DEFAULT 4,
  xp INT NOT NULL, unlock_level INT NOT NULL DEFAULT 1, stealable TINYINT NOT NULL DEFAULT 0,
  seed_source VARCHAR(16) NOT NULL DEFAULT 'shop', -- shop | knowledge | event
  cycle_minutes INT NULL, cycles INT NULL,          -- perennial only
  season_from DATE NULL, season_to DATE NULL,
  image_seedling VARCHAR(255), image_growing VARCHAR(255), image_ripe VARCHAR(255), image_product VARCHAR(255),
  description VARCHAR(255), sort_order INT NOT NULL DEFAULT 0, active TINYINT NOT NULL DEFAULT 1
);
CREATE TABLE farm_profiles (
  user_id BIGINT PRIMARY KEY, level INT NOT NULL DEFAULT 1, xp BIGINT NOT NULL DEFAULT 0,
  plots INT NOT NULL DEFAULT 4, tree_slots INT NOT NULL DEFAULT 0, storage_cap INT NOT NULL DEFAULT 60,
  can_level INT NOT NULL DEFAULT 1, compost_slots INT NOT NULL DEFAULT 1,
  allow_steal TINYINT NOT NULL DEFAULT 1, guard_until DATETIME NULL, has_dog TINYINT NOT NULL DEFAULT 0,
  push_mode VARCHAR(12) NOT NULL DEFAULT 'ripe', push_ignored INT NOT NULL DEFAULT 0,
  last_visit_at DATETIME NULL, social_blocked TINYINT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL
);
CREATE TABLE farm_plots (
  user_id BIGINT NOT NULL, slot INT NOT NULL, kind VARCHAR(8) NOT NULL DEFAULT 'plot', -- plot | tree
  crop_key VARCHAR(40) NULL, planted_at DATETIME NULL, grow_minutes INT NULL,
  waters_done INT NOT NULL DEFAULT 0, thirsty_since DATETIME NULL, growth_lost_seconds INT NOT NULL DEFAULT 0,
  missed_waters INT NOT NULL DEFAULT 0, fertilized TINYINT NOT NULL DEFAULT 0,
  stolen INT NOT NULL DEFAULT 0, cycles_left INT NULL, cycle_started_at DATETIME NULL,
  PRIMARY KEY (user_id, slot)
);
CREATE TABLE farm_inventory (
  user_id BIGINT NOT NULL, item_key VARCHAR(40) NOT NULL, -- crop_key, 'fertilizer', 'knowledge_seed', 'seed:{crop}', 'bouquet', 'wilted'
  qty_own INT NOT NULL DEFAULT 0, qty_received INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_key)
);
CREATE TABLE farm_day_stats (        -- drives the profit cap, one row per user and day
  user_id BIGINT NOT NULL, day DATE NOT NULL,
  coins_in INT NOT NULL DEFAULT 0, coins_spent INT NOT NULL DEFAULT 0,
  units_sold_json JSON NULL, knowledge_seed TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE farm_compost (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, ready_at DATETIME NOT NULL, collected_at DATETIME NULL);
CREATE TABLE farm_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, slot INT NOT NULL,
  items_json JSON NOT NULL, reward_json JSON NOT NULL, kind VARCHAR(16) NOT NULL DEFAULT 'normal', -- normal | teacher | season
  status VARCHAR(12) NOT NULL DEFAULT 'open', available_at DATETIME NOT NULL, done_at DATETIME NULL,
  KEY idx_farm_order_user (user_id, status)
);
CREATE TABLE farm_task_defs (task_key VARCHAR(40) PRIMARY KEY, label VARCHAR(120), type VARCHAR(24), target INT, weight INT, xp INT, reward_item VARCHAR(40), active TINYINT);
CREATE TABLE farm_daily_tasks (user_id BIGINT, day DATE, slot INT, task_key VARCHAR(40), claimed_at DATETIME NULL, PRIMARY KEY (user_id, day, slot));
CREATE TABLE farm_chapters (id INT PRIMARY KEY, title VARCHAR(120), story TEXT, unlock_level INT, reward_json JSON, season_id BIGINT NULL, sort_order INT, active TINYINT);
CREATE TABLE farm_quests (quest_key VARCHAR(60) PRIMARY KEY, chapter_id INT, label VARCHAR(160), type VARCHAR(24), params_json JSON, reward_json JSON, sort_order INT, active TINYINT);
CREATE TABLE farm_quest_claims (user_id BIGINT, quest_key VARCHAR(60), claimed_at DATETIME, PRIMARY KEY (user_id, quest_key)); -- chapter rewards as 'chapter:{id}'
CREATE TABLE farm_seasons (id BIGINT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(120), starts_on DATE, ends_on DATE, theme VARCHAR(40), active TINYINT);
CREATE TABLE farm_neighbors (user_id BIGINT, neighbor_id BIGINT, status VARCHAR(10), source VARCHAR(12), created_at DATETIME, PRIMARY KEY (user_id, neighbor_id));
CREATE TABLE farm_social_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id BIGINT NOT NULL, owner_id BIGINT NOT NULL, day DATE NOT NULL,
  kind VARCHAR(12) NOT NULL, -- water | fertilize | steal | caught | gift | emote
  slot INT NULL, item_key VARCHAR(40) NULL, qty INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL,
  KEY idx_fsl_actor (actor_id, day, kind), KEY idx_fsl_owner (owner_id, day, kind)
);
CREATE TABLE farm_decor_defs (decor_key VARCHAR(40) PRIMARY KEY, name VARCHAR(80), kind VARCHAR(16), price INT, currency VARCHAR(8), unlock_level INT, image VARCHAR(255), w INT, h INT, season_id BIGINT NULL, active TINYINT);
CREATE TABLE farm_decor (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT, decor_key VARCHAR(40), x INT NULL, y INT NULL, placed TINYINT DEFAULT 0);
CREATE TABLE farm_push_log (user_id BIGINT, day DATE, kind VARCHAR(16), sent_at DATETIME, opened_at DATETIME NULL, PRIMARY KEY (user_id, day));
```

Bỏ dấu tiếng Việt trong comment SQL như các migration khác.

### 12.2 Cài đặt (`FarmSettings.FIELDS`, một bảng đọc / lưu / sinh form)

`farm/enabled`, `farm/thirsty_speed` 50, `farm/thirst_grace_minutes` 60, `farm/min_yield` 2, `farm/base_yield` 4, `farm/ripe_hours_min` 4, `farm/wilt_step_hours` 6, `farm/compost_units` 5, `farm/compost_minutes` 120, `farm/fertilizer_price` 3, `farm/storage_base` 60, `farm/price_jitter` 20, `farm/same_crop_full_units` 12, `farm/same_crop_steps` `70,40`, `farm/profit_cap_base` 8, `farm/profit_cap_per_level` 0.5, `farm/profit_cap_max` 18, `farm/weekly_profit_cap` 70, `farm/order_slots` `3,4@8,5@15`, `farm/order_coin_mult` 1.1, `farm/order_refill_minutes` 45, `farm/task_xp` 20, `farm/task_box_coins` `3,6`, `farm/xp_base` 40, `farm/xp_exp` 1.4, `farm/level_coins` 5, `farm/knowledge_seeds_daily` 1, `farm/magic_sticker_chance` 3, `farm/max_neighbors` 30, `farm/help_daily` 10, `farm/help_received_daily` 15, `farm/steal_enabled` 1, `farm/steal_grace_minutes` 60, `farm/steal_daily` 3, `farm/stolen_daily` 3, `farm/catch_chance` 25, `farm/guard_hours` 12, `farm/gift_daily` 3, `farm/actions_per_minute` 60, `farm/push_daily_max` 1, `farm/push_from_hour` 8, `farm/push_to_hour` 20, `farm/push_digest_hour` 19, `farm/push_backoff_after` 3, `farm/push_stop_days` 7, `farm/comeback_day` 14, `farm/anypoint_level_10|20|30`, `farm/anypoint_chapter_6`, `farm/anypoint_accounts`.

### 12.3 Service (`service/farm`, JdbcTemplate như các game khác)

- Thuần, có test: `FarmPlotRules` (trạng thái ô từ thời gian, khát, héo, sản lượng), `FarmMarketRules` (giá hôm nay, giảm theo số lượng, phần còn lại của trần), `FarmLevelRules`, `FarmOrderRules`, `FarmSocialRules` (giới hạn giúp / hái / tặng, cửa sổ chín, chó bắt), `FarmPushRules` (có gửi không, lùi dần), `FarmEconomySim`.
- `FarmService` (vườn, gieo, tưới, bón, thu, ủ), `FarmMarketService`, `FarmOrderService`, `FarmQuestService` (kiểm nhiệm vụ trên dữ liệu thật), `FarmSocialService`, `FarmKnowledgeService` (nghe sự kiện điểm danh / bài video / hoàn thành khóa), `FarmPushService` (chạy mỗi 30 phút, claim `farm_push_log`).
- Mọi thao tác ghi khóa dòng `farm_profiles` (`FOR UPDATE`) để hai tab không thu đôi. Mỗi thao tác ghi `game_events` (game `farm`: `plant`, `water`, `harvest`, `sell`, `order`, `help`, `steal`, `compost`).

### 12.4 API (đăng nhập, sau `FunAccessInterceptor` game `farm`)

`GET /api/farm` (vườn + kho + việc hôm nay + giá chợ + trần còn lại + `serverNow`), `POST /api/farm/plant {slot, cropKey}`, `POST /api/farm/water {slots[]}`, `POST /api/farm/fertilize {slot}`, `POST /api/farm/harvest {slots[]}`, `POST /api/farm/compost` / `compost/{id}/collect`, `GET /api/farm/market`, `POST /api/farm/sell {items:[{key, qty}]}`, `POST /api/farm/buy {key, qty}` (hạt, phân, bù nhìn; qua `ShopService`), `POST /api/farm/expand {kind}`, `GET /api/farm/orders`, `POST /api/farm/orders/{id}/deliver|skip`, `POST /api/farm/bouquet`, `GET /api/farm/quests`, `POST /api/farm/quests/{key}/claim`, `POST /api/farm/tasks/{slot}/claim`, `GET /api/farm/neighbors`, `POST /api/farm/neighbors {code|phone}`, `POST /api/farm/neighbors/{id}/accept|remove`, `GET /api/farm/visit/{userId}`, `POST /api/farm/visit/{userId}/water|fertilize|steal|gift|emote`, `PUT /api/farm/prefs {allowSteal, pushMode}`, `GET /api/farm/book`, `GET|PUT /api/farm/decor`.

Admin `/admin/farm/*`: `overview`, `health`, `crops` CRUD + `upload`, `settings` GET/PUT, `simulate`, `chapters`, `quests`, `seasons`, `tasks`, `decor`, `social-log`, `players/{userId}` (+ `grant`, `reset`), `push-stats`. `GET /admin/badges` thêm `farmFlagged`. Mẫu `http/farm.http`.

## 13. Chia việc

| # | Việc | Nội dung | Asset cần |
|---|---|---|---|
| 22.1 | Lõi vườn | V83, danh mục 8 cây đầu (rau mầm, cà rốt, bắp rang, khoai, cà chua, hoa nắng mai, hoa nốt nhạc, cây chữ cái), gieo / tưới / bón / thu / ủ, kho, `/fun/farm`, mở dần (testers), FunShortcuts | nền vườn, 4 ô đất, 8 cây × 4 ảnh, Leo làm vườn 3 tư thế, icon dụng cụ |
| 22.2 | Chợ + trần lãi | Giá hôm nay, giảm theo số lượng, trần ngày / tuần, `farm_day_stats`, admin Kinh tế + mô phỏng + sức khỏe | Cô Thỏ, quầy chợ |
| 22.3 | Cấp, đơn hàng, việc hôm nay | XP, mở khóa, bảng đơn, bó hoa, việc hằng ngày, nhiệm vụ tuần `farm_harvest` | Bác Bù Nhìn, bảng tin |
| 22.4 | Chương 1-6 + Hạt Tri thức | Bảng chương / nhiệm vụ, `FarmQuestService`, nối điểm danh / video / hoàn thành khóa, banner thành tích, anyPoint mốc (0) | Bé Mầm, 6 tranh chương, Cây Tri thức |
| 22.5 | Hàng xóm | Danh sách, gợi ý, tưới / bón giúp, tặng, biểu cảm, hái trộm + chó Bông + bù nhìn, nhật ký admin | chó Bông, bù nhìn, hộp thư |
| 22.6 | Nhắc nhở | `FarmPushService`, lùi dần, chấm đỏ, câu `LeoGuide` | minh họa thông báo |
| 22.7 | Trang trí, mở rộng, cây lâu năm | Đặt đồ, ô 5-12, chỗ cây, kho, bình tưới, trang phục Leo; thêm toàn bộ cây | đồ trang trí, cây lâu năm, các cây còn lại |
| 22.8 | Mùa + vật nuôi | Mùa đầu tiên (Tết 2027), gà / ong / bò | cây mùa, vật nuôi |

Mỗi phần một hoặc vài commit, cập nhật `CLAUDE.md`, `docs/huong-dan-admin.md`, `plans/PROGRESS.md`. 22.1-22.4 là bản ra mắt cho nhóm thử; 22.5 khi có từ 50 người chơi đều.

Test: thuần cho mọi `*Rules` và `FarmEconomySim`; `FarmFlowTest` trên schema thật (đồng hồ di chuyển được như `ArenaFlowTest`): gieo → khát → tưới → chín → héo → thu → bán đụng trần; hái trộm đủ mọi giới hạn; hai luồng thu cùng lúc chỉ thu một lần.

## 14. Quyết định của chủ sản phẩm (09/11/2026)

~~1. **Giá voucher Leo Xu**: giữ như đang bán (500 xu: 10% tối đa 50K; 1.000 xu: 15% tối đa 100K, mỗi tháng 1 lần). Mục 4.3 và 4.4 đã tính theo mốc này.~~ (đã tắt, xem ghi chú 09/11 ở đầu mục 1)
2. **Trần lãi tuần**: chưa trả lời, **giữ mặc định 70 xu/tuần** (admin sửa được, theo dõi bằng trang sức khỏe kinh tế).
3. **anyPoint mốc lớn**: mặc định **0**, admin bật khi muốn (`farm/anypoint_level_10|20|30`, `anypoint_chapter_6`, `anypoint_accounts`).
4. **Hái trộm**: **bật ngay khi ra mắt**; 22.5 vẫn làm sau 22.1-22.4 nhưng hái trộm không chờ đủ người chơi (công tắc `farm/steal_enabled` mặc định 1).
5. **Vườn gợi ý**: gồm **mọi người chơi** (không chỉ hàng xóm), **ưu tiên vườn đang có ô khát nước và vườn có hoa hái trộm được** (hoa đã chín quá `steal_grace_minutes`); chỉ thấy tên 2 chữ cuối + cấp, và chỉ vườn của người đủ điều kiện (`StickerService.eligible`) và chưa tắt "Cho hái trộm" mới được gợi ý để hái. Giới hạn hái / giúp ở mục 8 vẫn áp dụng.
6. **Tên game**: **Nông trại anyLEARN**.
