# anylearn_backend_v2 — Java Spring Boot API

## Stack
- **Spring Boot 3.5.3** / Java 17+
- **Spring Security** — dual auth: API token filter + JWT filter
- **Spring Data JPA + Hibernate** — MySQL dialect, ddl-auto=validate
- **Flyway** — DB migrations in `src/main/resources/db/migration/`
- **MeiliSearch Java SDK 0.14** — full-text search index
- **Lombok** — `@Data`, `@Builder`, etc.
- **Java 21** (not 17)
- **Port:** 8080 | **Context path:** `/v2`

> **Implementation status:** ~60% of endpoints are stubs returning `ApiResponse.fail("Not implemented")`.
> Fully implemented: Auth, User (read paths), Item PDP, Cart/Checkout, Config/Search, Admin Reindex.

## Running

```bash
# Chạy mặc định (không có payment config thật)
./mvnw spring-boot:run

# Chạy với config local (có credentials gateway)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
# API base: http://localhost:8080/v2/api
```

## Local config — `src/main/resources/application-local.yml`

File này bị gitignore. Điền credentials thật vào đây, không commit.

```yaml
payment:
  baseUrl: http://localhost:8080
  callbackBaseUrl: http://localhost:8080/v2   # đổi thành ngrok URL khi test gateway
  frontendUrl: http://localhost:3000
  vnpay:
    tmnCode: ...
    secret: ...
  onepay:
    accessCode: ...
    merchant: ...
    secret: ...       # hex-encoded
  momo:
    partnerCode: ...
    accessKey: ...
    secretKey: ...
```

## Test payment gateway local (cần ngrok)

VNPay/OnePay/MoMo cần gọi về server để xác nhận IPN — localhost không nhận được từ internet.
Dùng ngrok để tạo public URL trỏ vào localhost:

```bash
# Cài (một lần)
brew install ngrok

# Mỗi lần test: chạy ngrok trong terminal riêng khi backend đang chạy
ngrok http 8080
# → hiện: Forwarding https://abc123.ngrok.io -> http://localhost:8080
```

Sau đó cập nhật `application-local.yml`:
```yaml
payment:
  callbackBaseUrl: https://abc123.ngrok.io/v2
```
Rồi restart backend. Lưu ý: URL ngrok thay đổi mỗi lần restart ngrok (free tier).
# Admin base: http://localhost:8080/v2/admin
```

## Authentication

Two mechanisms in parallel (configured in `SecurityConfig`):

1. **api_token** — query param `?api_token=<token>` — validated by `ApiTokenFilter` against `users.api_token` column
2. **JWT Bearer** — `Authorization: Bearer <jwt>` header — validated by `JwtFilter` using `JwtService`

Login response returns both `apiToken` and `jwtToken`.
Public endpoints don't need auth. Protected endpoints accept either method.

## Controller Map

All controllers under `com.anylearn.backend.controller.*`, base path `/v2/api`:

### AuthController — `/v2/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/login` | Public | Login — params: `phone`, `password` |
| POST | `/register` | Public | Register — body: `{name, phone, email, password}` |
| POST | `/simple-register` | Public | Register phone only |
| GET | `/password/otp` | Public | Send OTP — param: `phone` |
| POST | `/password/reset` | Public | Reset with OTP — body: `{phone, otp, password}` |
| POST | `/otp/check` | Public | Verify OTP |

### UserController — `/v2/api/user`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/user` | Required | My profile |
| POST | `/user/edit` | Required | Edit profile |
| GET | `/user/profile/{userId}` | Public | Public profile |
| GET | `/users/{role}` | Public | Users by role (school, teacher) |
| GET | `/user/mycalendar` | Required | My schedule calendar |
| GET | `/user/notification` | Required | Notifications list |
| GET | `/user/notification/{id}` | Required | Mark notification read |
| GET | `/user/get-docs` | Required | My documents |
| GET | `/user/pending-orders` | Required | Pending orders |

### ItemController — `/v2/api/item`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/pdp/{id}` | Public | Course detail page data |
| GET | `/item/{id}/reviews` | Public | Course reviews |
| GET | `/user/{userId}/items` | Public | Items by user |
| GET | `/item/list` | Required | My items list |
| GET | `/item/{id}/edit` | Required | Item for editing |
| POST | `/item/create` | Required | Create course/item |
| POST | `/item/update` | Required | Update course/item |
| POST | `/item/status` | Required | Change item status |

### ConfigController — `/v2/api/config`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/config/homev2` | Public | Home data (banners, categories, events) |
| GET | `/config/homev2/buyer` | Public | Home data for buyer role |
| GET | `/config/category` | Public | All categories (optional `?catId=`) |
| GET | `/search` | Public | Full-text search via MeiliSearch |
| GET | `/search-tags` | Public | Tag suggestions |
| GET | `/search/users` | Public | Search schools/teachers |
| GET | `/foundation` | Public | Foundation/stats data |
| GET | `/doc/{key}` | Public | Static docs (terms, privacy) |
| POST | `/config/feedback` | Required | Submit feedback |
| GET | `/v3/home` | Public | V3 home (public) |
| GET | `/v3/auth/home` | Required | V3 home (personalized) |

### CartController — `/v2/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cart-info/{itemId}` | Required | Enrollment form data |
| GET | `/cart` | Required | Get cart items |
| POST | `/cart/add` | Required | Add to cart |
| DELETE | `/cart/{actionId}` | Required | Remove cart item |
| POST | `/checkout` | Required | Place order |
| GET | `/order/{orderId}` | Required | Get order by ID |

### TransactionController — `/v2/api/transaction`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/transaction/history` | Required | Transaction history |
| POST | `/transaction/deposit` | Required | Deposit to wallet |
| POST | `/transaction/withdraw` | Required | Withdraw from wallet |
| POST | `/transaction/exchange` | Required | Exchange wallet currencies |
| GET | `/transaction/register/{id}` | Required | Register/buy item |

### MeController — `/v2/api/v3`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v3/meAPI` | Required | My dashboard data |
| GET | `/v3/meWork` | Required | Partner work view |
| GET | `/v3/class` | Required | My classes |
| GET | `/v3/students/{itemId}` | Required | Students enrolled in item |
| GET | `/v3/locations` | Required | My teaching locations |
| GET | `/v3/categories` | Required | My categories |
| GET | `/v3/auth/study` | Required | Enrolled courses |
| GET | `/v3/auth/study/{id}` | Required | Study detail |
| GET | `/v3/auth/cart` | Required | Cart item count |

### AskController — `/v2/api/ask`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ask/list` | Public | Q&A list |
| GET | `/ask/{id}` | Public | Question thread |
| POST | `/ask/create/question` | Required | Post question |
| POST | `/ask/create/answer` | Required | Post answer |
| GET | `/ask/{id}/vote/up` | Required | Upvote |
| GET | `/ask/{id}/vote/down` | Required | Downvote |
| GET | `/ask/{id}/select` | Required | Select best answer |

### ArticleController — `/v2/api/article`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/article` | Public | Article list |
| GET | `/article/cat/{type}` | Public | Articles by category |
| GET | `/article/{id}` | Public | Article detail |

### AdminController — `/v2/admin`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/reindex` | Admin token | Reindex items to MeiliSearch |
| POST | `/admin/reindex/users` | Admin token | Reindex users to MeiliSearch |

### PaymentController (MỚI — FULLY IMPLEMENTED)

| Verb | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/initiate` | Required | Khởi tạo thanh toán, trả `{redirectUrl}` hoặc `{method:"bank_transfer"}` |
| GET | `/payment-notify/vnpay` | Public | VNPay IPN — verify hash, approve order |
| GET | `/payment-return/vnpay` | Public | VNPay return → redirect FE `/order/{id}?status=...` |
| GET | `/payment-notify/onepay` | Public | OnePay IPN — verify hash, approve order |
| GET | `/payment-return/onepay` | Public | OnePay return → approve order + redirect FE |
| POST | `/payment-notify/momo` | Public | MoMo IPN (JSON body) — approve order |
| GET | `/payment-return/momo` | Public | MoMo return → approve order + redirect FE |
Study, social feed, and open/webhook endpoints — see `http/` files for usage.

## Key Entities (JPA)

Located in `com.anylearn.backend.entity.*`:

- `User` — `users` table — core user, has `apiToken`, `jwtToken`, `walletM`, `walletC`, `role`
- `Item` — `items` table — courses, classes, events (`type`, `subtype`, `price`, `dateStart`)
- `Order` / `OrderDetail` — order management
- `ClassPlan` — teaching schedules per item
- `ItemSchedulePlan` — student enrollment plan selection
- `Participation` — student participation records
- `Category` / `ItemCategory` — course categorization
- `Ask` / `AskVote` — Q&A system
- `Article` — blog/news content
- `Transaction` — wallet transactions
- `Notification` — push notifications
- `ItemVideoChapter` / `ItemVideoLesson` — video course structure
- `Knowledge` / `KnowledgeCategory` / `KnowledgeTopic` — help center
- `Voucher` / `VoucherGroup` / `VoucherUsed` — discount system

## Services

- `AuthService` — login, register, OTP logic
- `UserService` — profile, calendar, notifications
- `ItemService` — CRUD, PDP assembly
- `CartService` — cart, checkout, order creation
- `ConfigService` — home data, categories, search config
- `MeilisearchService` — index/search against MeiliSearch

## Response Format

All endpoints return `ApiResponse<T>`:
```json
{
  "resultCode": 1,   // 1 = success, 0 = error
  "message": "...",
  "data": { ... }
}
```
FE reads `json.data ?? json`.

## Known Issues / Gotchas

1. **Checkout does NOT use `Order` entity** — `CartService.checkout()` creates `ItemUserAction` records of type `"reg"` and invents an orderId string (`userId_timestamp`). The `Order`/`OrderDetail` entities exist but are not wired in checkout yet.
2. **Path bug in MeController** — Certificate routes are mapped as `/api/user/certificate` but should be under `/api/v3`, colliding with UserController namespace.
3. **Async indexing** — `@EnableAsync` is active. All MeiliSearch `indexItem`/`indexUser` calls are `@Async` (fire-and-forget).
4. **Item types** (from Portal): `course`, `class`, `product` — with subtypes `online`, `offline`, `digital`, `extra`, `video`, `preschool`
5. **Wallet**: `walletM` = real money (VND), `walletC` = points/coins

## Database

- MySQL: `anylearn` @ localhost:3306
- User: `root`, no password
- Flyway manages schema — don't modify tables directly, add migrations
