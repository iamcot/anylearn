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
```

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

## Shared Database Tables (Key)

Core entities: `users`, `items`, `orders`, `order_details`, `categories`, `item_categories`
Commerce: `transactions`, `vouchers`, `voucher_groups`, `participations`
Content: `articles`, `asks`, `knowledges`, `social_posts`
Course structure: `class_plans`, `schedules`, `item_schedule_plans`, `item_video_chapters`
User relations: `user_locations`, `user_banks`, `user_documents`, `user_spec_links`

Full schema in memory: `db_schema_anylearn.md`

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
