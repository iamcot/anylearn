# anylearn_portal — Laravel Legacy App (Source Reference)

## Stack
- **Laravel 5.8** / PHP
- **MySQL** — same `anylearn` database as backend_v2
- **Blade templates** — server-rendered HTML
- **Botman** — chatbot integration
- **Laravel Socialite** — Facebook/Apple OAuth
- **Port:** 8000 (`php artisan serve`)

> **Role:** This is the LEGACY SOURCE app. Features here are being ported to
> `anylearn_v2` (FE) + `anylearn_backend_v2` (API). When implementing something
> new in the v2 stack, look here first to understand existing business logic.

## Running

```bash
cd anylearn_portal
php artisan serve
# → http://localhost:8000
```

## API Routes (`routes/api.php` → prefix `/api`)

The portal exposes the SAME API endpoints that `anylearn_backend_v2` is replacing:

### Public
```
GET  /login                    # phone + password
POST /login/facebook
POST /login/apple
GET  /logout
POST /register
ANY  /simple-register
GET  /password/otp             # send reset OTP
POST /password/reset
POST /otp/check

GET  /users/{role}             # list by role
GET  /user/{userId}/items
GET  /user/profile/{userId}
GET  /pdp/{id}
GET  /config/homev2/{role}
GET  /config/category/{catId?}
GET  /search
GET  /search-tags
GET  /foundation
GET  /doc/{key}
GET  /article, /article/{id}, /article/cat/{type}
GET  /ask/list, /ask/{askId}
GET  /v3/home, /v3/listing, /v3/search
GET  /v3/partner/{id}
GET  /v3/map
GET  /v3/articles
GET  /v3/main-subtypes/{subtype}
```

### Authenticated (api_token middleware)
```
GET  /user, POST /user/edit
GET  /user/mycalendar, /user/notification, /user/get-docs, /user/pending-orders
GET  /item/list, /item/{id}/edit
POST /item/create, /item/update, /item/status
GET  /cart, GET /cart-info/{itemId}
POST /cart/add, DELETE /cart/{id}
POST /checkout, GET /order/{id}
GET  /transaction/history
POST /transaction/deposit, /withdraw, /exchange
GET  /transaction/register/{id}
GET  /v3/meAPI, /v3/meWork, /v3/class, /v3/students/{id}
GET  /v3/locations, /v3/categories, /v3/auth/study, /v3/auth/study/{id}
GET  /v3/auth/cart
POST /ask/create/question, /ask/create/answer
GET  /ask/{id}/vote/up, /ask/{id}/vote/down, /ask/{id}/select
POST /config/feedback
```

## Web Routes (`routes/web.php`)

Key web pages (Blade-rendered):
- `/` — Homepage (with version middleware)
- `/search` — Search results
- `/class/{itemId}/{url}` — PDP
- `/article/{id}/{url}` — Article detail
- `/class/{itemId}/{url}/video/{lessonId}` — Video player
- `/info`, `/partner`, `/landing` — Marketing pages
- `/schools`, `/teachers`, `/classes` — Listing pages
- `/helpcenter`, `/helpcenter/{topic}` — Help center
- `/guide` — Partner guide
- `/payment-notify/{payment}` — Payment webhook
- `/payment-return/{payment}` — Payment redirect

## Controllers

### API Controllers (`app/Http/Controllers/Apis/`)
| Controller | Responsibility |
|---|---|
| `UserApi` | Auth, profile, calendar, notifications |
| `ItemApi` | PDP, CRUD, reviews |
| `ConfigApi` | Home, categories, search, foundation, docs |
| `CartApi` | Cart, checkout, orders |
| `TransactionApi` | Wallet, payments |
| `MeApi` | Dashboard, my classes, students |
| `StudyApi` | Enrolled courses |
| `AskApi` | Q&A threads |
| `ArticleApi` | Blog/news |
| `HomeApi` | V3 home |
| `ListingApi` | V3 course listing |
| `SearchFilterApi` | V3 advanced search |
| `PartnerApi` | Partner/school profile |
| `SocialController` | Social feed posts |
| `OpenApi` | Open webhooks (purchased orders) |
| `MapApi` | Location map |
| `MainSubtypesApi` | Course subtypes |

### Web Controllers (`app/Http/Controllers/`)
| Controller | Responsibility |
|---|---|
| `PageController` | Home, search, PDP, article, schools, teachers |
| `UserController` | User web pages (profile, settings) |
| `ArticleController` | Blog pages |
| `ClassController` | Class management |
| `CourseController` | Course management |
| `TransactionController` | Payment pages + webhooks |
| `DashboardController` | Partner dashboard |
| `KnowledgeController` | Help center |
| `CrmController` | CRM tracking (anylog pixel) |
| `ConfigController` | Admin config, Zalo OA |
| `ReactController` | React SPA shell pages |
| `FileController` | File upload/serve |
| `AjaxController` | AJAX utility endpoints |
| `DevToolsController` | Development utilities |
| `HelpcenterController` | Help center pages |

### Auth Controllers (`app/Http/Controllers/Auth/`)
`LoginController`, `RegisterController`, `ForgotPasswordController`,
`ResetPasswordController`, `OTPResetPasswordController`, `VerificationController`

## Models (`app/Models/`)

All models map 1:1 to the shared MySQL `anylearn` database:

Core: `User`, `Item`, `Order`, `OrderDetail`, `Category`, `ItemCategory`
Commerce: `Transaction`, `Participation`, `SaleActivity`, `Spm`
Vouchers: (via relationships)
Content: `Article`, `Ask`, `AskVote`, `Knowledge`, `KnowledgeCategory`, `KnowledgeTopic`
Course structure: `ClassPlan`, `ClassTeacher`, `Schedule`, `ItemSchedulePlan`
Course content: `ItemVideoChapter`, `ItemVideoLesson`, `ItemVideoLessonUserLink`
User extras: `UserDocument` (via relationships), `ItemUserAction`
Social: `SocialPost`
Config: `Configuration`, `I18nContent`, `ItemCode`, `ItemCodeNotifTemplate`
Finance: `Commission`, `Contract`, `Activitybonus`
Misc: `ItemActivity`, `ItemExtra`, `ItemResource`, `ItemReview`, `ItemSpec`, `ItemSpecLink`
Geo: `District`, (Province, Ward — in Java entities)
Notifications: `Notification`, `ZnsContent` (in Java)
Feedback: `Feedback`

## Key Business Logic to Reference When Porting

1. **Item types**: `type` can be `course`, `class`, `event`, `digital` — each has different enrollment flow
2. **Wallet**: Two wallets per user — `walletM` (main VND) and `walletC` (coins/points)
3. **Enrollment flow**: Cart → select student/plan/trial → checkout → payment
4. **Partner roles**: `school`, `teacher` — have dashboards, manage items, view students
5. **Trial activities**: `activiyTrial` (free trial class), `activiyTest` (entrance test), `activiyVisit` (school visit)
6. **Cart items** (`ItemUserAction` with `action_type='cart'`) vs **Orders** — separate lifecycle
7. **Vouchers**: Multi-type discount system with groups and usage tracking
8. **MeiliSearch**: Items and users indexed for fast full-text search
