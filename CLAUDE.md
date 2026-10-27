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
`NEXT_PUBLIC_GOOGLE_MAPS_KEY` is the browser key of the "Xem bản đồ" map (see "Course search attributes").
`NEXT_PUBLIC_CARD_POINTS=0` hides the "+X anyPoint" chip on course cards in lists (shown by default, plan 02.2).
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

## Production env checklist

- **Whenever `application.yml` gets a new `${ENV_VAR:...}`, add it in the same change to all three places**: the `Create backend .env` step of `.github/workflows/deploy-production.yml` (as `${{ secrets.NAME }}`), `deployment/env/backend.env.example`, and the secrets tables in `deployment/README.md`. Then tell the owner which GitHub secrets to create. Without this the server silently runs on the yml default.
- An env var that is written but empty overrides the yml default with an empty string (`BANK_BIN=` is not `970422`). So give a secret a value, or leave the line out; this matters for `VAPID_SUBJECT`, `BANK_BIN`, `MAIL_*`, `ZALO_*`.
- Variables needed in production beyond the basic ones: `SEPAY_API_KEY`, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`, `GOOGLE_MAPS_API_KEY`, `BANK_BIN`, `ADMIN_EMAIL_RECIPIENTS`. Optional with a safe default: `JWT_EXPIRATION_MS`, `MAIL_LOG_ONLY`.

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

## AI course suggestions

- A learner (the account or a child) gets a list of courses chosen by the Anthropic API (Claude Haiku) from a shortlist. `RecommendationService.pool` runs the rule engine (age, schedule clash, owned, dismissed, visibility via `ItemVisibility`) over every enabled source plus the survey "wants" and popular courses of the age, and keeps `recommend/ai_candidates` (default 50) of them. `AiSuggestionService` sends the profile (age, survey, learned courses, recent feedback) and one short line per course (`id | title | format | ages | price | tags | summary | rule hint`) to `AnthropicClient` (`/v1/messages`, key `ANTHROPIC_API_KEY` in `app.ai.api-key`, model `app.ai.model`), asks for the picks through a forced tool call `pick_courses` (so the answer is always valid JSON `{"picks":[{"id","reason"}]}`), caps a partner at 4 courses in the shortlist, and `AiSuggestionRules.parsePicks` keeps only ids from the shortlist; `topUp` fills to `recommend/ai_results` (default 12) from the rule ranking. Costs are kept down by sending only that shortlist, and by **one call per learner per day**: the answer is a row of `ai_suggestions` (V40, unique `learner_id + day`, tokens stored). Switched off, no key or a failed call: the rule ranking is returned with `ai: false` and nothing is saved (the next open asks again). An answer that came back but has no usable picks is saved with `status = 'fallback'` (V41) so the day's call is not repeated, and the learner can still rate it. Never commit the key.
- API: `POST /api/ai-suggestions {learnerId}` (login), `POST /api/ai-suggestions/{id}/feedback {rating 1|-1, reasons, comment}` (table `ai_suggestion_feedback`; reasons are in `AiSuggestionRules.UP_REASONS/DOWN_REASONS` and `config/aiSuggest.ts`: keep in step), `GET /api/ai-suggestions/status` (public `{enabled}`; the FE hides its entry cards when false). Views and clicks are `recommendation_events` with `source = 'ai'`, `context = 'ai_suggest'`. Admin: `GET /admin/ai-suggestions/stats` (`AiSuggestionReport`: lists opened = distinct learner-days with a view event, "xem khóa" = click events, click rate = lists with a click / lists opened), page "Gợi ý AI"; switch and the two counts live in Cài đặt > Vận hành (`RecommendationSettings`: `aiSuggestEnabled`, `aiCandidateCount` 10-100, `aiResultCount` 4-24).
- The prompt also carries the account's own signals (parent's for a child, labelled "phụ huynh …"): last 5 liked courses (`item_user_actions` fav), cart courses, followed partners (`follows`) and the last 5 search keywords of 30 days (`search_logs.user_id`) (`AiSuggestionService.appendAccountSignals`). Course page opens are not logged per user yet (not done).
- Prompt feedback loop: the learner's last 3 feedbacks (titles suggested, thumbs, reasons, comment) and the top 3 down reasons of the last 30 days are added to the prompt.
- Survey for the account owner: `GET`/`PUT /api/user/interests` (same body as a child's; `LearnerInterestService` accepts the account itself). A saved survey, even a skipped one (`rememberSkip`, stored as a `source = 'done'` row), reads `answered: true`. FE: the home card "Thử điều mới cho {bé}" (`DiscoverCard`, with a 4th line "Gợi ý từ AI") and the `/today` card (`AiSuggestEntry`) share `useAiSuggestFlow`, which asks `ChildInterestsModal` once, then opens `/ai-suggest?learner=ID` (`AiLoadingStage`: moving bar, changing lines, floating icon; at least 3 s). A visitor's answers live in the guest store (`GuestLearnerStore.interests`, key = guest learner `localId` or `self`) and `pushGuestInterests` sends them on register (`importGuestLearners`) or login (`LoginLeftovers`).

## anyPoint expiry (plan 02.5 / 02.6)

- Only members (`users.role = 'member'`) get a deadline; partners' points never expire. `point_lots` (V42): one row per credit (`points_earned`, `points_remaining`, `earned_at`); V42 also made an opening lot per member from their `wallet_c`. `wallet_c` stays the balance, the lots only say which points go first. **Every wallet_c change goes through `WalletService`** (credit adds a lot, debit spends the oldest lots first via `PointLotLedger`); `CartService.checkout` now debits through it too. Never set `wallet_c` directly.
- Expiry day of a lot = `max(earned day, points/expiry_start_date) + points/expiry_months` (`PointExpiryRules`, pure, tested). The points are usable until the end of the day before. Settings (`PointExpirySettings`, rows `points/expiry_enabled|expiry_months|expiry_start_date`, defaults on / 12 / 2027-01-01, edited on Cài đặt > Vận hành through `OperationSettingsService`; changing them moves the deadline of existing lots too). With the defaults nothing can be removed before 2028-01-01.
- `PointExpiryService` runs daily at 00:10: `expireDue` zeroes due lots, takes the points off the balance (`WalletService.expireWalletC`, never below zero) and writes a `points_expired` transaction (in `WALLET_C_TYPES` and `AuditService.WALLET_TYPES`); `remindUpcoming` sends notification type `points_expiring` (topic `points`, in `NotificationTopics` and `anylearn_v2/src/config/notificationTopics.ts`: keep in step) at 30 and 7 days before, once per member, expiry day and step (`point_expiry_reminders`). Not done: ZNS, course picks inside the reminder, reminder when the cart does not use the points.
- API: `GET /api/points/expiry-policy` (public) and `GET /api/points/expiry` (login: `applies`, `next`, `schedule`). FE: explanation page `/info/anypoint-expiry`, line under the balance on `/account/anypoint` (`lib/points/expiry.ts`).

## Course page opens per person

- `item_view_days` (V42): one row per user, course and day with a counter (`ItemViewService`), rows older than 60 days are deleted nightly. FE `components/pdp/TrackItemView` calls `POST /api/item/{id}/view` for a signed-in visitor (the server render has no token). `AiSuggestionService.appendAccountSignals` adds the last 5 courses viewed in 30 days. `item_events` (`ItemTrackingService`, popularity score, anonymous too) is now written by the same `POST /api/item/{id}/view` (public), not by `GET /pdp`, which the server render calls twice (metadata + page) and used to double every view.

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
- The course format is `items.subtype` (online, offline, digital, extra, video, preschool). **Saving a course (`PUT /admin/items/{id}`) enforces an address** (`ItemAddressRules`, `AdminItemController.applyAddressRules`) unless the format is online / digital / video or the partner's `partner_type` is `app` (sells codes): a course without classes keeps one or several addresses in `item_locations` (V26; `items.user_location_id` stays as the main one), a course with classes keeps it per class (`item_schedules.user_location_id`). One address of the partner is applied automatically; with several the person must choose, otherwise the API answers `resultCode 0` (the back office shows it; a partner with no address gets a red warning with a link to the address popup). Creating a class with several addresses ticked (`userLocationIds`) creates one class per address. `PUT` takes `userLocationIds` (the list wins over the single `userLocationId`); `GET /admin/items/{id}` returns `userLocationIds`, `isPaymentfee`, `addressRequired` and `partnerAddressCount`. `SessionViewBuilder.locationIdOf` still falls back from class to course.
- Address search: `GooglePlacesClient` (Places API (New): autocomplete + details, key `GOOGLE_MAPS_API_KEY`, kept on the server, base url `app.google-maps.base-url` so tests can use a fake; blank key = off and the form asks for typed address and coordinates). `AdministrativeMatcher` maps Google's names to our `provinces`/`districts`/`wards` codes (type words ignored, so "Quận 1" ≠ "Quận 12"); names that do not match leave the code empty. Coordinates outside Vietnam are rejected (`LocationRules`).
- `latitude`/`longitude` (text, from the old portal) are no longer read; V23 copied valid ones into `lat`/`lng`.

## Retired portal tables and partner type

- V24 renamed tables of the old portal that no code reads (`sale_activities`, `activitybonuses`, `spms`, `user_specs`, `user_spec_links`, `item_specs`, `item_spec_links`, `user_reviews`, `migrations`, `password_resets`) to `*_old`; drop them by hand once nothing broke. Do not add entities for them. (`contracts` was renamed by mistake and put back by V27: it is in use.)
- `users.partner_type` (V25: school / center / club / tutor / expert / app, `PartnerTypes`; `app` = sells codes or online products, needs no address) is set per partner in the back office user page; courses inherit it for search.

## Contracts and "signed" partners

- `contracts` (entity `Contract`) holds a partner's contract; status as in the old portal: `DELETED 0`, `NEW 1`, `SIGNED 10`, `APPROVED 99`. `users.is_signed` mirrors the status, and **99 means "signed"** everywhere in the back office (switch "Ký HĐ", filter, user search index `isSigned`): `User.hasApprovedContract()`. The API returns `isSigned` as 1/0; `PUT /admin/users/{id}/toggle-signed` writes 99 or 0 (it does not create a contract row).
- `contracts.address` is raw text. The address form of a partner shows it ("Địa chỉ trên hợp đồng … Dùng địa chỉ này", `GET /admin/locations/contract-address?userId`, approved contract first) and "Tìm tự động" with an empty field searches it before falling back to the partner's name.

- Bulk import: back office "Thành viên" > button "Nhập địa chỉ từ hợp đồng" (`ContractImportModal`; `GET /admin/locations/contract-import` (optional `q`, `role`, `status`, `isSigned`: the page passes the member list filters it is showing) lists active partners with a signed (10) or approved (99) contract that has an address and no address of their own; `POST /admin/locations/contract-import/{userId}` imports one, called one by one by the page so it shows progress and can be stopped). `ContractAddressImportService`: Google search of the contract address; **only when exactly one suggestion contains the house number and street words of the contract address** (`AddressMatch`) is it saved, as the head office titled "Hội sở"; several or doubtful matches are shown as "Cần xem lại", none as "Không tìm thấy" (link "Xử lý tay" opens the address popup). A saved row has "Hoàn tác" (hides the address). Safe to run again: partners that got an address leave the list.

## Home rows without repeats, top rated

- `HomePersonalRows` (FE) orders "Dành cho {bé}" > "Đang hot gần bạn" > "Top khóa học được đánh giá cao"; each row asks for 24 and `pickFresh` (`lib/home/dedupe.ts`) leaves out ids shown above, fewer than 4 fresh = the row hides (except the top rated row, which appends repeats after the fresh ones so it never disappears). "Hot" = `items.popularity_score` (`PopularityRollupService`: is_hot, boost, views, cart, fav, rating), the same order as the search.
- `GET /api/top-rated?limit` (public, `TopRatedService`, `TopRatedRules`): courses by average of published reviews written in the last `review/top_rated_days` (default 90, 7 to 3650, Cài đặt > Vận hành `reviewTopRatedDays`), visible courses only; the response carries the title (<=30 days "trong tháng", <=90 "trong quý", else none).

## Which courses visitors see

- One rule, `service/search/ItemVisibility`: item `status = 1` and `user_status = 1`, and its partner is active (`users.status = 1`) with an approved contract (`is_signed = 99`). Every public list uses it: Meilisearch documents carry `authorLive` and `SearchFilterBuilder` adds `authorLive != 0` (a document indexed before the field existed still passes), the SQL in `ItemRepository` (`findByIdsOrdered`, `findHotItems`, `findByAuthor`, `findLiveByCategory`), `CategoryRepository`, `CollectionService`, `PartnerController` (course count), `FollowService.announceIfNewlyOpen`; `ItemService.pdpData` answers "Trang không tồn tại" for a hidden course unless the viewer is an admin, the partner or a buyer. Changing a partner's status or signed switch calls `MeilisearchService.reindexItemsOfAuthorAsync`. Use `ItemVisibility` for any new public list.

## Course search attributes

- `MeilisearchService.buildDocument` adds, per course: `districtCodes`, `_geo` (default branch, else first with coordinates), `locations` (every branch with coordinates, used for `distanceKm`), `timeSlots` (`weekday|weekend` × `morning|afternoon|evening`, from the schedules), `partnerType` (of the author), `hasFreeTrial` (`items.activiy_trial`), `onSale` (`org_price > price`), `tagIds`, `pricePerSession` (price ÷ sessions from `cycle_type`/`cycle_amount`, weeks and months need the schedule's weekdays), `nextStartDay` (epoch day; a running or undated weekly class counts as today). Derivation is in `service/search` (`ItemSearchAttributes`, `TimeSlots`, `SessionCounts`), pure and tested. Nothing is stored twice; the 5 AM reindex and every item/schedule/tag save refresh it. After a deploy that changes the document, call `POST /admin/reindex` once.
- A course with no address of its own (none in `items.user_location_id`, `item_locations` or its classes) falls back to its partner's head office (`is_head`, else the first active address with coordinates): `ItemSearchAttributes.derive` fills `_geo`, `locations`, `districtCodes` from it and sets `locationFromPartner: true` in the search document (not shown in the UI). Own addresses always win; the course page and "Thiếu thuộc tính" still treat the course as missing an address.
- `GET /api/search` filters (all optional, built by `SearchFilterBuilder`): `ageFrom`+`ageTo` (a learner's possible ages; courses with no age limit stay), `district`, `location` (province), `nearLat`+`nearLng`+`radiusKm` (default 10, max 100; response items get `distanceKm` to their nearest branch), `timeSlot` (repeat for several), `partnerType`, `freeTrial`, `onSale`, `tag` (tag ids, repeat), `priceMin`/`priceMax`, `startWithin` (days) and `sort` = `popular|newest|priceLow|priceHigh|soonest|perSession|nearest`. The old `age`, `priceRange`, `mode` buckets still work. Filter values are quoted, so a visitor cannot inject filter syntax.
- Result cap: `GET /api/search` keeps at most `app.search.max-per-partner` (default 2, 0 = off) courses of one partner (`PartnerCap`, pure): it reads the first 300 hits (`CAP_WINDOW`), caps, then cuts the page, so `total` is the capped count; a search for one partner (`authorId`) and the admin collection search are never capped.
- Map popup of "Gần tôi": `GET /api/partners/nearby?lat&lng&radiusKm` (public) lists live `role = 'school'` partners with a branch in the circle (radius = back office setting unless sent; `NearbyPartners`, pure, max 100, nearest branch each, plain-text intro). FE `components/search/NearbyMapModal` uses the **Google Maps JavaScript API** (`lib/maps/googleMaps.ts`, loaded only when the popup opens, advanced markers as name labels, overlapping labels hide until zoomed in) from the "Xem bản đồ" button on `/search` when the near filter is on. The key is `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (build time, GitHub secret of the same name; empty = the button is hidden). It is a public key by design: in Google Cloud restrict it to **HTTP referrers** (our domains, plus `http://localhost:3000/*` for development) and to the **Maps JavaScript API** only, and set a budget alert. It is a different key from the server's `GOOGLE_MAPS_API_KEY` (Places), which must never be used in the browser.
- Missing attributes: `ItemAttributeGaps` (pure) feeds `GET /admin/items/attribute-gaps`, the "Thiếu thuộc tính" back office page and the warning on a course (`gaps` in `GET /admin/items/{id}`).
- Meilisearch index settings live in `MeilisearchConfig` only (filterable and sortable lists); `_geo` supports one point per course, so "near me" matches the default branch, while `distanceKm` uses the nearest branch.
- Search UI (plan 04.1/04.2): `GET /api/search/options?province=` lists districts and used tags (with ids), `GET /api/user/home-point` gives the member's saved home point for "Gần tôi". FE filters beyond the classic four live in `AdvancedFilters` (`lib/search/query.ts`), chips in `components/search/{LearnerChips,QuickChips}.tsx`, pure rules in `lib/search/{learners,quickFilters}.ts`.

- Prod data clean-up scripts: `scripts/prod_export_courses.sql` (read only: one row per course with gap flags, odd values, impossible data, schedules, partners) and `scripts/prod_normalize_courses.sql` (MySQL 8+; backs up `items`, `item_tags`, `items_categories`, `item_locations`, `users.partner_type` into `*_bak_n1`, then one transaction that ends in `ROLLBACK` until the person switches it to `COMMIT`; fills ages from the title, categories from the legacy `items.item_category_id` or a unique name match, tags from the tag dictionary, the single address of a partner, `partner_type = school` for `role = 'school'`; for live courses with no class at all it reads the title and description and creates one `open` ("Linh hoạt") class named "Ca linh hoạt" when the text gives weekdays (a list or one range, not Sunday), a time range or flexible wording; every change is a row of `item_autofill_log`). Run the export first, read the preview tables, call `POST /admin/reindex` after the commit. Never run on dev data you care about without the backups.

## Collections

- A collection is a hand-picked list of courses (V28: `collections` with slug, title, subtitle, cover, `season_from`/`season_to`, sort order, active; `collection_items` with the admin's order). Back office page "Bộ sưu tập" (`/admin/collections`, `AdminCollectionController`, `CollectionService`, rules in `CollectionRules`): create/edit in a drawer, courses are added from `GET /admin/collections/course-search` (the visitors' search with the same filters: keyword, age, tags, partner type, time slots, price, free trial, sale; only live courses) by ticking results ("Gợi ý theo bộ lọc" is the same call with filters), reordered with arrows, and saved with `itemIds`. A course id that does not exist is dropped on save.
- Visitors: `GET /api/collections` (active, in season, at least one live course) and `GET /api/collections/{slug}`; FE `/collections/[slug]` and the home row `CollectionsRow`. A course that is switched off disappears from the list by itself.

## Partner page, follows and discover

- Public partner page `/partner/[id]` (FE) reads `GET /api/user/profile/{id}` plus `GET /api/partners/{id}/summary` (type, live course count, follower count, `following` for a logged-in caller, active branches). Follow: `POST`/`DELETE /api/partners/{id}/follow` (table `follows`, V29), `GET /api/partners/followed`. `FollowService.announceIfNewlyOpen(item, wasLive)` is called by `AdminItemController` on save/approve: a course that just became live (status 1 and user_status 1) notifies the partner's followers once (`follow_announcements`; type `new_course`, route `/pdp`).
- `GET /api/discover` (`DiscoverController`): up to 200 courses matching the age (`MeilisearchService.searchIds`; a position only sorts them nearest first, it is never a filter, otherwise popular first), shuffled inside groups of 24 with a seed of date + child (`DailyShuffle.shuffleInBands`), paged. FE `/discover` (`components/home/DiscoverList`), button on the home page.

## Reviews

- A review is still a row of `item_user_actions` (`type='rating'`, `value` = stars, `extra_value` = comment) because search, popularity and `avgRating` read it. V30 adds `review_details` (order, `is_verified`, `status` published/hidden, partner reply), `review_scores` (criteria teacher/facility/progress/value) and `review_media`; old ratings were back-filled (verified when the writer has a delivered order). `avgRating`/`avgRatingByOwner` skip hidden reviews. Rules: `ReviewRules` (pure), service `ReviewService`.
- Rewards and reminders (V31: `review_rewards`, `review_reminders`): `ReviewRewardService` gives anyPoint once per review (`review/points_text` for a comment of 50+ characters, `review/points_media` for a photo; defaults 20 and 20, 0 = off; `ReviewSettings`, rules in `ReviewRewardRules`); transaction types `review_reward` and `review_reward_revoke`; deleting a review takes the points back (never below a zero balance); hiding does not. `save-rating` answers `pointsGiven`; `GET /api/review-rewards` (public) gives the amounts for the form. `ReviewReminderService` (hourly) sends `review_reminder` notifications at half of the course and at its end to the buyer of a delivered order who has no review (`ReviewReminderRules`: no end date = start + 30 days, nothing for courses over for more than 14 days; `review/remind_enabled`). Both settings are on the back office page Cài đặt > Vận hành.
- Hiding (V32: `review_details.hidden_reason/hidden_at/resubmitted_at`): `PUT /admin/items/{id}/reviews/{reviewId}/status {status, reason}`; hiding needs a reason (`ReviewRules.hideReasonProblem`), the author gets a `review_hidden` notification and `GET /api/item/{id}/is-fav` returns `my_rating.status/hidden_reason/resubmitted`, so the course page shows their own review dimmed with the reason. If the author saves the review while it is hidden, `resubmitted_at` is set and back office recipients are notified; showing it again clears the reason and notifies the author (`review_shown`). `GET /admin/reviews?status=all|published|hidden|resubmitted&q&page` lists every course's reviews (back office `/admin/reviews`, button "Xem tất cả đánh giá" on the course list).
- Partner reports (V34 `review_reports`): the course's partner sends `POST /api/item/{id}/reviews/{reviewId}/report {reason}` (reason 10+ chars, one per review and partner, `ReviewRules.reportReasonProblem`); back office recipients get a notification, `GET /admin/reviews?status=reported` lists them with the reason (`report`), `PUT /admin/items/{id}/reviews/{reviewId}/keep` closes it as kept, hiding the review closes it as hidden, `/admin/badges` returns `reviewsReported`. FE `components/reviews/ReportBox`.
- Menu badges: `GET /admin/badges` (`AdminBadgeController`) counts orders `pay_pending`, wallet requests (`withdraw`/`deposit`, status 0), activities with no decision, pending schedule requests, course requests that are not `closed`, price reports that are not `fixed` or `rejected` and resubmitted reviews; the admin menu polls it every minute.
- API: `POST /api/item/{id}/save-rating {rating?, comment, scores, media}` (only a person with a delivered order; rating may be derived from scores), `POST /api/item/{id}/review-media` (photo upload to S3, same checks), `GET /api/item/{id}/reviews?stars&photos`, `GET /api/item/{id}/review-summary`, `POST`/`DELETE /api/item/{id}/reviews/{reviewId}/reply` (the course's partner or admin; notification `review_reply`), `GET /api/partners/{id}/reviews`; admin `PUT /admin/items/{id}/reviews/{reviewId}/status`. FE: `components/ReviewsSection`, `RatingForm`, `components/reviews/*`, `lib/api/reviews.ts`; the partner answers on the course page (`ReplyBox`) when signed in as the owner.

## Child interest survey

- Optional answers about a child (plan 01.5): table `learner_interests` (V35; `source` likes / wants / budget), `LearnerInterestService`, `GET`/`PUT /api/user/children/{childId}/interests` `{likes, wants, budget}` (only the parent; PUT replaces everything). Allowed keys live in `LearnerInterestRules` (backend) and `anylearn_v2/src/config/interests.ts` (labels): keep both in step. FE `components/ChildInterestsModal` opens after a child is added on `/account/children`. Not used for suggestions yet.

## Account area and notification switches

- `/account` is the menu (plan 06): "Cần làm ngay" from `GET /api/me/summary` (`MeSummaryService`, list rules in `AccountTodos`: orders waiting, children without a full birth date, delivered courses with no review; the review is written on `/account/schedule`: the course popup there has "Đánh giá", and the review reminder notification routes there), the children, and on a phone the full menu list (no scrolling tab chips: other pages show a "‹ Tài khoản" back bar; menu items in `components/account/navItems.ts`). The bottom "Tài khoản" tab goes to `/account`. Child page `/account/children/[id]` (`GET /api/me/children/{id}`); `/account/orders?child=ID` filters orders (order items carry `learnerId`). `GET /api/user/schedule` returns the account and its children: every enrollment/activity row has `learner_id`/`learner_name`, plus `learners`; `/account/schedule` shows a learner picker (`forLearner` in `lib/schedule/calendar.ts`). A notification `route` that starts with `/account/` or `/order/` opens as it is (`resolveNotificationRoute`); there is no `/notifications` page, so never route to it.
- Notification switches (V36 `user_notification_prefs`, no row = on): `NotificationTopics` (pure) maps a type to a topic (`schedule`: schedule_reminder, schedule_pending; `payment`: order_reminder; `renewal`: schedule_renewal; `review`: review_reminder; `promo`: new_course) and a channel (`app` = bell + push, `email`, `zalo`); any other type is transactional and always sent. `NotificationService.createNotification` / `createScheduledNotification` / `dispatchDueNotifications` check `NotificationPrefsService` and **return null when switched off**; an email sent outside `createNotification` uses `sendEmailNotification(userId, type, subject, html)`. A new type that people may switch off: add it to `NotificationTopics` and to `config/notificationTopics.ts` if it is a new topic. API `GET`/`PUT /api/user/notification-prefs` `{topic, channel, enabled}`. The `zalo` choice is stored only; ZNS sending does not read it yet.

## Emails

- `EmailService` sends through the SMTP account; the sender shows as `spring.mail.from-name` (default `anyLEARN`, not in `application.yml` on purpose, so there is no env var to add) + `MAIL_FROM`. Templates are HTML files in `resources/templates/email/` registered in `EmailTemplates.TEMPLATES` (key `email-…`, display name, variables); a row in `configurations` with the same key overrides the file and is edited in the back office "Cài đặt Emails" (the page lists templates from `GET /admin/email-templates`; "Gửi thử cho tôi" = `POST /admin/email-templates/{key}/test`, sample values in `EmailTemplateService.SAMPLE_VALUES`). A new email = a new HTML file + an entry in `TEMPLATES` + a trigger.
- Triggers go through `NotificationService.emailTemplate(userId, type, templateKey, subject, vars)` (skips a person who switched the email channel of that notification type off, see "Account area and notification switches"; `userName` is filled automatically) and `emailAdmins(subject[, templateKey, vars])` (`EmailTemplateService.sendToAdmins`: `ADMIN_EMAIL_RECIPIENTS` + `findAdminNotificationRecipients()` emails, generic template `email-admin_notice`). Wired: `email-order_success` and admin "paid" in `PaymentApprovalService.approveOrder`; `email-order_cancelled` in `cancelOrder`; `email-order_reminder` from stage 2 in `PendingOrderFollowUpService`; `email-schedule_reminder` in `NotificationService.dispatchDueNotifications` (scheduled `schedule_reminder`); `email-user_register` in `AuthService.register`; admin emails for a new order (`CartService`), SePay alerts (`SepayWebhookService`), activity registrations (`ItemController`, `email-activity_registration`). `createNotification` itself sends no email. Reset password and OTP do not use email.

## Sessions and expired logins

- JWT lives 30 days (`JWT_EXPIRATION_MS`, default 2592000000). While a token is past half of its life, the next API call answers with a new one in the `X-Refreshed-Token` header (`JwtFilter`, `JwtService.shouldRefresh`), so people who keep using the app are never signed out.
- A request that needs a login but has no valid token gets **401** with `{resultCode: 0, code: "UNAUTHORIZED"}` (authentication entry point in `SecurityConfig`; 403 stays for "signed in but not allowed"). Public endpoints still ignore a stale token.
- FE `lib/auth/sessionGuard.ts` (installed once by `AuthProvider`) wraps `fetch` for every API call: a 401 to a request that carried the stored token clears the session and, on pages that need an account (`/account`, `/checkout`, `/order`, `/today`…), goes to `/login?expired=1&redirect=…`; a refreshed token replaces the stored one. Do not handle 401 per call. Admin: `api/client.js` does the same with `admin_token`; `components/ErrorBoundary.jsx` shows "Tải lại / Đăng xuất" instead of a white page.
- After a deploy an open tab may ask for script files of the old build: `app/error.tsx` and `app/global-error.tsx` reload the page once (`lib/errors/chunkReload.ts`, 30 s cooldown); the admin `ErrorBoundary` does the same.

## Enrollment lifecycle (plan 07)

- `LifecycleService.scan()` runs inside the hourly `ScheduleNotificationService.scan()` (optional autowired, so old unit tests still build the job by hand). It sends, inside the sending hours (`lifecycle/send_from_hour`..`send_to_hour`, default 8 to 21): before the first session (`lifecycle/pre_start_days`, default `3,1`, type `lifecycle_start`, with gather time, place, link, things to bring from `item_schedules`), a learner who missed `lifecycle/absent_streak` sessions in a row (`lifecycle_absent`, parent + back office, only for classes that have attendance rows, approved leave counts as present, only when the last miss is within 14 days) and the mid-course survey at `lifecycle/survey_percent` of the sessions (`lifecycle_survey`). Every message goes to the bell + push and by email (`email-lifecycle_*`), and is claimed first in `lifecycle_messages` (V37, unique `dedup_key`, `INSERT IGNORE`), so nothing is sent twice. Rules in `LifecycleRules` / `LifecycleMessages` (pure, tested); settings in `LifecycleSettings` (edited on Cài đặt > Vận hành through `OperationSettingsService`).
- Renewal and fee reminders stay in `ScheduleNotificationService` (type `schedule_renewal`, scheduled +2h, now also emailed by `dispatchDueNotifications` with `email-lifecycle_renew`): `PackageCards` shows renew when sessions left <= `lifecycle/renew_sessions_left` (3), time based courses are found `lifecycle/renew_days_before` (14) before their end, fee steps `lifecycle/fee_days` (`7,1`; `FeeCards` widens its due-soon window to the biggest step; one dedup key per step) and overdue keeps its own gentle reminder.
- One-tap renewal: `POST /api/lifecycle/renew {enrollmentId}` (`RenewalService`) calls `CartService.addToCart` for the same course, learner and class and tags the cart row with `renewOf` and `renewEarly`; FE `PackageCards` then opens `/checkout` (falls back to `renewLink` when it fails). When that order is paid `PaymentApprovalService` calls `RenewalService.onPaid`: an early renewal (sessions left, or the paid period still running) gives `lifecycle/early_renew_bonus_points` anyPoint (default 0 = off) once per renewed enrollment (transaction type `renew_bonus`, listed in `UserService.WALLET_C_TYPES` and `AuditService.WALLET_TYPES`; a new points type must be added to both).
- Absence alert is **off by default** (`lifecycle/absent_enabled`, switch on Cài đặt > Vận hành). Attendance: `POST /api/today/attendance` takes any session that has started (the parent marks past days in the calendar `/account/schedule`: `GET /api/user/schedule` returns `attendances` of the last 120 days, rows carry `schedule_id`, the popup offers "Đánh dấu đã đến lớp", `attendanceState` in `lib/schedule/calendar.ts`); admin marks or unmarks in "Theo dõi lịch học" (`GET /admin/enrollments/schedule` rows have `scheduleId`/`attended`, `POST /admin/enrollments/attendance {learnerId, scheduleId, date, attended}`, source `admin`). Reward: `AttendanceRewardService` gives `lifecycle/full_attendance_points` (0 = off) once per enrollment to the account when every session of the purchased count has an attendance (approved leave does not count); checked after each mark and by the hourly scan; transaction type `attendance_reward` (in `WALLET_C_TYPES` and `AuditService.WALLET_TYPES`), dedup key `full-attendance:{enrollmentId}`.
- Forgotten attendance: `GET /api/today/missed-attendance?learnerId&limit` (`MissedAttendanceService`: sessions that ended in the last 30 days with no attendance and no approved leave, newest first, `{total, items}`) feeds the "Buổi chưa điểm danh" block on `/today` (`components/today/MissedAttendanceCard`: 3 rows with "Điểm danh bù", link to `/account/schedule`); the calendar labels such sessions "Chưa điểm danh" (`components/schedule/MissedBadge` + `MissedContext`, rule `attendanceState`, a class of today that has not started is not missed).
- Survey: `GET /api/lifecycle/surveys` (waiting for the account, last 30 days), `POST /api/lifecycle/feedback {enrollmentId, score 1-5, note}` (one answer per enrollment in `enrollment_feedback`; a score at or below `lifecycle/survey_low_score` notifies the back office). FE `components/today/SurveyCard` on `/today`.
- Testing without waiting for the clock: `scripts/seed_today_demo.sql` has plan 07 scenarios (also sets the sending hours to 0-24 and a 50 anyPoint bonus), `POST /admin/lifecycle/run` runs the scan and sends due notifications, samples in `http/today.http` and `http/admin.http`.
- ZNS is not sent yet (no approved template ids): the full list of templates to register, with texts and parameters, is `docs/zns-templates.md`.

## Pathways and suggestions (plan 08)

- Pathway steps hold one or more alternative courses (V39: rows of `pathway_steps` share `step_no`, `item_order` orders them inside a step; `pathway_restarts` = a learner asked to go back to a skipped step). The admin body is `steps: [{itemIds: [...], note}]` (old `itemId` still accepted). Public JSON: `steps: [{stepNo, note, items: [{itemId,title,image,price,seoUrl,owned,related}], done, skipped, restarted, next}]`, `doneSteps`, `totalSteps`; `POST /api/pathways/{slug}/restart {learnerId, stepNo}`. Rules in `RecommendationRules` (`hasStep`, `highestDone`, `skippedSteps`, `nextStepIndex`, `relatedFirst`): a step is done when the learner has any of its courses; skipped = not done but a later step is; the next step is the one after the last step they have (or a restarted one they still lack); inside a step courses of the partner of the learner's course in the nearest earlier step come first (`related`), and the suggestion seeds give them +3 so the card picks the most related course.
- Pathways (V38 `pathways`, `pathway_steps`): an admin builds an ordered chain of courses (back office "Lộ trình & gợi ý", `/admin/pathways`, `AdminPathwayController`, `PathwayService`; the course picker is `/admin/collections/course-search`). A learner's progress is never stored: a step is "had" when there is an enrollment or a non-cancelled `order_details` row for that learner and course. Public: `GET /api/pathways/{slug}?learnerId` and `GET /api/items/{id}/pathway?learnerId` (steps with `done`, `doneSteps`, `totalSteps`).
- `RecommendationService` (`service/recommend`) is rule based and explainable. Five sources give seeds `{itemId, source, reasonCode, text, score}`: `pathway` (100, next step the learner has not got), `sibling` (70, other courses of the partner a sibling studies with; needs the target's date of birth), `free_slot` (50, a weekday with no class, same province as their classes or online), `season` (40, collections in season), `interest` (30, `learner_interests` likes searched in Meilisearch). `RecommendationRules.eligible` (pure, tested) drops owned, dismissed, wrong age and time-clashing courses (a course keeps only the classes that fit the week); `rank` keeps the best score per course. Visibility is `ItemVisibility`. Sources are switched in `recommend/sources` (default all), edited on Cài đặt > Vận hành (`RecommendationSettings`, also `recommend/dismiss_days`, default 30).
- API: `GET /api/recommendations?context=today&learnerId` (one card for /today) and `context=order_success&orderId` (siblings of the learners in that order, max 3), `POST /api/recommendations/events {learnerId,itemId,source,context,event view|click}` (a view is stored once a day per learner, course and place), `POST /api/recommendations/dismiss {learnerId,itemId}` ("Không quan tâm": table `recommendation_dismissals` until now + dismiss days). `GET /admin/recommendations/stats?from&to`: per source views, clicks, click rate and `orders` (a click followed by an order of that course for that learner within 30 days). No push for suggestions; `ScheduleNotificationService.remindSessionsLeft` appends the next pathway step to the "running out of sessions" message.
- Course page: `PathwayBlock` is a step bar (horizontal on desktop, vertical on a phone; this course's step big, other steps 2 course pictures; the whole card opens the pathway page) and `ItemCollections` lists the collections that contain the course (`GET /api/collections?itemId=`, `CollectionService.listForItem`). The pathway page has a vertical dot rail with the courses of a step in a row.
- Full pathway page `/pathway/[slug]?child=ID` (`app/pathway/[slug]/page.tsx`: steps with done / next step per learner, linked from the pathway suggestion card (`pathwaySlug` in the recommendation) and from `PathwayBlock` on the course page).
- FE: `components/recommendations/*` (`TodayRecommendation` on `/today`, `OrderRecommendations` on `/order/[orderId]` once paid, `RecommendationCard` counts view/click and has the dismiss button), `lib/api/recommendations.ts`. Demo data and the test flow are at the end of `scripts/seed_today_demo.sql` and in `http/today.http` / `http/admin.http`. Not done: "Đi kèm" and "Người khác cũng mua" (need co-purchase data), family discount (08.5, waits for plan 10).

## Admin guide (keep it current)

- `docs/huong-dan-admin.md` is the manual for the back office team (Vietnamese): what data to enter, how search, home page, collections and settings use it, what to do after a change. **Whenever a task adds or changes something an admin enters, configures or sees the effect of (a new field, filter, setting, menu page, env variable, default value), update that file in the same change**, following the pattern in its last section.
- Operation settings editable by the team (no developer): back office "Cài đặt" > "Vận hành" (`/admin/settings`, `OperationSettingsService`, rules in `SettingsRules`): `search/near_radius_km` (default 10, 1 to 100, used by `/api/search` when `radiusKm` is not sent and by the home row "Đang hot gần bạn"), `order/remind_hours`, `order/auto_cancel_hours`, `order/auto_cancel_enabled`; the same page has the button that runs `POST /admin/reindex`.

## Payment methods

- The checkout list is not hard-coded: `PaymentMethodRules.DEFINITIONS` (keys `bank_transfer`, `card`, `vnpay`, `momo`, `installment`, default labels and amount ranges) plus rows of `configurations` `payment/{key}/enabled|min|max|label` (`PaymentMethodService`, back office page "Phương thức thanh toán", `/admin/payment-methods` GET / PUT `{methods:[{key,enabled,min,max,label}]}`; at least one must stay on). `GET /api/payment/methods?total=` returns what to show: enabled and `min <= total <= max` (`max` 0 = no limit; installment defaults to 3,000,000, momo 1,000 to 50,000,000). `POST /api/cart/checkout` and `POST /api/payment/initiate` refuse a method that is switched off (the range is only for display, since coupons and anyPoint lower the paid amount). FE `components/PaymentMethodSelector` loads the list and falls back to the old built-in one when the call fails. A new gateway needs an entry in `DEFINITIONS` and a `case` in `PaymentController.initiatePayment`.

## Class chat (plan 11)

- One room per **course** (`chat_rooms.item_id`, unique; all classes of the course share it): `chat_rooms`, `chat_members` (role member / moderator, display name + `rules_accepted_at`, `banned`, `muted_until`, `left_at`), `chat_messages` (`is_hidden`, `is_pinned`, type text / announcement), `chat_reports` (V43). `ChatService` (JdbcTemplate, **every method checks membership**) creates rooms and memberships lazily in `sync(user)` when the person lists rooms: an account is a member when it, or a child (`users.user_id` = parent), has an `active` enrollment in the course (a class is not required); the member's class(es) are kept in `chat_members.class_label` and shown after the chosen name ("Mẹ Bin · Thứ 2 18:00"), the join screen tells parents about it; children accounts never chat; a member ends `retention_days` after the course end. The partner of the course (`items.user_id`) is a `moderator` (setting `chat/partner_moderator`); an admin adds teachers or supporters with `ChatAdminService.addMember` (moderators are never removed by the sync). Pure rules: `ChatRules` (+ test); settings `ChatSettings` (`chat/enabled`, `chat/rate_per_minute` 20, `chat/retention_days` 30, `chat/banned_words`, `chat/rules_text`, `chat/partner_moderator`), edited on back office "Chat lớp" > Cài đặt.
- API `/api/chat/*` (rooms, room, join {displayName, acceptRules}, messages `?before|after`, send {body, replyToId, announcement}, read, `messages/{id}/report|hide|pin`); admin `/admin/chat/*` (reports, handle report hide/dismiss + ban/mute, rooms, lock, members, ban, settings); `GET /admin/badges` has `chatReports`. New messages are pushed with the existing SSE stream as event `chat` (`NotificationSseService.notifyChat`); the page also polls every 10 s. A moderator message with `announcement: true` notifies every member (`chat_announcement`). Members are shown only by their chosen name, never phone or email. Samples: `http/chat.http`. FE: `app/today/community`, `components/chat/useChatUnread` (badge on the "Cộng đồng" tab), `lib/api/chat.ts`.
- Not done: photos, grouped notifications per room, per-room mute, nightly reconcile job, "Nhóm lớp" button on the course page.

## Member tiers and family offer (plan 10.2 / 10.3)

- Tier = spending of the last 12 months in `delivered` orders of a `role = 'member'` user: member / silver / gold / diamond (`MemberTierRules`, pure, tested; table `member_tiers`, V44; `MemberTierService` refreshes one member in `PaymentApprovalService.approveOrder`, everyone nightly at 00:30, and `POST /admin/membership/refresh`). Settings `MembershipSettings` (`tiers/enabled`, `tiers/silver_min|gold_min|diamond_min` default 3,000,000 / 10,000,000 / 30,000,000, `tiers/mult_silver|gold|diamond` default 1.2 / 1.5 / 2.0), edited on back office "Hạng & ưu đãi gia đình" (`/admin/membership`).
- The multiplier boosts only the **buyer's own anyPoint** (`CartService.createPendingCommissions`, and the `points` of each `GET /cart` line); the public preview on the course page (`/points/preview`) and partner / referral points are the base values. `GET /api/me/tier` returns `{applies, tier, label, spent12m, multiplier, next, nextLabel, remaining, tiers}`; FE `components/membership/TierCard` on `/account` and `/account/anypoint`. The class chat shows a tier badge next to a silver / gold / diamond author's name.
- Family offer: the second child and later of one account (`users.is_child`, same `users.user_id`) get `family/percent` (default 5) off their cart lines when another child registered inside `family/window_days` (30) in a non-cancelled order, or is earlier in the same cart (`FamilyDiscountRules`, `FamilyDiscountService`, switch `family/enabled`). `GET /cart` lines carry `familyDiscount`; `checkout` lowers `order_details.paid_price` and `orders.amount` (so the bank transfer asks for the lower amount); `GET /order/{id}` has `familyDiscount`. The account itself is never discounted. Not done: per-partner percentage, bonus anyPoint instead of percent.
- "Ưu đãi của tôi" (plan 06.5): `/account/rewards` (menu item after anyPoint) gathers the anyPoint balance + expiry line, `TierCard`, the family offer rule and the referral block; `GET /api/me/rewards` (`RewardsSummaryService`: `referral {code, link, invited, pointsEarned}` = users whose `user_id` is the account and not a child, and `commission` rows with `ref_user_id` set; `family {enabled, percent, windowDays}`). Vouchers are not on the page (they have no owner yet; the voucher plan comes later).
- Suggestion cards (plan 08.5): `RecommendationService.addFamilyOffer` adds `familyPercent` to every card (rule sources and AI list) of a child whose sibling registered inside the window (`FamilyDiscountService.offerPercent`, pure `FamilyDiscountRules.offerPercent`); FE chip `familyChip` on `RecommendationCard` and `AiCourseCard`. It is a preview of the cart discount.

## Course comparison (plan 04.6)

- The parent picks 1 to 3 courses by hand ("So sánh" button on `CourseCard` and the course page, `components/compare/CompareToggle`; the picks live in `localStorage` key `compare:v1`, `lib/compare/store.ts`, pure rules `selection.ts`; the text link "+ So sánh" sits bottom left of every course card (home, search results, partner, collections), "Tìm hiểu thêm" bottom right; on the course page the "Khám phá thêm" cards show it only while a comparison is open (`CompareWhenActive`); `CompareBar` above the bottom tabs (round avatar + × per pick, names hidden on a phone, a "+" to `/search` while fewer than 3, "So sánh (n)", an × to close), on every page (the compare page too) until the parent presses "Đóng so sánh" (picks are green chips with a big ×, "Xem so sánh" opens the table); max `MAX_COMPARE` = `CompareRules.MAX_COURSES` = 3, keep both). Page `/compare?ids=1,2,3` (the address carries the picks, so it can be shared).
- Objective by design: **figures only, no score, no "best course", no order by anything but the parent's picks**. `GET /api/compare?ids&lat&lng` (public, `CompareService`): price, price per session, sessions, schedule lines, start date, ages, distance to the nearest branch (needs a position: the member's home point), published review average + count, free trial, buyer anyPoint (`ItemPointsResolver`); only visible courses (`findByIdsOrdered`). `best` marks a row's best figure (lowest price, per session, nearest, most anyPoint) only when it is a clear one (`CompareRules.bestIndex`, ties and single values mark nothing). A missing figure is "Chưa có thông tin"; rows nobody has are hidden; the table rows alternate white and grey and have an icon (`ROW_ICONS` in `CompareView`, `icon` key in `lib/compare/rows.ts`); the row "Ca học" lists the classes (`open` classes read "linh hoạt") or the session count when there is no class (there is no start date row); "anyPoint nhận về" shows the share of the price (`pointsText`); the AI block is headed by the sparkle icon and "AI phân tích"; `mixedFormats` adds a note that price per session is loose.
- Field check: `CompareService` adds `fieldNotice` + `offField` (and each column's `categories`, a "Lĩnh vực" row). Two courses are related when they share a category or a tag (`CompareRules.fieldNotice`, pure, tested, no AI); a course related to none of the others is flagged "Khác lĩnh vực" and a yellow note names it; a course with no category and no tag is unknown, never flagged, but a yellow note says its field could not be checked (`off` empty). The parent can still compare them (figures stay).
- AI reading of descriptions: `GET /api/compare/highlights?ids` (public, `CompareAiService`): one forced tool call (`AnthropicClient.askTool`, tool `write_facts`) for the courses not yet read; per course only `audience`, `method`, `includes`, `bring`, `outcome` (`CompareRules.FACT_LABELS`), taken from the description, empty when it does not say ("Mô tả không nêu"), no praise or ranking (the system prompt says so; the page labels the block "AI đọc và ghi lại điều mô tả nêu"). Answers are stored per course in `item_compare_facts` (V45) with a hash of the title and description (`CompareRules.contentHash`), so a course costs one call until its text changes; a course the model skipped or a failed call is not saved and is asked again on the next view. Same switch and key as the AI suggestions (`recommend/ai_enabled`, `ANTHROPIC_API_KEY`); off = saved facts still show, the block hides when there are none. Descriptions are cut to 3000 characters and sent as data.
- Not done: comparing from the search results page with a floating count, AI "which suits my child" advice (kept out on purpose), admin report of the AI calls for comparison.

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
- SePay (my.sepay.vn) webhook: `POST https://<domain>/v2/payment-notify/sepay`, authentication "API Key" (header `Authorization: Apikey <SEPAY_API_KEY>`), `SepayWebhookService` in the backend. Money in with `ALQR{id}` and amount >= order amount approves the order through `PaymentApprovalService.approveOrder` (buyer gets the in-app notification and the `email-order_success` email, back office recipients get a notification and an email). Short amount, unknown order and an order that is no longer waiting are saved in `bank_webhook_events` (`mismatch`, `unmatched`, `needs_review`) and admins are notified; extra money approves and notifies admins. A transfer id is processed once.
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
