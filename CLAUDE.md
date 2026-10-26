# AnyLearn — Project Overview

## Architecture: 4 Apps, 1 Database

```
┌─────────────────────────────────────────────────────────┐
│  anylearn_portal  (Laravel 5.8 / PHP)  ← LEGACY SOURCE  │
│  Port: 8000 (php artisan serve)                         │
│  Serving both web UI and REST API at /api/*             │
└─────────────────────────────────────────────────────────┘
         ↓ đang được port sang 3 app mới ↓

┌──────────────────────────┐   ┌──────────────────────────┐
│  anylearn_v2             │   │  anylearn_backend_v2      │
│  Next.js 16 / React 19   │──▶│  Spring Boot 3.5 / Java   │
│  Tailwind CSS v4         │   │  Port: 8080               │
│  Port: 3000              │   │  Context path: /v2        │
│  FE (buyer-facing)       │   │  REST API: /v2/api/*      │
└──────────────────────────┘   │  Admin API: /v2/admin/*   │
                               └──────────────────────────┘
┌──────────────────────────┐           │
│  anylearn_admin          │───────────┘
│  Vite + React + antd 6   │
│  Port: 5173              │
│  Back office (admin)     │
└──────────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │  MySQL: anylearn           │
                          │  localhost:3306            │
                          │  root / (no password)      │
                          └───────────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │  MeiliSearch               │
                          │  localhost:7700            │
                          │  (via docker-compose)      │
                          └───────────────────────────┘
```

## Quick Start

```bash
# 1. Start MeiliSearch (required for search)
docker compose up -d

# 2. Start Java API
cd anylearn_backend_v2
./mvnw spring-boot:run
# → http://localhost:8080/v2/api

# 3. Start Admin (back office)
cd anylearn_admin
npm run dev
# → http://localhost:5173

# 4. Start Next.js FE
cd anylearn_v2
npm run dev
# → http://localhost:3000

# 4. (Optional) Legacy portal
cd anylearn_portal
php artisan serve
# → http://localhost:8000
```

## Environment Variables

Root `.env` (used by HTTP test files via `$dotenv`):
```
API_TOKEN=...       # api_token cho authenticated requests
JWT_TOKEN=...       # JWT Bearer token
ADMIN_TOKEN=...     # admin-only endpoints
```

`anylearn_v2/.env.local` (optional, these are the defaults):
```
NEXT_PUBLIC_API_URL=/v2/api                 # browser calls the API on the same origin
API_SERVER_ORIGIN=http://localhost:8080     # where Next.js forwards /v2/* and where SSR fetches go
```
Testing on a phone: `ngrok http 3000` and open the ngrok URL. One tunnel is enough because `/v2/*` goes through Next.js.

`anylearn_backend_v2/application.yml` reads:
```
JWT_SECRET          # default: change-me-in-production-use-at-least-32-chars
MEILI_HOST          # default: http://localhost:7700
MEILI_MASTER_KEY    # default: local_dev_key
BANK_NAME / BANK_BIN / BANK_ACCOUNT_NUMBER / BANK_ACCOUNT_NAME   # default receiving account; admins override it in the back office (BIN 970422 = MB Bank)
GOOGLE_MAPS_API_KEY # Places API (New) key for the branch address search; empty = typed addresses only
SEPAY_API_KEY       # key of the SePay webhook, see "Bank transfer by QR"
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT   # Web Push keys (npx web-push generate-vapid-keys); empty = push off, see "PWA and push"
```

## CI (GitHub Actions, self-hosted runner)

- The runner is the production box: 2 cores, 4 GB RAM shared with Java, MySQL, MeiliSearch, Next.js and nginx. Measured peaks on 2 cores: `npm ci` about 0.9 GB, `next build` about 1 GB, `mvn package` about 0.5 GB. The three build jobs therefore run one after another (`build-backend` → `build-frontend` → `build-admin`); do not make them parallel again. If builds still get killed, add 2 GB of swap on the server.

## HTTP Test Files

Thư mục `http/` chứa VS Code REST Client files cho mọi endpoint:
- `auth.http` — login, register, OTP, password reset
- `user.http` — profile, calendar, notifications, documents
- `item.http` — PDP, reviews, CRUD courses
- `config.http` — home, categories, search, foundation
- `ask.http` — Q&A threads, voting
- `transaction.http` — history, deposit, withdraw, order
- `me.http` — dashboard, classes, students, cart (partner/student view)
- `admin.http` — admin login, dashboard, CRUD users/items/orders/transactions/articles, config, ZNS
- `today.http` — `/today` learners, today data, join, attendance, leave/reschedule requests
- `push.http` — Web Push public key, subscribe/unsubscribe a device, test notification
- `insights.http` — search logging, "Tìm giúp tôi" course requests, admin request handling and the demand report

## Porting Status (Portal → v2 + backend)

| Feature | Portal (source) | Backend v2 | FE v2 |
|---|---|---|---|
| Auth (login/register/OTP) | ✅ | ✅ | ✅ |
| Home page | ✅ | ✅ | ✅ |
| Search (courses/schools/teachers) | ✅ | ✅ | ✅ |
| PDP (course detail) | ✅ | ✅ | ✅ |
| Cart & Checkout | ✅ | ✅ | ✅ |
| User profile | ✅ | ✅ | partial |
| Partner/teacher dashboard | ✅ | partial | ❌ |
| Article/blog | ✅ | partial | ❌ |
| Q&A (ask) | ✅ | ✅ | ❌ |
| Transaction/wallet | ✅ | ✅ | ❌ |
| Admin panel | ✅ | ✅ | ✅ (anylearn_admin) |
| Today page (`/today`, learner dashboard) | new | ✅ | ✅ |
| Knowledge base | ✅ | entity only | ❌ |
| Social feed | ✅ | minimal | ❌ |

## Learner date of birth

- `users.dob_year_only` (V17): a child created from a guest's answer only has a birth year; `dob` is then January 1st of it. `LearnerDob` (service) holds the rules: complete = `dob` set and not year-only; with a year only the age is a range (`ageBounds`), so `addToCart` rejects only when no possible age fits an item's `ages_min/ages_max`.
- `CartService.checkout` first calls `requireFullDobForLearners`: any learner (a child, or the account owner when they are the learner) without a full date makes it throw `LearnerDobRequiredException` → HTTP 400, `resultCode 0`, `data = {code: "LEARNER_DOB_REQUIRED", learnerIds: [...]}`; with full dates it checks the age limit of every course again. `GET /cart` returns per line `studentId`, `learnerId`, `learnerName`, `dobComplete`, `learnerDobYear`.
- A parent cannot have two children with the same name (accents, case and spacing ignored, `PersonNames`): `POST /user/children` answers 400 "Đã có bé tên …" for a new or renamed child (editing other fields of an old duplicate still works).
- `POST /user/children` and `POST /user/edit` accept `dob` (+ `dobYearOnly: true` for a birth year); a full `dob` clears the flag. Samples: `http/user.http`.

## Who the back office notifies

- Notifications for the team (new orders, bank transfers, course requests, leave requests, audit alerts) go to `UserRepository.findAdminNotificationRecipients()`: every user with role `admin` plus the members an admin added in the back office (user menu "Cài đặt" > "Người nhận thông báo admin", `/admin/notification-recipients`; table `admin_notification_recipients`, V19; API `/admin/notification-recipients` GET / PUT `{userIds}` / POST `/test`; `AdminRecipientsService`). Use that method, never `findByRole("admin")`, for a new back-office notification.
- An added member signs in to the app as usual and turns notifications on at "Tài khoản > Thông báo"; Web Push then reaches their phone like any other notification. They cannot open the admin site (admin login needs role `admin`), and the `/admin/...` route of a notification is not a link for them.

## Search insights and course requests

- Every search with a keyword or a filter (first page only) is logged in `search_logs` (V18) by `SearchLogService`, asynchronously on a single thread (`searchLogExecutor`, so order is kept): normalized keyword (`PersonNames.normalize`), the filters as columns, result count, and who the courses are for (`aud`, `lage` params from the visitor's guest answer). The browser sends `ref` (random per search), `sk` (random id of the browser) on `/api/search` and `/api/search/users`; `POST /api/search/click {ref, itemId}` keeps the first click. Searching the same words again within 10 seconds by the same browser **refines** the earlier row instead of adding one. Pure rules: `SearchLogPolicy`.
- "Tìm giúp tôi": `POST /api/course-requests` (no login needed; phone normalized by `CourseRequestRules`, 3 requests per phone per day, `app.course-request.daily-limit`) → table `course_requests`, every admin gets a notification. Back office pages: "Nhờ tìm khóa học" (`/admin/course-requests`: statuses new/contacting/matched/no_partner/closed; `matched` needs an item id and notifies a requester who has an account with a link to the course) and "Xu hướng nhu cầu" (`/admin/search-insights`: top keywords, keywords with no result with CSV export, demand by age × area × field, requests by subject, fields with many views but few orders). Backend: `service/insights/*`, `AdminCourseRequestController`, `AdminInsightsController`.

## PWA and push

- The website installs as an app (manifest, service worker, install card): details in `anylearn_v2/CLAUDE.md` > "PWA". There is no store app any more (the old one was removed), so this is the only app.
- Web Push: every `NotificationService.createNotification` (and every scheduled notification when `dispatchDueNotifications` sends it) also goes to the person's subscribed devices after the commit, except `sms`/`zalo` types. Backend: `service/push/*` (`WebPushService`, `VapidPushTransport` with the `nl.martijndwars:web-push` library), table `push_subscriptions` (V16), API `/v2/api/push/*` (`PushController`). 404/410 from the push service deletes the device; 5 failures in a row too.
- Production needs `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (generate once with `npx web-push generate-vapid-keys`, never rotate casually). Without them the API answers `enabled: false` and the site hides the "Bật thông báo" cards.

## anyPoint preview

- Wording: the currency is always written **anyPoint** in every screen, notification and document ("120 anyPoint", never "120 điểm"); an approximate money value uses "~" ("~120.000đ"), not "=". Keep it in new texts.

- `ItemPointsResolver` (`service/points`) resolves an item's commission settings (global config, item `company_commission`, item/author rate) and is the only place that does it: order creation (`CartService.createPendingCommissions`) and the preview both call it. `GET /v2/api/points/preview?itemId=` (public) returns `{itemId, points, vndValue}`; each `GET /cart` line has `points`. Preview = the buyer points written when the order is created (same price, same config); test `ItemPointsResolverTest`. `GET /order/{id}` also returns `pointsEarned` (the buyer's own reward for the order). FE: PDP badge, checkout line and order note use `lib/points/reward.ts` (`components/points/PointsRewardBadge`). Checkout uses a switch (`components/cart/UsePointsToggle`, rules in `lib/checkout/totals.ts`: `maxUsablePoints`, `pointsToApply`); `/account/anypoint` and the public `/info/anypoint` share `components/points/HowToEarn` (texts in `config/points.ts`); `GET /user/wallet-c-history` rows carry `orderId` for the person's own purchases and spent/refunded points.

## Orders waiting for payment

- `PendingOrderFollowUpService` (`service/order`, every 15 min) looks at orders in `new`/`pay_pending`: reminders at `order/remind_hours` after creation (default `2,24`; step 1 = in-app + push `order_reminder`, step 2 and later also an email; only the latest due step is sent after downtime), and cancels the order after `order/auto_cancel_hours` (default 72) through `PaymentApprovalService.cancelOrder(id, "expired")` (status `cancel_system`, points given back, buyer told "if you already transferred, the order is restored after we check"; admins are not notified one by one). Settings are rows of the `configurations` table (`order/remind_hours`, `order/auto_cancel_hours`, `order/auto_cancel_enabled`, set it to `0` to switch cancelling off); max 50 cancellations per run. A reminder is skipped when the same course and learner is already paid in another order.
- Every step is a row in `order_followups` (V20, unique per order + kind + step), so nothing is sent twice. Pure rules and tests: `PendingOrderRules`, `PendingOrderFollowUpServiceTest`. A transfer that arrives after the cancellation still lands in `bank_webhook_events` as `needs_review` (unchanged).
- `GET /api/payment/pending-orders` rows carry `createdAt`, `expiresAt` and per item `learnerId`, `scheduleId`; `GET /api/order/{id}` carries `expiresAt`. Dashboard numbers: `GET /admin/dashboard/pending-orders?from&to` (waiting now, reminded, paid after a reminder, expired).
- FE: `components/orders/*` (`usePendingOrders` + a small store with a 1-minute throttle, `PendingOrdersCard` on `/today` and above every `/account` page, red count on the "Tài khoản" tab and the "Đơn hàng của tôi" menu item, `DuplicateOrderModal` asked by `/add2cart` and `/checkout` through `lib/orders/pendingOrders.ts`); `/account/orders` has tabs Đang chờ / Hoàn thành / Đã hủy (`lib/orders/tabs.ts`, `?tab=`). Call `refreshPendingOrders(token, true)` after anything that creates, pays or cancels an order.
- Not done: ZNS for the 24h reminder (needs an approved ZNS template id); vouchers are not marked as used at checkout, so there is nothing to give back on cancel.

## anyLEARN promise and price reports

- The promise ("giá bằng hoặc rẻ hơn tại trường", refund if the class does not open, all schedules in one place, Zalo support) lives in one file: `anylearn_v2/src/config/promise.ts` (`PROMISES`, `WHY_FAQ`, `PRICE_GUARANTEE_LINE`, Zalo link and hours). Shown by `components/promise/PromiseStrip` under the register button of a course, by one line under the totals at checkout, and in detail at `/info/why-anylearn`. The refund wording is still waiting for the owner's confirmation.
- "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": `ReportPriceButton` → `POST /api/price-reports` (open to visitors; a visitor without an account must leave a phone number; 5 per account or phone per day, `app.price-report.daily-limit`) → table `price_reports` (V21), every back-office recipient gets a notification. Back office page "Báo giá rẻ hơn" (`/admin/price-reports`: new / checking / fixed / rejected; `fixed` thanks a reporter who has an account). Backend: `service/pricing/*`, `AdminPriceReportController`. Samples: `http/admin.http`.

## Tags

- `tags` is a dictionary (name, group, sort order, hidden flag) curated in the back office page "Tags" (`/admin/tags`, `AdminTagController`, `TagService`); courses point at it through `item_tags` (V22). Only the back office creates tags; `TagService.create` returns the existing tag when the name matches ignoring accents and case. Groups are fixed in `TagGroups` ("other" = not sorted yet).
- `PUT /admin/items/{id}` takes `tagIds`; `GET` returns `tagIds`. `items.tags` and `articles.tags` (text) are no longer written by the back office; the old per-item table is `tags_old`. MeiliSearch `tags` is built from `item_tags`; `/api/search-tags` lists the most used active tags.

## Addresses of users (members and partners)

- Any user can have addresses in `user_locations` (V23: numeric `lat`/`lng`, `place_id`, `phone`, province/district/ward names; the codes are optional): a member's home (at least the area, for "near me"), a partner's branches with one head office (`is_head`, the default). There is no separate menu: back office page "Thành viên" > a user > "Cơ sở / Địa chỉ" > "Quản lý" opens `UserLocationsModal` (list with a Google Maps link, edit, hide, "đặt làm hội sở", "+ Thêm địa chỉ"). The same form (`LocationFormModal`) opens from the course page ("+ Thêm cơ sở") for the course's partner. API: `AdminLocationController` (`/admin/locations`), `LocationService`.
- Add form: "Tìm tự động" searches the typed address on Google Places (nothing typed = it searches the user's name, e.g. a known school): one result fills the form at once; several are listed with a map link, a checkbox (save it) and a radio (head office); `POST /admin/locations/bulk {userId, placeIds, headPlaceId}` saves the ticked ones (details fetched server side; the same `place_id` of a user is never saved twice).
- The course format is `items.subtype` (online, offline, digital, extra, video, preschool). **Saving a course (`PUT /admin/items/{id}`) enforces an address** (`ItemAddressRules`, `AdminItemController.applyAddressRules`) unless the format is online / digital / video or the partner's `partner_type` is `app` (sells codes): a course without classes (including a tuition-collection course, `is_paymentfee`, which has no classes but still has a place) keeps one or several addresses in `item_locations` (V26; `items.user_location_id` stays as the main one), a course with classes keeps it per class (`item_schedules.user_location_id`). One address of the partner is applied automatically; with several the person must choose, otherwise the API answers `resultCode 0` (the back office shows it; a partner with no address gets a red warning with a link to the address popup). Creating a class with several addresses ticked (`userLocationIds`) creates one class per address. `PUT` takes `userLocationIds` (the list wins over the single `userLocationId`); `GET /admin/items/{id}` returns `userLocationIds`, `isPaymentfee`, `addressRequired` and `partnerAddressCount`. `SessionViewBuilder.locationIdOf` still falls back from class to course.
- Address search: `GooglePlacesClient` (Places API (New): autocomplete + details, key `GOOGLE_MAPS_API_KEY`, kept on the server, base url `app.google-maps.base-url` so tests can use a fake; blank key = off and the form asks for typed address and coordinates). `AdministrativeMatcher` maps Google's names to our `provinces`/`districts`/`wards` codes (type words ignored, so "Quận 1" ≠ "Quận 12"); names that do not match leave the code empty. Coordinates outside Vietnam are rejected (`LocationRules`).
- `latitude`/`longitude` (text, from the old portal) are no longer read; V23 copied valid ones into `lat`/`lng`.

## Retired portal tables and partner type

- V24 renamed tables of the old portal that no code reads (`contracts`, `sale_activities`, `activitybonuses`, `spms`, `user_specs`, `user_spec_links`, `item_specs`, `item_spec_links`, `user_reviews`, `migrations`, `password_resets`) to `*_old`; drop them by hand once nothing broke. Do not add entities for them.
- `users.partner_type` (V25: school / center / club / tutor / expert / app, `PartnerTypes`; `app` = sells codes or online products, needs no address) is set per partner in the back office user page; courses inherit it for search.

## Course search attributes

- `MeilisearchService.buildDocument` adds, per course: `districtCodes`, `_geo` (default branch, else first with coordinates), `locations` (every branch with coordinates, used for `distanceKm`), `timeSlots` (`weekday|weekend` × `morning|afternoon|evening`, from the schedules), `partnerType` (of the author), `hasFreeTrial` (`items.activiy_trial`), `onSale` (`org_price > price`), `tagIds`, `pricePerSession` (price ÷ sessions from `cycle_type`/`cycle_amount`, weeks and months need the schedule's weekdays), `nextStartDay` (epoch day; a running or undated weekly class counts as today). Derivation is in `service/search` (`ItemSearchAttributes`, `TimeSlots`, `SessionCounts`), pure and tested. Nothing is stored twice; the 5 AM reindex and every item/schedule/tag save refresh it. After a deploy that changes the document, call `POST /admin/reindex` once.
- `GET /api/search` filters (all optional, built by `SearchFilterBuilder`): `ageFrom`+`ageTo` (a learner's possible ages; courses with no age limit stay), `district`, `location` (province), `nearLat`+`nearLng`+`radiusKm` (default 10, max 100; response items get `distanceKm` to their nearest branch), `timeSlot` (repeat for several), `partnerType`, `freeTrial`, `onSale`, `tag` (tag ids, repeat), `priceMin`/`priceMax`, `startWithin` (days) and `sort` = `popular|newest|priceLow|priceHigh|soonest|perSession|nearest`. The old `age`, `priceRange`, `mode` buckets still work. Filter values are quoted, so a visitor cannot inject filter syntax.
- Missing attributes: `ItemAttributeGaps` (pure) feeds `GET /admin/items/attribute-gaps`, the "Thiếu thuộc tính" back office page and the warning on a course (`gaps` in `GET /admin/items/{id}`).
- Meilisearch index settings live in `MeilisearchConfig` only (filterable and sortable lists); `_geo` supports one point per course, so "near me" matches the default branch, while `distanceKm` uses the nearest branch.
## Sessions and expired logins

- JWT lives 30 days (`JWT_EXPIRATION_MS`, default 2592000000). While a token is past half of its life, the next API call answers with a new one in the `X-Refreshed-Token` header (`JwtFilter`, `JwtService.shouldRefresh`), so people who keep using the app are never signed out.
- A request that needs a login but has no valid token gets **401** with `{resultCode: 0, code: "UNAUTHORIZED"}` (authentication entry point in `SecurityConfig`; 403 stays for "signed in but not allowed"). Public endpoints still ignore a stale token.
- FE `lib/auth/sessionGuard.ts` (installed once by `AuthProvider`) wraps `fetch` for every API call: a 401 to a request that carried the stored token clears the session and, on pages that need an account (`/account`, `/checkout`, `/order`, `/today`…), goes to `/login?expired=1&redirect=…`; a refreshed token replaces the stored one. Do not handle 401 per call. Admin: `api/client.js` does the same with `admin_token`; `components/ErrorBoundary.jsx` shows "Tải lại / Đăng xuất" instead of a white page.
- After a deploy an open tab may ask for script files of the old build: `app/error.tsx` and `app/global-error.tsx` reload the page once (`lib/errors/chunkReload.ts`, 30 s cooldown); the admin `ErrorBoundary` does the same.

## Growth roadmap

Feature plans live in `plans/` (start with `plans/00-overview.md`); progress, owner decisions and open questions in `plans/PROGRESS.md`. Update PROGRESS.md after every task.

## Shared Database Tables (Key)

Core entities: `users`, `items`, `orders`, `order_details`, `categories`, `item_categories`
Commerce: `transactions`, `vouchers`, `voucher_groups`, `participations`
Content: `articles`, `asks`, `knowledges`, `social_posts`
Course structure: `class_plans`, `schedules`, `item_schedule_plans`, `item_video_chapters`
User relations: `user_locations`, `user_banks`, `user_documents`, `user_spec_links`

Full schema in memory: `db_schema_anylearn.md`

## Bank transfer by QR (SePay)

- Order page `/order/[orderId]` shows a VietQR code next to the bank details for `bank_transfer` orders. Transfer note = `ALQR{orderId}` (e.g. `ALQR42`), built in `TransferNote.java`; the order API returns it as `transferNote`, and the FE has the same one-line format in `orderTransferNote` as a fallback when the backend is older. Keep both identical. FE: `components/payment/BankTransferPanel.tsx`, `lib/vietqr/payload.ts`; the page polls the order every 3 seconds and moves to `?status=success` when it is `delivered`.
- SePay (my.sepay.vn) webhook: `POST https://<domain>/v2/payment-notify/sepay`, authentication "API Key" (header `Authorization: Apikey <SEPAY_API_KEY>`), `SepayWebhookService` in the backend. Money in with `ALQR{id}` and amount >= order amount approves the order through `PaymentApprovalService.approveOrder` (buyer gets the in-app notification and email, admins too). Short amount, unknown order and an order that is no longer waiting are saved in `bank_webhook_events` (`mismatch`, `unmatched`, `needs_review`) and admins are notified; extra money approves and notifies admins. A transfer id is processed once.
- The receiving account is edited in the back office: user menu "Cài đặt" > "Tài khoản ngân hàng" (`/admin/bank-account`, `anylearn_admin/src/pages/BankAccount.jsx`). It is saved in the `configurations` table under `bank/*` (`BankAccountService`); the `BANK_*` env values are only the defaults used until an admin saves it. Only `SEPAY_API_KEY` must be set on the server. Sample calls: `http/payment.http`.
- SePay setup (Cấu hình công ty > Cấu trúc mã thanh toán): prefix `ALQR`, suffix from 1 to 10 characters, type "Số nguyên", turned on. SePay then also sends the extracted code in the webhook field `code`; the backend reads `code` first, then the transfer content.
- The BIN is the 6-digit Napas code of the receiving bank (the VietQR needs it; the admin page fills it from the bank you pick). Common codes (same list as `BANKS` in the CLR project):

| Bank | BIN | Bank | BIN |
|---|---|---|---|
| ACB | `970416` | MB Bank | `970422` |
| Agribank | `970405` | MSB | `970426` |
| Bản Việt (VietCapital) | `970454` | OCB | `970448` |
| BIDV | `970418` | Sacombank | `970403` |
| Eximbank | `970431` | SCB | `970429` |
| HDBank | `970437` | SeABank | `970440` |
| LPBank | `970449` | SHB | `970443` |
| Techcombank | `970407` | TPBank | `970423` |
| VIB | `970441` | VietinBank | `970415` |
| Vietcombank | `970436` | VPBank | `970432` |


## /today page (learner dashboard)

- FE: `anylearn_v2/src/app/today` (the site `Header` with today nav items on desktop, a compact header with search/cart/bell on mobile, bottom tabs on mobile; same logo, font and colors as the rest of the site). `/join/[sessionId]` checks the learner, records attendance, then opens Zoom.
- Backend: `anylearn_backend_v2/.../service/today` and `controller/today/TodayController` (`/v2/api/today/*`). Learner = the account itself ("Bạn") or its children (`users.is_child = 1`). `user_course_enrollments.user_id` is the learner.
- Session id = `{itemScheduleId}_{yyyyMMdd}`. Zoom link, room, gather time and bring-items live on `item_schedules` (edit them in admin, Item > Schedule).
- Fee items = `items.is_paymentfee = 1` without a schedule. Extra activities = `items.subtype = 'extra'`.
- Leave / reschedule requests: table `schedule_requests`, handled in admin page "Yêu cầu nghỉ / đổi lịch" (`/admin/schedule-requests`).
- Demo data: `mysql -uroot anylearn < scripts/seed_today_demo.sql` (tokens `demo_parent_token`, `demo_student_token`). Re-run any time; it removes its own rows first.
- Optional blocks (off by default): `NEXT_PUBLIC_TODAY_ROADMAP=1`, `NEXT_PUBLIC_TODAY_COMMUNITY=1`, `NEXT_PUBLIC_TODAY_SEARCH=1` in `anylearn_v2/.env.local`.
- Home redirect: a logged-in person with an active enrollment who opens `/` goes to `/today` (`components/TodayRedirect.tsx`). Links from `/today` to the home page use `/?browse=1` (`BROWSE_HOME_URL`); that sets a `sessionStorage` flag so `/` stays put for the rest of the tab. The way back is the "Hôm nay" nav item, the bar under the header and the bottom tabs. New tab or logging out resets it.
- Tests: `./mvnw test` (backend), `npm test` in `anylearn_v2` (format helpers).
