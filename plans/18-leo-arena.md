# Plan 18: Đấu trường Leo (thi đố vui trực tiếp mỗi tối)

Mục tiêu: mỗi ngày (mặc định 20:00) hệ thống tự mở một trận đố vui chung: mọi người cùng nhận một câu hỏi cùng lúc, đúng +1 điểm, bảng xếp hạng cập nhật sau mỗi câu. Người chơi hẹn trước bằng "Nhắc tôi" để nhận thông báo (app / email / ZNS do admin chọn). Admin bật tắt, cấu hình mọi thứ và theo dõi trận trực tiếp. Không cần ai bấm chạy.

Mockup đã duyệt: https://claude.ai/artifact/D7AWdwkdBTGATsjESzetnr (banner, sảnh, màn câu hỏi, trang xếp hạng, admin). Làm đúng theo mockup, chỗ nào plan và mockup khác nhau thì theo plan.

Làm trên **nhánh mới tách từ `main`** (vd `claude/leo-arena`), mỗi phần 18.x một commit hoặc vài commit, cuối cùng một PR.

## 0. Hiện trạng dùng lại (đọc từ code)

- Kho câu hỏi: `quiz_questions` (topic, difficulty 1..5, body, opt_a..d, `correct` 0..3, explanation, status), `quiz_topics`. Cách chọn câu không lặp có fallback: `QuizGameService.chooseQuestion/pick` (đừng sửa hàm của Leo rank; viết hàm chọn riêng trong `ArenaQuestionPicker`, cùng thứ tự fallback: chủ đề → mức gần → câu đã dùng).
- Đồng hồ máy chủ: bean `java.time.Clock` (QuizGameService dùng `clock`), FE `clockOffset(serverNow)` trong `lib/quiz/rules.ts`. Mọi mốc giờ của Đấu trường tính từ giờ máy chủ.
- Giao diện câu hỏi: `components/fun/quiz/QuestionView.tsx` (4 đáp án, thanh giờ). Đấu trường dùng bản gọn riêng (`ArenaQuestion`) vì không có vật phẩm, nhưng tái dùng style nút đáp án và `StarBurst` nếu hợp.
- Tên hiển thị: `QuizBoardRules.displayName` (2 chữ cuối, không bao giờ SĐT/email). Ẩn khỏi bảng: `quiz_profiles.hide_board` / `board_blocked` (dùng lại, không tạo cờ mới).
- Tiền game: `CoinService.credit` (thêm `SOURCE_ARENA = "arena"`; nhãn trong `anylearn_v2/src/lib/fun/coins.ts` và admin `pages/FunCoins.jsx`). Sticker: `StickerService.dropRandom(userId, "arena", ref)`. Banner thành tích: `AchievementService.grant(userId, "arena", "arena:{day}:{rank}", title, subtitle, icon)` (+ `achievement/type_arena` trong `AchievementSettings`).
- Sự kiện game: `GameEventService.record(userId, "arena", type, detail, coins)`.
- Thông báo: `NotificationService.createNotification` (chuông + push, kiểm tra công tắc của người dùng), `NotificationService.emailTemplate(userId, type, templateKey, subject, vars)` (template HTML mới), `ZnsService.sendTemplate(phone, templateId, data)` (không có appId thì chỉ log STUB). Topic `fun` đã có trong `NotificationTopics`.
- Mở dần: `FunAccessRules.GAMES`, `FunAccessInterceptor` (đăng ký trong `WebConfig`), `GET /api/fun/access`, `FunShortcuts`.
- Leo: `components/fun/Leo.tsx` (SVG, viewBox `-30 -8 60 64`), khiên rank = đường `OUTLINE` trong `components/fun/quiz/RankBadge.tsx`. Viền sáng chạy: `.glow-ring` trong `globals.css`.
- Migration mới nhất: V66 → Đấu trường là **V67**.

## 1. Luật chơi (đã thể hiện trong mockup)

- Một **trận** mỗi ngày chạy (ngày trong tuần do admin chọn), bắt đầu `arena/start_time` (20:00). Phòng mở trước `arena/open_minutes` (10) phút.
- `question_count` câu (**20**). Mọi người chơi **cùng một bộ câu, cùng thứ tự câu và cùng thứ tự 4 đáp án** (thứ tự đáp án như trong kho, không xáo). Bộ câu chia đều theo cấp độ (từ dễ đến khó) và theo chủ đề (xoay vòng). Câu thứ `i` (0-based) **hiện lúc** `Q_i = startsAt + i × gap_seconds`.
  - `Q_i − countdown_seconds` (10 s): mọi máy đang ở sảnh tự chuyển sang màn đếm ngược 10 → 1.
  - `Q_i` → `Q_i + answer_seconds` (15 s): trả lời. Không vật phẩm, không năng lượng, không ảnh hưởng sao Leo rank.
  - Chọn xong: đáp án bị khóa (viền vàng), dưới dòng đồng hồ hiện "Đã chọn · đang chờ người khác trả lời (131/176)". **Chưa** cho biết đúng sai.
  - **Hết giờ mới hiện** đúng/sai + đáp án đúng cho tất cả (server không trả đáp án đúng trước `Q_i + answer_seconds`).
  - `Q_i + answer_seconds` → `+ reveal_seconds` (5 s): xem đáp án, rồi tự về sảnh với bảng đã cập nhật.
  - `gap_seconds` (60) phải ≥ countdown + answer + reveal + 10 (kiểm khi lưu cấu hình).
- Điểm: đúng +1. Xếp hạng: điểm giảm dần, rồi **tổng ms của các câu đúng** tăng dần, rồi ai nhấn "Nhắc tôi"/vào phòng sớm hơn.
- Vào trễ: được chơi các câu còn lại. Câu đã qua tính 0.
- Đáp án đúng không rời server trước khi hết giờ của câu, kể cả với người đã trả lời.
- Gửi trả lời trễ hơn `Q_i + answer_seconds + 2 s` = không tính (giống `QuizGameService.answer`). Chỉ một lần trả lời mỗi câu.
- Gắn cờ: đúng nhanh hơn `arena/flag_fast_ms` (1000), hoặc trang bị ẩn lúc trả lời (`away`, như Leo rank) khi `arena/flag_away` bật. Cờ không trừ điểm; người bị cờ trong top 3 chỉ nhận quà khi admin bỏ cờ (trừ khi `arena/flagged_reward = 1`).
- "Nhắc tôi" = đăng ký trận gần nhất chưa xong (hôm nay nếu chưa kết thúc, không thì trận kế tiếp). Bấm lại "Bạn đã hứa sẽ tham gia" → hỏi lại trong trang (không dùng `confirm()`), đồng ý thì bỏ đăng ký.
- "Trong phòng" = gửi tín hiệu từ sảnh/màn câu hỏi trong 30 s gần nhất (`arena/presence_seconds`).
- Quà top 3 (sau khi trận xong): `reward_coins` (mặc định `300,200,100` Leo Xu), `reward_sticker` (1 sticker ngẫu nhiên), chỉ khi điểm ≥ `reward_min_score` (3); `reward_achievement` tạo banner thành tích.
- **Thưởng tham gia**: mọi người ngoài top 3 đã trả lời ít nhất 1 câu nhận `reward_participation` (20) Leo Xu (người bị loại không nhận; người bị cờ vẫn nhận). Top 3 không đạt điểm tối thiểu cũng nhận thưởng tham gia.
- Mọi khoản trả một lần (cột `rewarded_at`, `reward_coins` ghi số đã trả).

## 2. Dữ liệu: V67__leo_arena.sql

```sql
CREATE TABLE arena_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  starts_at DATETIME NOT NULL,
  open_at DATETIME NOT NULL,
  question_count INT NOT NULL,
  countdown_seconds INT NOT NULL,
  answer_seconds INT NOT NULL,
  reveal_seconds INT NOT NULL,
  gap_seconds INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'scheduled',   -- scheduled | live | done | cancelled
  reminders_sent_at DATETIME NULL,
  settled_at DATETIME NULL,
  players INT NOT NULL DEFAULT 0,                    -- filled at settlement
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE arena_questions (
  session_id BIGINT NOT NULL,
  q_no INT NOT NULL,                                 -- 1-based
  question_id BIGINT NOT NULL,
  topic VARCHAR(40) NOT NULL,
  difficulty INT NOT NULL,
  PRIMARY KEY (session_id, q_no),
  KEY idx_arena_q_question (question_id)
);
CREATE TABLE arena_entries (
  session_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  registered_at DATETIME NULL,                       -- pressed "Nhắc tôi"
  entered_at DATETIME NULL,                          -- first time in the room
  last_seen_at DATETIME NULL,
  score INT NOT NULL DEFAULT 0,
  correct_ms BIGINT NOT NULL DEFAULT 0,
  answered INT NOT NULL DEFAULT 0,
  flagged TINYINT NOT NULL DEFAULT 0,
  flag_reason VARCHAR(191) NULL,
  disqualified TINYINT NOT NULL DEFAULT 0,
  final_rank INT NULL,
  reward_coins INT NOT NULL DEFAULT 0,
  rewarded_at DATETIME NULL,
  reminded_at DATETIME NULL,
  PRIMARY KEY (session_id, user_id),
  KEY idx_arena_entry_rank (session_id, score, correct_ms)
);
CREATE TABLE arena_answers (
  session_id BIGINT NOT NULL,
  q_no INT NOT NULL,
  user_id BIGINT NOT NULL,
  option_idx INT NULL,                               -- 0..3 as stored in quiz_questions, NULL = none
  correct TINYINT NOT NULL,
  ms INT NOT NULL,                                   -- from Q_i to the answer
  away TINYINT NOT NULL DEFAULT 0,
  flagged TINYINT NOT NULL DEFAULT 0,
  answered_at DATETIME NOT NULL,
  PRIMARY KEY (session_id, q_no, user_id)
);
```

Cài đặt là các dòng `configurations` `arena/*` (không bảng riêng). Bỏ dấu tiếng Việt trong comment SQL nếu file migration khác cũng vậy.

## 3. Backend (`service/arena`, JdbcTemplate như các game khác)

### 3.1 `ArenaSettings` (một bảng FIELDS như `QuizGameSettings`)

Mỗi dòng: key, nhãn, nhóm, kiểu (bool / int / text / time / csv / json), mặc định, min, max. Bảng này đọc, lưu và sinh form admin. Danh sách:

| key | mặc định | ghi chú |
|---|---|---|
| `arena/enabled` | 1 | tắt = banner ẩn, API trả `resultCode 0`, job không tạo trận |
| `arena/days` | `1,2,3,4,5,6,7` | ISO weekday |
| `arena/start_time` | `20:00` | HH:mm |
| `arena/open_minutes` | 10 | 1-60 |
| `arena/question_count` | 20 | 5-50 |
| `arena/countdown_seconds` | 10 | 3-30 |
| `arena/answer_seconds` | 15 | 5-60 |
| `arena/reveal_seconds` | 5 | 2-20 |
| `arena/gap_seconds` | 60 | 30-600, ≥ tổng + 10 |
| `arena/topics` | trống | csv topic key, trống = mọi chủ đề đang bật |
| `arena/no_repeat_days` | 90 | không dùng lại câu đã ra ở Đấu trường |
| `arena/levels` | `1,2,3,4,5` | cấp độ dùng; số câu chia đều cho các cấp (dư thì cấp thấp nhận thêm), xếp từ dễ đến khó |
| `arena/presence_seconds` | 30 | |
| `arena/notify_minutes` | 10 | gửi nhắc trước giờ bắt đầu |
| `arena/notify_app` | 1 | chuông + push |
| `arena/notify_email` | 0 | |
| `arena/notify_zns` | 0 | |
| `arena/zns_template_id` | trống | trống = không gửi ZNS |
| `arena/notify_title` | `Đấu trường Leo sắp bắt đầu!` | `{time}` được thay |
| `arena/notify_body` | `{time} hôm nay, vào phòng ngay kẻo lỡ câu 1 nhé.` | |
| `arena/result_notify` | 1 | báo kết quả cho người đã chơi |
| `arena/reward_coins` | `300,200,100` | 0 = không thưởng hạng đó |
| `arena/reward_sticker` | 1 | |
| `arena/reward_min_score` | 3 | điểm tối thiểu cho quà top 3 |
| `arena/reward_participation` | 20 | Leo Xu cho người chơi ngoài top 3 đã trả lời ≥ 1 câu, 0 = tắt |
| `arena/reward_achievement` | 1 | |
| `arena/flag_fast_ms` | 1000 | |
| `arena/flag_away` | 1 | |
| `arena/flagged_reward` | 0 | 0 = top 3 bị cờ chờ admin |

Đổi cấu hình áp dụng cho các trận `scheduled` chưa tới giờ mở phòng (cập nhật giờ / nhịp trong `arena_sessions`); trận đã mở giữ nguyên.

### 3.2 `ArenaRules` (thuần, có `ArenaRulesTest`)

- `Phase phaseAt(Timing t, Instant now)` → `{kind: before | open | countdown | question | reveal | lobby | ended, qNo, secondsToNext, nextQNo}`. `before` = trước `open_at`; `open` = đã mở phòng, trước `Q_1 − countdown`; `lobby` = giữa hai câu; `ended` = sau `Q_last + answer + reveal`.
- `Instant questionAt(Timing t, int qNo)`, `endsAt(Timing t)`.
- `Comparator<Entry> ranking()` (điểm, correct_ms, mốc đăng ký/vào phòng).
- `boolean late(Instant answeredAt, Timing t, int qNo)` (grace 2 s), `String flagReason(ms, correct, away, settings)`.
- `int rewardFor(int rank, int score, int answered, List<Integer> coins, int minScore, int participation)` (top 3 đạt điểm → quà hạng; còn lại có trả lời → thưởng tham gia; không trả lời → 0).
- `List<Slot> evenPlan(int count, List<Integer> levels, List<String> topics)`: chia đều số câu cho các cấp (vd 20 câu, 5 cấp = 4 câu mỗi cấp; 22 câu → 5,5,4,4,4), xếp cấp tăng dần; chủ đề gán xoay vòng liên tục qua cả trận (bắt đầu từ chủ đề lệch theo ngày để không ngày nào cũng mở bằng cùng chủ đề) để mỗi chủ đề có số câu chênh nhau tối đa 1 và hai câu liền nhau khác chủ đề.
- `String validate(settings)` (gap đủ dài, có ít nhất 1 cấp, giờ hợp lệ).
- `LocalDate nextRunDay(LocalDate from, Set<DayOfWeek> days)`.

### 3.3 `ArenaQuestionPicker`

`List<Pick> pick(List<Slot> plan, int noRepeatDays)`: mỗi ô (cấp, chủ đề) của `evenPlan` lấy một câu ngẫu nhiên; loại câu đã có trong `arena_questions` của các trận trong `no_repeat_days` và câu đã chọn trong trận này; fallback: cùng cấp chủ đề khác → cấp gần cùng chủ đề → cấp gần chủ đề khác → cho phép câu cũ. Không đủ câu thì trả ít hơn và admin thấy cảnh báo. Thứ tự câu trong trận = thứ tự ô (dễ → khó), giống nhau cho mọi người.

### 3.4 `ArenaService`

- `ensureUpcoming()`: bảo đảm có trận cho hôm nay (nếu là ngày chạy và chưa quá giờ kết thúc) và ngày chạy kế tiếp; tạo dòng `arena_sessions` (chụp nhịp từ settings) + `arena_questions`. `INSERT IGNORE` theo `day`.
- `banner(userId)`: trận hiện tại (chưa `ended`) hoặc kế tiếp → `{enabled, sessionId, day, startsAt, openAt, serverNow, phase, qNo, questionCount, registeredCount, registered, inRoom, nextDayLabel}`. `registeredCount` = số dòng `registered_at IS NOT NULL`.
- `register(userId, sessionId)` / `unregister`: upsert `arena_entries.registered_at`; event `arena/register`.
- `lobby(userId)`: cũng là tín hiệu có mặt (`last_seen_at = now`, `entered_at` nếu trống, chỉ khi phòng đã mở). Trả `{session timing, serverNow, phase, board: top 50, me, counts {inRoom, registered}}`. Trước khi bắt đầu, board = người có đăng ký hoặc đã vào phòng, `status` `in_room` / `registered`, người trong phòng xếp trên. Từ câu 1 trở đi board xếp theo `ranking()`, mỗi dòng `{rank, name, score, correctMs, lastCorrect (đúng câu vừa xong → "+1"), inRoom}`. Top 50 cache 2 giây trong bộ nhớ (theo session), dòng của mình luôn đọc mới. Người `hide_board`/`board_blocked`/`disqualified` không hiện cho người khác.
- `question(userId, sessionId, qNo)`: chỉ trả khi `now ≥ Q_i − 1 s`. `{qNo, questionCount, topicLabel, levelLabel, body, options (thứ tự gốc), expiresAt, serverNow, answeredCount, inRoom, mine?: {option}}`. **Chỉ sau `expiresAt`** mới thêm `rightOption`, `explanation` và `mine.correct`.
- `answer(userId, sessionId, qNo, option, away)`: kiểm tra phòng, giờ, chưa trả lời (PK chặn trùng: `INSERT IGNORE`, 0 dòng = "Bạn đã trả lời câu này"); ghi `arena_answers`; cập nhật `arena_entries` (`score + 1` nếu đúng, `correct_ms + ms`, `answered + 1`, cờ) trong cùng transaction; event `arena/answer` detail `correct|wrong qN ms`. Trả **chỉ** `{accepted: true, option}` (không lộ đúng sai trước giờ).
- `board(userId, sessionId?)`: trận đã `done` gần nhất (hoặc theo id) → `{session, days: 14 trận gần nhất [{id, day}], rows: top 100 với final_rank, rewards (cấu hình lúc trao), me}`.

### 3.5 `ArenaScheduler` (`@Scheduled(fixedDelay = 10000)`, bọc try/catch, mỗi bước "giành" bằng UPDATE có điều kiện để chạy lại an toàn)

1. `ensureUpcoming()` (tối đa 1 lần / phút là đủ).
2. Nhắc: trận có `now ≥ starts_at − notify_minutes` và `reminders_sent_at IS NULL` → `UPDATE ... SET reminders_sent_at = now WHERE id = ? AND reminders_sent_at IS NULL`; được 1 dòng thì gửi cho mọi entry có `registered_at` (theo lô 200, ghi `reminded_at`):
   - app: `createNotification(userId, "arena_reminder", title, body, "/fun/arena")` (trả null khi người dùng tắt topic `fun`).
   - email: `emailTemplate(userId, "arena_reminder", "email-arena_reminder", title, {time, link})`.
   - ZNS: khi bật và có template id, `ZnsService.sendTemplate(phone, templateId, {name, time})`; lỗi từng người chỉ log. Bỏ qua người đã tắt kênh `zalo` của topic `fun` nếu `NotificationPrefsService` có hàm kiểm tra kênh.
   - Đăng ký sau khi đã gửi nhắc: không gửi nữa (đã ở gần giờ).
3. `scheduled` → `live` khi `now ≥ open_at`.
4. Chốt: `now ≥ endsAt + 30 s` và `settled_at IS NULL` → giành bằng UPDATE, rồi `ArenaSettlementService.settle(session)`.

### 3.6 `ArenaSettlementService`

- Tính `final_rank` (theo `ranking()`, bỏ `disqualified`), `players` = số entry có `answered > 0`, status `done`.
- Top 3 (điểm ≥ min, không bị cờ hoặc `flagged_reward = 1`): `CoinService.credit(userId, coins, SOURCE_ARENA, "arena:{day}")`, sticker, banner thành tích, notification `arena_reward` route `/fun/arena/board?session=ID`, `rewarded_at`. Người bị cờ chờ: admin "Bỏ cờ, trao quà" gọi `rewardOne(session, user)`.
- Người còn lại có `answered > 0` và không bị loại: `reward_participation` Leo Xu qua `CoinService` (cùng source `arena`), theo lô; không gửi thông báo riêng cho khoản này (nó nằm trong thông báo kết quả: "Bạn hạng 27 với 9 điểm, nhận 20 Leo Xu thưởng tham gia"). Lưu ý `fun/daily_earn_cap` có thể cắt bớt, ghi số thật được cộng vào `reward_coins`.
- `result_notify`: mỗi người đã chơi nhận `arena_result` ("Bạn hạng 27 với 5 điểm") route trang xếp hạng.
- Event `arena/reward`.

### 3.7 API (`ArenaController`, `/api/arena/*`, cần đăng nhập, qua `FunAccessInterceptor`)

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/arena/banner` | |
| POST | `/api/arena/register` `{sessionId}` | |
| DELETE | `/api/arena/register?sessionId=` | |
| POST | `/api/arena/lobby` | tín hiệu có mặt + trạng thái + bảng; FE gọi mỗi 5 s ở sảnh |
| GET | `/api/arena/question?sessionId&qNo` | cũng là tín hiệu có mặt; FE gọi lại mỗi 3 s khi đã chọn (cập nhật "131/176") và ngay khi hết giờ (lấy đáp án) |
| POST | `/api/arena/answer` `{sessionId, qNo, option, away}` | |
| GET | `/api/arena/board?sessionId=` | |

Lỗi là `IllegalStateException` tiếng Việt → `resultCode 0` như các game khác.

### 3.8 Đăng ký vào hệ thống

- `FunAccessRules.GAMES` thêm `arena`; `WebConfig` thêm `/api/arena/**`; `GET /api/fun/access` trả thêm `arena`; admin "Mở dần từng game" tự hiện thêm dòng (kiểm tra `FunEvents.jsx`).
- `NotificationTopics`: `arena_reminder`, `arena_result`, `arena_reward` → topic `fun` (giữ đồng bộ `anylearn_v2/src/config/notificationTopics.ts`).
- `CoinService.SOURCE_ARENA`; nhãn "Đấu trường Leo" ở FE `lib/fun/coins.ts` và admin `FunCoins.jsx`.
- `AchievementSettings` thêm `type_arena`; FE thẻ thành tích nhận icon/kiểu `arena` (xem `AchievementCard`).
- `GameEventService`: game `arena` (admin "Sự kiện game" lọc được).
- `GET /admin/badges` thêm `arenaFlagged` (entry bị cờ, trong top 3, chưa xử lý), cộng vào số đỏ của "Vui học".
- Template email `resources/templates/email/arena_reminder.html` + mục trong `EmailTemplates.TEMPLATES` (`email-arena_reminder`, biến `userName`, `time`, `link`) + `SAMPLE_VALUES`.
- `docs/zns-templates.md`: thêm mẫu "Nhắc Đấu trường Leo" (tham số `name`, `time`).

## 4. FE người chơi (`anylearn_v2`)

### 4.1 Hình Leo Đấu trường và tiêu đề

- `components/fun/arena/LeoArena.tsx`: SVG dựng từ hình Leo mặt trước (copy hình học của `Leo.tsx` Front), thêm: tay phải giơ cao vẫy (class `leo-wave` có sẵn), tay trái cầm khiên = `OUTLINE` của `RankBadge` màu vàng có ngôi sao (export `OUTLINE` từ `RankBadge.tsx` để dùng chung), mũ tú tài navy có tua vàng. Lấy đúng tọa độ trong mockup (template `leoTpl`: viewBox `-42 -24 84 82`, khiên `translate(-40 13) scale(.46)`). Giảm chuyển động khi `prefers-reduced-motion`.
- `components/fun/arena/ArenaTitle.tsx` + CSS `.arena-title` trong `globals.css`: hai lớp chữ (lớp dưới `-webkit-text-stroke` xanh đậm, lớp trên gradient vàng `background-clip:text` có dải sáng chạy `@keyframes arena-sweep`). Copy từ mockup `.shine-title`.

### 4.2 Banner (`components/fun/arena/ArenaBanner.tsx`)

- Đặt trong `app/fun/page.tsx` **ngay dưới `FunShortcuts`** (hàng lối tắt), trước `MissionsCard`; chỉ hiện khi `access.arena` và `banner.enabled`.
- Kiểu "vé": **Leo bên trái**, thân giữa (tiêu đề, dòng 1, dòng 2), **cuống vé bên phải** (đếm ngược / nút, đường đục lỗ ở cạnh trái của cuống). Màu nền đêm navy có vệt đèn sân khấu (mockup `.banner`).
- **Card chỉ cao 3 dòng**: tiêu đề 21 px một dòng, hai dòng phụ chữ hẹp **Roboto Condensed** 13 px (nạp bằng `next/font/google` `Roboto_Condensed`, subset `vietnamese`, chỉ dùng trong banner), không xuống dòng: phần số người cắt "…" trước, chữ "Nhắc tôi" / "Bạn đã hứa tham gia" luôn hiện đủ (`flex: none`).
- Cuống phải theo phase: `before` → "Mở sau hh:mm:ss" (đếm theo giờ máy chủ); `open`/từ `starts_at − open_minutes` → nút **Vào đấu ›** nhấp nháy; đang đấu → "Câu n/N" + **Vào đấu ›**; `ended` → **Kết quả ›** (trang xếp hạng) và dòng 2 chuyển sang trận kế tiếp ("Hẹn 20:00 ngày mai").
- Dòng 1: **Đấu trường là gì?** (mở `ArenaRulesSheet`) · **Bảng xếp hạng ›** (`/fun/arena/board`).
- Dòng 2: "20:00 hôm nay · X người tham gia · **Nhắc tôi**" (xanh, gạch chân) hoặc "Bạn đã hứa tham gia" (nhấn → hàng xác nhận nhỏ "Bỏ nhắc?" Có / Không). Nhãn ngày: hôm nay / ngày mai / thứ + ngày.
- Đếm ngược chạm 0 thì gọi lại `banner` để đổi trạng thái.

### 4.3 Popup "Đấu trường Leo là gì?" (`ArenaRulesSheet.tsx`)

Bottom sheet (người dùng yêu cầu popup ở đây). Nội dung lấy số từ API (giờ, số câu, giây, quà), văn bản theo mockup `whatTpl`. Dùng chung ở banner và sảnh.

### 4.4 Trang `/fun/arena` (một route, hai view: sảnh và câu hỏi; không popup ngoài sheet luật)

- Bọc đăng nhập như các trang Vui học khác.
- `useArenaClock` (hook): giữ `offset = clockOffset(serverNow)`, tính phase bằng `lib/arena/timeline.ts` (bản TS của `ArenaRules.phaseAt`, thuần, có test) mỗi 250 ms; không phụ thuộc phản hồi của poll để chuyển màn.
- **Sảnh** (`ArenaLobby.tsx`): khối tiêu đề navy (ArenaTitle, link "Đấu trường Leo là gì?", dòng ngày · giờ · số câu · số đăng ký, Leo nhỏ); dòng đếm ngược dính trên bảng: "Còn 4 phút 12 giây tới câu hỏi đầu tiên" / "Còn 38 giây tới câu hỏi tiếp theo" (bỏ phút khi < 60 s; hàm `untilText` trong `lib/arena/timeline.ts`); bảng như mockup: trước giờ chữ **Trong phòng** (không nền, chữ xanh neon `#00c853` có glow + chấm sáng nhấp nháy) / chip **Đăng ký** (xanh nhạt); giữa trận điểm + "+1" + tổng giây; dòng của mình ghim dưới. Trước `open_at` (vào sớm qua link) thì sảnh vẫn xem được nhưng hiện "Phòng mở lúc 19:50", không gửi tín hiệu có mặt.
- Phase `countdown` → **màn câu hỏi** (`ArenaQuestion.tsx`) toàn màn: số đếm lớn 10 → 1, rồi tại `Q_i` gọi `GET question` (thử lại 3 lần trong 2 s), thanh giờ theo `expiresAt` + offset, 4 đáp án. Chọn xong: khóa, viền vàng, gọi `answer`, dưới dòng đồng hồ hiện "Đã chọn · đang chờ người khác trả lời (a/b)" (mockup `.waiting`, số từ `question` gọi lại mỗi 3 s). Hết giờ: gọi `question` lấy `rightOption`, tô xanh đáp án đúng, đỏ đáp án sai đã chọn, khung kết quả "Chính xác! +1 điểm" / "Chưa đúng rồi" / "Hết giờ" (mockup `.verdict`), chân trang "Về sảnh sau 5 giây…". Phase về `lobby` → quay sảnh và gọi `lobby` ngay để lấy bảng mới. `away` = `document.visibilityState === 'hidden'` lúc nào đó trong câu.
- Phase `ended` → sảnh hiện "Trận đã kết thúc" + nút "Xem bảng xếp hạng" + dòng hẹn trận kế tiếp với Nhắc tôi.
- Ở sảnh, Leo nói một câu (dùng `LeoSays` + thêm context kind `arenaLobby` trong `lib/fun/leo.ts`: trước giờ, sắp bắt đầu, vừa đúng, vừa sai, đang dẫn đầu). Không bắt buộc, làm nếu kịp.

### 4.5 Trang xếp hạng `/fun/arena/board?session=`

Theo mockup tab 4: tiêu đề, ngày · số câu · số người chơi, dòng quà top 3; hàng chip 14 ngày gần nhất; top 3 chữ to hơn với **huy chương vàng / bạc / đồng** (SVG `ArenaMedal`, có ruy băng đỏ xanh như mockup) cạnh số thứ tự; dòng khác: hạng, avatar chữ cái, tên, tổng giây, điểm; dòng của mình ghim dưới. Không có trận nào → "Chưa có trận nào kết thúc".

### 4.6 API client và luật thuần

`lib/api/arena.ts`, `lib/arena/timeline.ts` (+ `timeline.test.ts`: các phase theo mốc, `untilText`, ranh giới countdown/reveal), `lib/arena/board.ts` (sắp xếp sảnh trước giờ: trong phòng trước).

## 5. Admin (`anylearn_admin`)

- Trang `pages/ArenaAdmin.jsx`, route `/fun-arena`, mở từ trang Vui học (`FunEvents.jsx`, như nút "Cửa hàng Leo Xu") và có mục menu con trong nhóm "Giải trí". Đầu trang: công tắc **Bật chức năng** (`arena/enabled`) + chế độ mở dần.
- Tab **Theo dõi hôm nay** (poll 5 s): trạng thái trận (chờ / mở phòng / câu n đang mở còn x giây / đã xong / đã hủy), số Nhắc tôi, đang trong phòng, đã trả lời câu hiện tại, đúng trung bình, thông báo đã gửi theo kênh; bảng từng câu (giờ, chủ đề · mức, số trả lời, % đúng, giây TB, trạng thái); top 10 hiện tại kèm SĐT che (`09xx…123`). Nút **Dừng trận hôm nay** (hủy: status `cancelled`, không trao quà, có hỏi lại trong trang) và **Xem như người chơi** (mở `/fun/arena` của FE).
- Tab **Cấu hình**: form sinh từ `ArenaSettings.FIELDS` theo nhóm (Bật tắt & lịch, Nhịp trận, Câu hỏi: chủ đề + cấp độ dùng (ô chọn) + dòng giải thích "20 câu, 5 cấp, 8 chủ đề: mỗi cấp 4 câu", Thông báo + "Gửi thử cho tôi", Quà top 3 + thưởng tham gia, Chống gian lận). Lưu báo lỗi `validate`.
- Tab **Câu hỏi hôm nay**: câu đã chọn cho trận hôm nay / kế tiếp (nội dung, đáp án đúng, chủ đề, mức); **Đổi câu khác** (ngẫu nhiên cùng mức) hoặc chọn id; khóa khi câu đã bắt đầu; nút **Chọn lại cả trận** khi chưa mở phòng.
- Tab **Lịch sử**: các trận (ngày, Nhắc tôi, người chơi, chơi hết, đúng TB, top 1, trạng thái quà), "Xem bảng" mở bảng đầy đủ.
- Tab **Gắn cờ**: entry bị cờ (lý do, hạng, ngày), **Bỏ cờ, trao quà** / **Loại khỏi BXH** (`disqualified`, xếp lại hạng nếu trận đã chốt và người đó trong top 3 chưa nhận quà: người kế tiếp được trao).
- API `AdminArenaController` `/admin/arena/*`: `GET overview`, `GET/PUT settings`, `POST settings/test-notification`, `GET sessions?page`, `GET sessions/{id}`, `PUT sessions/{id}/questions/{qNo} {questionId?}`, `POST sessions/{id}/repick`, `POST sessions/{id}/cancel`, `POST sessions/{id}/settle` (chạy tay nếu job lỡ), `GET flags`, `POST sessions/{id}/entries/{userId}/clear|disqualify`.

## 6. Kiểm thử

- `ArenaRulesTest`: phase ở từng mốc (trước mở, mở, countdown, câu, reveal, giữa câu, kết thúc), ranking (điểm, ms, mốc), late, cờ, rewardFor (top 3, dưới điểm tối thiểu, tham gia, không trả lời), validate, nextRunDay, evenPlan (20/5 = 4 mỗi cấp, 22 câu, chủ đề chênh tối đa 1, không hai câu liền cùng chủ đề, cấp tăng dần).
- `ArenaFlowTest` (schema thật, rollback như `QuizGameFlowTest`, `Clock` cố định có thể dời): tạo trận, đăng ký, vào phòng, lấy câu trước giờ bị từ chối, trả lời đúng/sai/trễ/trùng, **`question` không có `rightOption` trước hết giờ, có sau hết giờ**, `answer` không lộ đúng sai, bảng sau câu, chốt + trao quà top 3 và thưởng tham gia một lần, cờ chặn quà top 3, hủy trận, nhắc gửi một lần.
- FE `lib/arena/timeline.test.ts`, `lib/arena/board.test.ts`.
- Chạy `./mvnw test -Dtest='Arena*'`, `npm test`, `npm run build` (FE + admin).

## 7. Tài liệu

- `CLAUDE.md`: mục "Đấu trường Leo (plan 18)" như các mục khác (bảng, service, API, settings, luật quan trọng: mọi mốc giờ từ server, cùng bộ câu và thứ tự cho mọi người, đáp án đúng chỉ trả sau hết giờ, trả quà qua `CoinService`).
- `docs/huong-dan-admin.md`: phần Đấu trường (bật tắt, cấu hình, đổi câu, cờ, ZNS cần template duyệt).
- `http/arena.http` (người chơi) + mục admin trong `http/admin.http`; thêm dòng vào bảng HTTP Test Files của `CLAUDE.md`.
- `plans/PROGRESS.md`: một mục ngày làm.
- Không thêm env var mới (ZNS dùng cấu hình sẵn có), nên không cần sửa deploy workflow.

## 8. Chia việc

| # | Việc |
|---|---|
| 18.1 | V67, `ArenaSettings`, `ArenaRules` + test, `ArenaQuestionPicker` |
| 18.2 | `ArenaService`, `ArenaController`, access/interceptor, events, `ArenaFlowTest` phần chơi |
| 18.3 | `ArenaScheduler`, nhắc (app/email/ZNS + template), `ArenaSettlementService`, quà, thông báo kết quả |
| 18.4 | FE: `LeoArena`, `ArenaTitle`, `ArenaBanner` trên `/fun`, sheet luật |
| 18.5 | FE: `/fun/arena` sảnh + màn câu hỏi + đồng hồ máy chủ |
| 18.6 | FE: `/fun/arena/board` |
| 18.7 | Admin `ArenaAdmin.jsx` + `AdminArenaController` + badge |
| 18.8 | Tài liệu, http, PROGRESS |

## 9. Đã chốt với CoT (29/10/2026)

1. Công bằng: mọi người dùng chung bộ câu, mặc định **20 câu chia đều cấp độ và chủ đề**, cùng thứ tự câu và đáp án.
2. **Hết giờ mới hiện đáp án.** Chọn xong hiện dòng "đang chờ người khác trả lời" dưới đồng hồ.
3. Bằng điểm: ai tổng thời gian trả lời đúng ít hơn xếp trên.
4. Vào trễ vẫn chơi các câu còn lại.
5. Top 3: 300 / 200 / 100 Leo Xu + 1 sticker (cần ít nhất 3 điểm); **ngoài top 3 ai có chơi nhận 20 Leo Xu thưởng tham gia**. Admin đổi hoặc tắt.
6. Không cần websocket: máy người chơi tự chuyển màn theo giờ máy chủ, sảnh hỏi bảng mỗi 5 giây.
7. Hình Leo cầm khiên đội mũ tú tài vẽ bằng SVG từ Leo hiện có.
8. Banner nằm **dưới hàng lối tắt**; cuống vé đếm ngược nằm **bên phải**, card gọn 3 dòng chữ hẹp. Sảnh: chữ "Trong phòng" không có nền đen.
