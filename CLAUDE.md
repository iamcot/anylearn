# AnyLearn — Project Overview

## Architecture: 3 Apps, 1 Database

```
┌─────────────────────────────────────────────────────────┐
│  anylearn_portal  (Laravel 5.8 / PHP)  ← LEGACY SOURCE  │
│  Port: 8000 (php artisan serve)                         │
│  Serving both web UI and REST API at /api/*             │
└─────────────────────────────────────────────────────────┘
         ↓ đang được port sang 2 app mới ↓

┌──────────────────────────┐   ┌──────────────────────────┐
│  anylearn_v2             │   │  anylearn_backend_v2      │
│  Next.js 16 / React 19   │──▶│  Spring Boot 3.5 / Java   │
│  Tailwind CSS v4         │   │  Port: 8080               │
│  Port: 3000              │   │  Context path: /v2        │
│  FE (buyer-facing)       │   │  REST API: /v2/api/*      │
└──────────────────────────┘   └──────────────────────────┘
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

# 3. Start Next.js FE
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

`anylearn_v2/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/v2/api
```

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
- `admin.http` — reindex MeiliSearch

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
| Admin panel | ✅ | minimal | ❌ |
| Knowledge base | ✅ | entity only | ❌ |
| Social feed | ✅ | minimal | ❌ |

## Shared Database Tables (Key)

Core entities: `users`, `items`, `orders`, `order_details`, `categories`, `item_categories`
Commerce: `transactions`, `vouchers`, `voucher_groups`, `participations`
Content: `articles`, `asks`, `knowledges`, `social_posts`
Course structure: `class_plans`, `schedules`, `item_schedule_plans`, `item_video_chapters`
User relations: `user_locations`, `user_banks`, `user_documents`, `user_spec_links`

Full schema in memory: `db_schema_anylearn.md`
