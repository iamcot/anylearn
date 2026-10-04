# anyLEARN — Hướng dẫn Deploy

## Kiến trúc sau khi deploy

```
Internet
    │
    ▼
nginx (port 80/443) — anylearn.vn
    ├── /admin/*           → PHP Laravel  (port 8000, giữ nguyên)
    ├── /v2/*              → Java API     (port 8080)
    ├── /payment-notify/*  → Java API     (rewrite → /v2/payment-notify/*)
    ├── /payment-return/*  → Java API     (rewrite → /v2/payment-return/*)
    └── /*                 → Next.js FE   (port 3000)

Java API ──▶ MySQL anylearn (shared với PHP portal)
Java API ──▶ MeiliSearch port 7700 (Docker)
Java API ──▶ AWS S3
```

---

## Bước 1 — One-time Server Setup (chỉ làm một lần)

SSH vào server và chạy:

```bash
git clone <repo-url> /tmp/anylearn-setup
cd /tmp/anylearn-setup

sudo bash deployment/setup/server-setup.sh
```

Script tự động:
- Cài Java 21, Node.js 20, Docker (nếu chưa có)
- Tạo user `anylearn-app` + group `anylearn-deploy`
- Tạo cấu trúc `/opt/anylearn/`
- Cài systemd services
- Cấu hình sudo permissions

---

## Bước 2 — Setup MeiliSearch (chỉ làm một lần)

```bash
# Copy docker-compose lên server
scp docker-compose.yml user@server:/opt/anylearn/meilisearch/

# Tạo .env
ssh user@server
cp /tmp/anylearn-setup/deployment/env/meilisearch.env.example /opt/anylearn/meilisearch/.env
nano /opt/anylearn/meilisearch/.env   # điền MEILI_MASTER_KEY

# Start
cd /opt/anylearn/meilisearch && docker compose up -d

# Verify
curl http://localhost:7700/health   # → {"status":"available"}
```

---

## Bước 3 — Cài nginx (chỉ làm một lần)

```bash
cd /tmp/anylearn-setup
bash deployment/nginx/install-nginx.sh
```

---

## Bước 4 — Cấu hình GitHub Actions

### 4a. Cài GitHub Actions Runner trên server

1. Vào GitHub repo → **Settings → Actions → Runners → New self-hosted runner**
2. Làm theo hướng dẫn GitHub để cài runner trên server
3. Khi configure, đặt label: `production`
4. Start runner:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### 4b. Thêm GitHub Secrets

Vào **Settings → Secrets and variables → Actions → New repository secret**:

**Database:**
| Secret | Giá trị |
|--------|---------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/anylearn?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `SPRING_DATASOURCE_USERNAME` | `root` |
| `SPRING_DATASOURCE_PASSWORD` | _(để trống nếu không có password)_ |

**App:**
| Secret | Giá trị |
|--------|---------|
| `JWT_SECRET` | _(generate: `openssl rand -base64 32`)_ |
| `APP_URL` | `https://anylearn.vn` |
| `PAYMENT_CALLBACK_URL` | `https://anylearn.vn` |
| `FRONTEND_URL` | `https://anylearn.vn` |
| `NEXT_PUBLIC_API_URL` | `https://anylearn.vn/v2/api` |

**MeiliSearch:**
| Secret | Giá trị |
|--------|---------|
| `MEILI_HOST` | `http://localhost:7700` |
| `MEILI_MASTER_KEY` | _(trùng với .env MeiliSearch)_ |
| `ADMIN_API_TOKEN` | `SELECT api_token FROM users WHERE role='admin'` |

**Payment Gateways:**
| Secret | |
|--------|--|
| `VNPAY_SERVER` | `https://pay.vnpay.vn/vpcpay/vpcpay.op` |
| `VNPAY_TMN_CODE`, `VNPAY_SECRET` | |
| `ONEPAY_SERVER` | `https://onepay.vn/paygate/vpcpay.op` |
| `ONEPAY_ACCESS_CODE`, `ONEPAY_MERCHANT`, `ONEPAY_SECRET` | |
| `ONEPAYTG_SERVER` | `https://onepay.vn/vpcpay/vpcpay.op` |
| `ONEPAYTG_ACCESS_CODE`, `ONEPAYTG_MERCHANT`, `ONEPAYTG_SECRET` | |
| `MOMO_SERVER` | `https://payment.momo.vn` |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | |

**Bank Transfer:**
| Secret | |
|--------|--|
| `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME` | |
| `BANK_TRANSFER_CONTENT`, `BANK_ZALO_PHONE` | |

**AWS S3:**
| Secret | |
|--------|--|
| `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` | |
| `AWS_REGION` | `ap-southeast-1` |
| `AWS_S3_BUCKET`, `AWS_CDN_URL` | |

---

## Bước 5 — Deploy (mỗi lần release)

Vào **GitHub repo → Actions → Deploy to Production → Run workflow**

Chọn:
- ☑ Deploy backend
- ☑ Deploy frontend

Workflow tự động:
1. Build Java jar (Maven)
2. Build Next.js
3. Tạo `.env` từ GitHub Secrets lên server
4. Deploy backend với zero-downtime (symlink switch)
5. Deploy frontend với zero-downtime
6. Health check
7. Tự động rollback nếu health check fail
8. Trigger MeiliSearch reindex (background)

---

## Rollback

### Rollback về release trước (version mới bị lỗi)

```bash
ssh user@server
sudo -u anylearn-app bash /opt/anylearn/scripts/rollback.sh backend
sudo -u anylearn-app bash /opt/anylearn/scripts/rollback.sh frontend
```

### 🚨 Emergency — Revert về PHP frontend (~5 giây)

Khi Next.js có lỗi nghiêm trọng, không sửa kịp:

```bash
ssh user@server
sudo bash /opt/anylearn/scripts/rollback-to-php.sh
```

Java API (/v2/) vẫn tiếp tục chạy bình thường.

Restore lại Next.js sau khi fix:
```bash
sudo cp /etc/nginx/sites-available/anylearn.conf /etc/nginx/sites-enabled/anylearn.conf
sudo systemctl reload nginx
```

---

## Operations

### Xem logs

```bash
# Backend
tail -f /opt/anylearn/backend/logs/app.log
journalctl -u anylearn-backend.service -f

# Frontend
tail -f /opt/anylearn/frontend/logs/app.log
journalctl -u anylearn-frontend.service -f

# MeiliSearch
cd /opt/anylearn/meilisearch && docker compose logs -f
```

### Restart services

```bash
sudo systemctl restart anylearn-backend.service
sudo systemctl restart anylearn-frontend.service
```

### Trigger reindex thủ công

```bash
ADMIN_TOKEN=$(grep ADMIN_API_TOKEN /opt/anylearn/backend/.env | cut -d= -f2)
curl -X POST "https://anylearn.vn/v2/admin/reindex?api_token=${ADMIN_TOKEN}"
curl -X POST "https://anylearn.vn/v2/admin/reindex/users?api_token=${ADMIN_TOKEN}"
```

### List releases

```bash
ls -la /opt/anylearn/backend/releases/
ls -la /opt/anylearn/frontend/releases/
```

---

## Lưu ý quan trọng

- **PHP portal**: `/admin` giữ nguyên, không đụng vào Laravel app.
- **Database**: Java và PHP dùng chung DB `anylearn`. Flyway chỉ `validate` — không tự migrate khi deploy.
- **Payment callbacks**: Gateway đăng ký URL `anylearn.vn/payment-notify/*` (không có `/v2`). Nginx rewrite tự động.
- **MeiliSearch key**: `MEILI_MASTER_KEY` trong GitHub Secrets phải giống với `meilisearch/.env`.

---

## Admin API — Gửi thông báo đến user

Tất cả admin endpoints yêu cầu `?api_token=ADMIN_TOKEN` (api_token của user có `role='admin'` trong DB).

### Gửi thông báo in-app cho một user

```bash
POST https://anylearn.vn/v2/admin/notification/send?api_token=ADMIN_TOKEN
Content-Type: application/json

{
  "phone": "0374900344",
  "type": "system_notif",
  "title": "Tiêu đề thông báo",
  "content": "Nội dung thông báo hiển thị cho user.",
  "route": "/account"
}
```

**Các giá trị `type` phổ biến:**
| type | Ý nghĩa | Icon hiển thị |
|---|---|---|
| `system_notif` | Thông báo hệ thống | 📢 |
| `order` | Liên quan đến đơn hàng | 🛒 |
| `payment` | Liên quan đến thanh toán | 💳 |
| `voucher_partner_sent` | Gửi mã voucher | 🎁 |

**Các giá trị `route` được hỗ trợ trên FE:**
| route | Điều hướng tới |
|---|---|
| `/account` hoặc `/account/edit` | Trang thông tin cá nhân |
| `/account/calendar` | Lịch học |
| `/transaction` hoặc `/foundation` | Ví anyPoint |
| `/pdp` (kèm `extraContent: "itemId"`) | Trang chi tiết khóa học |
| `/article` (kèm `extraContent: "articleId"`) | Bài viết |
| *(bỏ trống)* | Chỉ mark as read, không điều hướng |

**Gửi voucher có thể copy:**
```json
{
  "phone": "0374900344",
  "type": "voucher_partner_sent",
  "title": "Bạn nhận được mã giảm giá!",
  "content": "Dùng mã bên dưới để được giảm 20% học phí.",
  "route": "VOUCHER_CODE_XYZ",
  "extraContent": "copy"
}
```

**Response thành công:**
```json
{
  "resultCode": 1,
  "data": { "notificationId": 42, "userId": 123 }
}
```

Thông báo sẽ xuất hiện ngay lập tức trên bell icon nếu user đang mở trình duyệt (SSE push). Nếu user đã cấp quyền push notification cho browser, sẽ nhận được thông báo kể cả khi tab đang ở background.
- **node_modules**: Workflow tự detect khi `package.json` thay đổi và cập nhật shared `node_modules`.
