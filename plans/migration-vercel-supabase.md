# Chuyển AnyLearn sang Vercel + Supabase: phân tích và plan

Ngày rà soát: 2026-10-25. Số liệu bên dưới lấy từ code hiện tại trong repo.

## 1. Hiện trạng

| Thành phần | Công nghệ | Quy mô | Đang chạy ở đâu |
|---|---|---|---|
| `anylearn_v2` (FE thành viên) | Next.js 16, React 19, Tailwind 4 | 83 file, ~9,7k dòng. Gọi API bằng `fetch` + `Bearer JWT` | server riêng, systemd, port 3000 |
| `anylearn_backend_v2` (API) | Spring Boot 3.5, JPA, Flyway, Java 21 | 248 file, ~15,3k dòng, **202 endpoint** (63 endpoint admin), 71 entity, 69 repository, 22 native query, 8 job `@Scheduled`, 14 migration Flyway | server riêng, port 8080 |
| `anylearn_admin` (back office) | Vite, React, antd 6, react-query, axios, tiptap, recharts | 23 file, ~4k dòng | file tĩnh do nginx phục vụ ở `/admin` |
| DB | MySQL `anylearn` (schema gốc từ Laravel) | ~61 bảng. Lớn nhất: `tags` ~300k dòng, `vouchers` ~85k, `notifications` ~80k, `users` ~14k, `transactions` ~14k, `orders` ~2,8k, `items` ~1,7k. **Không có foreign key** | cùng server |
| Search | MeiliSearch (Docker) | index item/school/teacher, reindex 5h sáng mỗi ngày | cùng server |
| Ảnh | AWS S3 (+ CDN) | upload đi qua Java (`MultipartFile`) | AWS |
| Deploy | GitHub Actions, **self-hosted runner** trên chính server production, build Maven/Next ngay trên máy prod | | |
| Khác trên cùng server | PHP portal (chỉ còn làm đường lui `rollback-to-php.sh`), app **11onfield** (port 7070/7071, "tạm thời") | | |

Tích hợp bên ngoài mà Java đang làm:
- Thanh toán: VNPay, OnePay, OnePay trả góp, MoMo (ký HMAC, IPN `/payment-notify/*`, return `/payment-return/*`), chuyển khoản tay.
- Zalo ZNS (OTP + thông báo, OAuth của Zalo), email qua Brevo SMTP.
- Thông báo realtime qua SSE (`/v2/api/user/notification/stream`, giữ emitter trong RAM).
- Job định kỳ: dọn OTP / token reset (mỗi giờ), nhắc lịch học (mỗi giờ + mỗi 5 phút), popularity rollup (30 phút), audit (8h sáng), reindex Meili (5h sáng), heartbeat SSE (30 giây).

## 2. Kết luận nhanh

**Khả thi.** Dữ liệu nhỏ (cỡ vài trăm MB), traffic thấp, logic nghiệp vụ vừa phải. Không có gì bắt buộc phải là server chạy 24/7. Cái khó không nằm ở hạ tầng mà ở việc **viết lại 202 endpoint Java sang TypeScript** và **chuyển MySQL sang Postgres**.

**Độ phức tạp: trung bình – cao.** Ước lượng 8–11 tuần công một người (có Claude Code hỗ trợ), làm cuốn chiếu, site không phải dừng.

**Khuyến nghị:** làm theo 4 giai đoạn, mỗi giai đoạn tự có giá trị và có thể dừng lại ở đó:

| Giai đoạn | Việc | Công | Lợi ích ngay |
|---|---|---|---|
| 0 | FE + admin lên Vercel, Java + MySQL tạm giữ trên server | 1–2 ngày | Bỏ 2/3 quy trình deploy, bỏ build Next trên máy prod |
| 1 | MySQL → Supabase Postgres, Java trỏ sang Supabase | 1–1,5 tuần | Không còn tự vận hành DB, có backup tự động |
| 2 | Port API Java sang Route Handler trong `anylearn_v2`, từng mảng một | 6–8 tuần | Mỗi mảng port xong là bớt phụ thuộc Java |
| 3 | Tắt Java, MeiliSearch, self-hosted runner, (server) | 2–3 ngày | Không còn server cho AnyLearn |

## 3. Các phương án đã cân nhắc

| Phương án | Mô tả | Công | Nhận xét |
|---|---|---|---|
| A. Chỉ đưa FE + admin lên Vercel | Java + MySQL + Meili vẫn ở VPS, deploy Java bằng GitHub-hosted runner qua SSH | 2–3 ngày | Rẻ nhất, nhưng vẫn phải giữ server và lo MySQL |
| B. Java lên container serverless (Cloud Run, Fly…) + MySQL managed | Không viết lại | 1–2 tuần | Spring Boot cold start 5–15 giây khi scale về 0 → UX tệ với site ít truy cập; giữ máy luôn chạy thì mất lợi ích chi phí. MySQL managed giá rẻ ít lựa chọn |
| **C. Vercel + Supabase, viết lại API bằng TS (khuyến nghị, làm cuốn chiếu)** | Giống CLR: một Next.js app chứa cả FE lẫn API, Postgres trên Supabase | 8–11 tuần | Một ngôn ngữ, một quy trình deploy (push là xong), không server. Tốn công viết lại |
| D. Viết lại một lần (big bang) | Như C nhưng chuyển hết rồi mới bật | như C | Rủi ro cao ở thanh toán, không có đường lui. Không nên |

Phương án A chính là Giai đoạn 0 của C, nên bắt đầu ngay được dù cuối cùng chọn gì.

## 4. Trade-off

### Được
- **Deploy**: push lên `main` là Vercel tự build + deploy, có preview cho mỗi PR, rollback một click. Bỏ self-hosted runner, bỏ build Maven/Next trên máy prod, bỏ nginx/systemd/script.
- **Vận hành**: không còn vá OS, theo dõi RAM JVM, lo MySQL/Meili/Docker, cert SSL.
- **Một stack**: TypeScript cả FE lẫn API, giống CLR → dùng chung kinh nghiệm, quy ước, kiểu `CLAUDE.md`.
- **DB**: backup hằng ngày (Supabase Pro), point-in-time (add-on), dashboard SQL, `pg_cron`.
- **Chi phí theo tải**: không trả cho JVM chạy không cả ngày.

### Mất / phải chấp nhận
- **Chi phí không chắc giảm**: AnyLearn bán khoá học = dùng thương mại → **Vercel Hobby không được phép** (điều khoản chỉ cho dùng phi thương mại), cần **Vercel Pro ~20 USD/tháng/thành viên**. Supabase Free bị **tạm dừng sau 7 ngày ít hoạt động** và **không có backup** → với dữ liệu đơn hàng/tiền nên dùng **Supabase Pro ~25 USD/tháng**. Tổng ~45 USD/tháng + S3. So với giá VPS hiện tại thì có thể ngang hoặc đắt hơn; cái lợi chính là công sức vận hành. (Có thể chạy Supabase Free giai đoạn đầu nếu chấp nhận tự `pg_dump` hằng ngày bằng GitHub Actions.)
- **Mất đường lui về PHP**: PHP portal đọc MySQL. Khi DB sang Postgres thì `rollback-to-php.sh` không còn dùng được. Cần chốt là đã bỏ hẳn PHP.
- **Search kém hơn Meili**: thay bằng Postgres full-text (`unaccent` + `pg_trgm`). Với ~1,7k item và ~14k user thì đủ nhanh, gõ không dấu vẫn ra, nhưng chịu lỗi chính tả và xếp hạng kém hơn Meili. (Giữ Meili thì phải trả Meili Cloud hoặc giữ server, ngược mục tiêu.)
- **Giới hạn serverless**: request body tối đa 4,5 MB → upload ảnh phải chuyển sang presigned URL lên S3 thẳng từ trình duyệt. Function có thời gian chạy tối đa (đủ cho mọi API hiện tại, job dài phải chia nhỏ). Không giữ được kết nối SSE lâu dài → đổi cách làm thông báo realtime.
- **Cron**: Vercel Hobby chỉ cron 1 lần/ngày; job 5 phút/30 phút phải dùng Vercel Pro cron hoặc `pg_cron` trong Supabase.
- **Độ trễ**: phải đặt function Vercel ở `sin1` (mặc định là Mỹ) cùng vùng với Supabase `ap-southeast-1`. Trong Giai đoạn 1, Java vẫn ở server Việt Nam gọi DB ở Singapore → mỗi query thêm ~30–50 ms, các chỗ N+1 của JPA sẽ chậm rõ. Giai đoạn này nên ngắn.
- **Server chưa tắt được ngay** nếu app 11onfield vẫn ở đó. Cần dời 11onfield (có domain riêng) thì mới tắt hẳn.
- **Rủi ro viết lại**: ký HMAC thanh toán, ví/điểm, voucher, logic `/today` phải port chính xác. Giảm rủi ro bằng test so sánh kết quả Java ↔ TS (mục 6.3).

## 5. Kiến trúc đích

```
                  anylearn.vn (Vercel, region sin1)
                  ┌──────────────────────────────────────────┐
 trình duyệt ───▶ │ anylearn_v2 (Next.js)                    │
                  │  ├─ trang thành viên (như hiện tại)       │
                  │  ├─ /v2/api/*     Route Handler (thay Java)│
                  │  ├─ /v2/admin/*   Route Handler admin     │
                  │  ├─ /payment-notify/*, /payment-return/* │
                  │  └─ /api/cron/*   job, gọi bởi pg_cron    │
                  └───────────────┬──────────────────────────┘
 admin.anylearn.vn (Vercel, static)│ (hoặc rewrite /admin → project admin)
 ┌───────────────────────┐        │
 │ anylearn_admin (Vite)  │───────┘ gọi /v2/admin/* như cũ
 └───────────────────────┘
                                   ▼
               Supabase (ap-southeast-1): Postgres + pg_cron + pg_net
               AWS S3 (giữ nguyên, upload bằng presigned URL)
               Brevo (HTTP API), Zalo ZNS, VNPay/OnePay/MoMo
```

Quyết định kỹ thuật chính:

1. **Giữ nguyên hợp đồng API** (`/v2/api/...`, `/v2/admin/...`, cùng JSON). FE và admin gần như không phải sửa. Route Handler đặt ở `anylearn_v2/src/app/v2/api/**/route.ts`.
2. **Chuyển cuốn chiếu bằng `rewrites().fallback`** trong `next.config.ts`: request nào Next.js chưa có route thì chuyển sang Java cũ (`https://legacy-api.anylearn.vn/v2/:path*`). Port xong endpoint nào thì route mới tự được ưu tiên, không phải đổi gì ở FE. Muốn lùi chỉ cần xoá file route.
3. **Auth giữ kiểu hiện tại, không dùng Supabase Auth**: đăng nhập số điện thoại + mật khẩu bcrypt (hash Laravel `$2y$`, đổi tiền tố sang `$2b$` khi so), JWT HS256 cùng `JWT_SECRET` với Java → token Java phát hành vẫn dùng được ở TS và ngược lại trong suốt thời gian chuyển. Vẫn hỗ trợ `api_token` như `ApiTokenFilter`. Lý do: Supabase Auth không gửi OTP qua Zalo ZNS sẵn, phải migrate 14k tài khoản, và đổi cơ chế login cùng lúc với viết lại API là thêm rủi ro. Có thể chuyển sang Supabase Auth sau, như một việc riêng.
4. **Truy cập DB chỉ ở server**, bằng driver Postgres trực tiếp (`postgres`, qua Supavisor transaction pooler, `prepare: false`), không dùng `supabase-js`/PostgREST. Lý do: schema Laravel **không có foreign key** nên PostgREST không join được; các luồng tiền (checkout, xác nhận thanh toán, ví, điểm, voucher) cần transaction thật. **Bật RLS trên mọi bảng, không tạo policy** → anon key không đọc được gì; server dùng connection string riêng.
5. **Admin giữ Vite + antd**, chỉ deploy dạng static lên Vercel (project thứ 2 trong cùng repo, root `anylearn_admin`). Viết lại 4k dòng antd sang Tailwind không đem lại gì.
6. **Search**: cột `search_vector` (generated, `unaccent` + `to_tsvector('simple', ...)`) + index GIN, cộng `pg_trgm` cho gợi ý gần đúng.
7. **Thông báo**: thay SSE bằng polling số thông báo chưa đọc mỗi 60 giây (và khi tab được focus lại). Ít user nên rẻ và đơn giản. Supabase Realtime cần JWT của Supabase cho RLS, để sau nếu thật sự cần.
8. **Job**: việc thuần SQL (dọn OTP/token, popularity rollup) viết thành function Postgres chạy bằng `pg_cron`. Việc cần gọi ra ngoài (nhắc lịch qua ZNS/email, audit) là Route Handler `/api/cron/*` có `CRON_SECRET`, được `pg_cron` + `pg_net` gọi theo lịch (tránh độ trễ của GitHub schedule và giới hạn cron của Vercel Hobby).
9. **Email**: Brevo HTTP API bằng `fetch` (không cần thư viện SMTP).
10. **Thư viện thêm vào `anylearn_v2`**: `postgres`, `bcryptjs`, `jose` (JWT), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. Không thêm gì khác.

## 6. Plan chi tiết

Ký hiệu: ⚠️ = task khó (tiền, bảo mật, dữ liệu), nên giao model mạnh nhất và test kỹ.

### Giai đoạn 0 – FE và admin lên Vercel (1–2 ngày)

- **0.1** Tạo project Vercel `anylearn-web` (root `anylearn_v2`), region function `sin1`, env `NEXT_PUBLIC_API_URL=https://anylearn.vn/v2/api`.
- **0.2** Trên server thêm subdomain `legacy-api.anylearn.vn` → nginx → Java 8080 (SSL bằng certbot). Giữ `location` cho SSE.
- **0.3** `next.config.ts`: `rewrites().fallback` cho `/v2/:path*`, `/payment-notify/:path*`, `/payment-return/:path*` → `legacy-api`. Như vậy URL callback đã đăng ký với VNPay/OnePay/MoMo không đổi. SSE dài: cho FE gọi thẳng `legacy-api` (rewrite qua Vercel có thể bị cắt).
- **0.4** Tạo project Vercel `anylearn-admin` (root `anylearn_admin`, build `vite build`, SPA fallback về `index.html`). Hoặc `admin.anylearn.vn`, hoặc rewrite `/admin/:path*` từ project web sang project admin (giữ URL cũ). Kiểm tra `base` trong `vite.config.js`.
- **0.5** Kiểm tra CORS của Java nếu admin ở subdomain riêng (`WebConfig`).
- **0.6** Trỏ DNS `anylearn.vn` sang Vercel. Giữ nginx cũ chạy song song 1 tuần làm đường lui (đổi DNS ngược lại).
- **0.7** Sửa `.github/workflows/deploy-production.yml`: bỏ job frontend/admin, chỉ còn backend.

Nghiệm thu: mở trang chủ, PDP, login, giỏ hàng, thanh toán sandbox VNPay đi hết vòng (return + IPN), admin đăng nhập và sửa một item.

### Giai đoạn 1 – MySQL sang Supabase Postgres (1–1,5 tuần)

- **1.1** Tạo project Supabase (Pro, `ap-southeast-1`). Bật extension `unaccent`, `pg_trgm`, `pg_cron`, `pg_net`.
- **1.2** ⚠️ Viết schema Postgres `supabase/migrations/0001_baseline.sql` từ `V1..V14` (không dùng thẳng output pgloader làm schema lâu dài):
  - `tinyint` → `smallint` (giữ số, vì code coi `status` là số; cột cờ 0/1 giữ `smallint` để Java/TS không phải đổi).
  - `bigint unsigned` → `bigint`; `AUTO_INCREMENT` → `bigint generated by default as identity` (set lại sequence sau khi nạp dữ liệu).
  - `longtext/text` → `text`; `json` → `jsonb`; `enum(...)` → `text` + `check`.
  - Cột trùng từ khoá Postgres (`like`, `desc`, ...) phải để trong ngoặc kép; Java cần `hibernate.globally_quoted_identifiers=true` hoặc `@Column(name="\"like\"")`.
  - `timestamp` → `timestamptz`. **Xác minh trước** MySQL đang lưu giờ VN hay UTC (Laravel thường lưu giờ theo `APP_TIMEZONE`): so `created_at` của vài đơn hàng với giờ thật. Kết quả quyết định cách convert.
  - Giữ nguyên tên bảng/cột. Chưa thêm foreign key (dữ liệu cũ có thể có bản ghi mồ côi), ghi lại thành việc sau.
  - Bật RLS trên mọi bảng, không policy.
- **1.3** ⚠️ Script nạp dữ liệu (`scripts/migrate_mysql_to_pg.sh`): `pgloader` chế độ data-only vào schema ở 1.2, `zero dates to null`, rồi `setval` mọi sequence. Script đếm số dòng từng bảng ở hai bên và so tổng tiền `transactions`, `orders`.
- **1.4** Java chạy với Postgres: đổi driver/dialect, `flyway-database-postgresql`, sửa 22 native query (`GROUP_CONCAT` → `string_agg`, backtick → ngoặc kép, `IFNULL` → `coalesce`, `DATE_FORMAT` → `to_char`, ...). Chạy `./mvnw test` và toàn bộ file trong `http/` trên DB Postgres local.
- **1.5** Tập dượt: chạy 1.3 với bản dump prod lên Supabase staging, bật Java local trỏ vào, bấm thử các luồng chính.
- **1.6** Cutover (đêm, báo trước): bật chế độ bảo trì → dump MySQL → nạp → so số liệu → đổi `SPRING_DATASOURCE_URL` sang Supabase (session pooler port 5432) → mở lại. Giữ MySQL chỉ đọc 2 tuần làm đường lui.
- **1.7** Backup phụ: workflow GitHub Actions (runner của GitHub) `pg_dump` hằng ngày lên S3, giữ 30 bản.

Nghiệm thu: số dòng và tổng tiền khớp; login bằng tài khoản cũ được; đặt một đơn; `/today` của tài khoản demo đúng như trước.

### Giai đoạn 2 – Port API sang Next.js (6–8 tuần)

#### 2.0 Nền tảng (3–4 ngày)
- Cấu trúc trong `anylearn_v2/src`:
  ```
  app/v2/api/**/route.ts      # endpoint thành viên, giữ đúng path cũ
  app/v2/admin/**/route.ts    # endpoint admin
  app/payment-notify/[gateway]/route.ts, app/payment-return/[gateway]/route.ts
  app/api/cron/*/route.ts
  lib/server/db.ts            # kết nối postgres (server-only)
  lib/server/auth.ts          # verify JWT/api_token, requireUser, requireAdmin
  lib/server/http.ts          # format JSON + lỗi giống GlobalExceptionHandler của Java
  lib/<domain>/*.ts           # logic thuần + *.test.ts (vitest)
  lib/<domain>/repo.ts        # query SQL của domain
  ```
- Định dạng lỗi, phân trang, tên field JSON phải giống Java (Jackson, `write-dates-as-timestamps: false`). Viết helper chung một lần.
- ⚠️ `lib/server/auth.ts`: verify JWT HS256 bằng `jose` với cùng secret, đọc `api_token` từ query, kiểm role admin y như `SecurityConfig`.
- Test so sánh (mục 6.3) dựng ngay ở đây.

#### 2.1 Thứ tự port (mỗi dòng là một task, ước lượng công)

| # | Mảng | Controller/Service Java tương ứng | Công |
|---|---|---|---|
| 2.1 | Config, home, categories, foundation, open | `ConfigController`, `ConfigService`, `OpenController` | 2 ngày |
| 2.2 | Search (Postgres FTS thay Meili) | `MeilisearchService`, phần search của `ConfigController`/`ItemController` | 3 ngày |
| 2.3 | PDP, review, item tracking | `ItemController`, `ItemService`, `ItemTrackingService` | 3 ngày |
| 2.4 | Article, ask, social, study | các controller nhỏ cùng tên | 2 ngày |
| 2.5 | ⚠️ Auth: login, register, OTP qua ZNS, quên mật khẩu, email | `AuthController`, `AuthService`, `OtpService`, `PasswordResetService`, `ZnsService`, `EmailService` | 5 ngày |
| 2.6 | User profile, documents, notifications (polling) | `user/*`, `UserService`, `NotificationService` | 3 ngày |
| 2.7 | Me (dashboard, classes, students), `/today` | `MeController`, `TodayController`, `service/today/*` (17 file, đã tách logic thuần, port thẳng kèm test) | 5 ngày |
| 2.8 | ⚠️ Cart, voucher, checkout | `CartController`, `CartService` (652 dòng) | 5 ngày |
| 2.9 | ⚠️ Thanh toán: VNPay, OnePay, OnePay TG, MoMo, chuyển khoản; IPN + return | `PaymentController`, `service/payment/*` | 5 ngày |
| 2.10 | ⚠️ Transaction, ví, điểm | `TransactionController`, `WalletService`, `service/points/*` | 3 ngày |
| 2.11 | Upload ảnh: presigned URL lên S3 (FE + admin đổi cách upload) | `S3Service` | 2 ngày |
| 2.12 | Admin (63 endpoint): users, items + schedule, orders, transactions, articles, config, email settings, ZNS OAuth, audit, schedule requests, dashboard | `controller/admin/*` | 8–10 ngày |
| 2.13 | Job: chuyển 8 job `@Scheduled` (bảng ở mục 5, quyết định 8) | các service có `@Scheduled` | 2 ngày |

Mỗi task: viết route + logic + test vitest → chạy test so sánh với Java → deploy (route mới tự chiếm request nhờ fallback) → theo dõi log Vercel 1–2 ngày → task tiếp.

Thanh toán (2.9) chuyển theo từng cổng: bật cổng mới cho một cổng (ví dụ VNPay), test sandbox đủ ca (thành công, huỷ, sai chữ ký, IPN gọi lặp), rồi mới chuyển cổng tiếp. Không chuyển giữa lúc có đơn đang chờ IPN: chọn giờ vắng.

#### 2.2 Bảng chuyển job

| Job Java | Lịch | Thay bằng |
|---|---|---|
| `OtpService.cleanupExpiredOtps` | mỗi giờ | `pg_cron` + `delete` SQL |
| `PasswordResetService.cleanupExpiredTokens` | mỗi giờ | `pg_cron` + `delete` SQL |
| `PopularityRollupService` | 30 phút | function Postgres + `pg_cron` |
| `ScheduleNotificationService` (2 job) | 1 giờ, 5 phút | `/api/cron/schedule-reminders` gọi bởi `pg_cron` + `pg_net` |
| `AuditService.scheduledAudit` | 8h sáng | `/api/cron/audit` gọi bởi `pg_cron` + `pg_net` |
| `MeilisearchService.scheduledReindex` | 5h sáng | bỏ (vector search là cột generated) |
| `NotificationSseService.sendHeartbeat` | 30 giây | bỏ (đổi sang polling) |

#### 2.3 Test so sánh Java ↔ TS
- Script `scripts/compare-api.ts`: đọc danh sách request từ các file `http/*.http` (GET và các POST không đổi dữ liệu), gọi cùng request vào `legacy-api` và bản TS (preview deploy), so JSON (bỏ qua field thời gian sinh ra lúc chạy). Chạy trong CI cho mỗi PR port.
- Luồng ghi (checkout, thanh toán, ví): test trên DB staging bằng kịch bản tay có checklist, đối chiếu bảng `orders`, `transactions` sau mỗi bước.

### Giai đoạn 3 – Dọn dẹp (2–3 ngày)

- **3.1** Khi log `legacy-api` không còn request nào trong 1 tuần: bỏ fallback rewrite, tắt service Java, MeiliSearch, xoá `anylearn_backend_v2` khỏi repo (giữ tag git `java-final`).
- **3.2** Xoá `deployment/`, `docker-compose.yml`, workflow deploy và self-hosted runner. Thêm workflow CI (lint, typecheck, test) chạy trên runner của GitHub.
- **3.3** Gỡ MySQL sau khi giữ bản dump cuối lên S3.
- **3.4** Dời 11onfield (nếu chưa) rồi tắt server.
- **3.5** Cập nhật `CLAUDE.md` gốc: kiến trúc mới, cách chạy local (`supabase start` + `npm run dev`), bảng porting.

## 7. Việc nên làm sau (không nằm trong lần chuyển)
- Thêm foreign key sau khi dọn bản ghi mồ côi.
- Đổi cột cờ `smallint` 0/1 sang `boolean`.
- Cân nhắc Supabase Auth (cần SMS hook gửi OTP qua ZNS) và Realtime cho thông báo.

## 8. Cần anh/chị quyết trước khi làm
1. PHP portal đã bỏ hẳn chưa? (Giai đoạn 1 làm mất `rollback-to-php.sh`.)
2. Còn app mobile nào gọi API cũ bằng `api_token` không? (Nếu có, giữ đúng các endpoint nó dùng.)
3. 11onfield có kế hoạch rời server khi nào? Server chỉ tắt được khi cả hai đi.
4. Chấp nhận Vercel Pro + Supabase Pro (~45 USD/tháng) không, hay chạy Supabase Free + tự backup giai đoạn đầu?
5. Chấp nhận search kém hơn Meili (chịu lỗi chính tả yếu hơn) không?
6. Admin để ở `admin.anylearn.vn` hay giữ đường `anylearn.vn/admin`?
