# 13 – PWA (cài như app) và push notification

Giai đoạn 1 (13.0–13.6), 13.8 tuỳ kết quả kiểm kê app cũ (13.0). Nền cho trụ cột D: nhắc thanh toán (05), nhắc lịch/gia hạn (07),
gợi ý (08), chat lớp (11) đều cần một kênh **miễn phí, tới được điện thoại khi app đang đóng**. ZNS tốn tiền theo tin,
email ít người đọc; push là kênh rẻ nhất cho nhắc việc hằng ngày.

## Hiện trạng (code, 25/10/2026)

- `anylearn_v2/public/sw.js`: chỉ có `notificationclick` (mở/focus tab theo `data.url`). Không cache, không xử lý `push`.
- `components/header/useNotifications.ts`: đăng ký `/sw.js`; **tự xin quyền thông báo ngay khi đăng nhập** (không có ngữ
  cảnh, dễ bị từ chối vĩnh viễn; iOS bỏ qua vì không có thao tác của người dùng); nhận sự kiện qua **SSE** và hiện thông
  báo trình duyệt → **chỉ chạy khi tab đang mở**.
- Backend: `NotificationService.createNotification` lưu `notifications` + đẩy SSE (`NotificationSseService`) sau commit +
  email cho vài loại. **Không có Web Push / VAPID / bảng subscription.**
- Không có `manifest` → không cài được lên màn hình chính đúng cách; iOS không cho push nếu chưa cài.
- Tham khảo: dự án CLR đã có `src/app/manifest.ts` + `public/sw.js` viết tay (cache tĩnh, "Có bản mới") – dùng lại cách làm.

## App cũ trên store – ĐÃ CHỐT (25/10/2026)

App cũ **đã bị xoá khỏi store**, lượt tải không đáng kể → chọn phương án (a): **chỉ làm PWA**. Không dùng `users.notif_token`,
không FCM; 13.4 dùng Web Push thuần. 13.8 chỉ xem lại ở giai đoạn 4 nếu số liệu cài PWA trên iPhone quá thấp (khi đó là app
mới trên store, không còn ràng buộc package/bundle id cũ).

### Phân tích trước khi chốt (giữ lại để tham khảo)

- anyLEARN **đã từng có app trên store**. Dấu vết trong DB: cột `users.notif_token` (varchar 255, có từ schema portal) –
  nhiều khả năng là token Firebase Cloud Messaging (FCM) của app cũ. Backend v2 **không đọc/ghi** cột này.
- Ảnh hưởng tới plan:
  1. **Không tạo app mới trên store**: nếu lên store thì phát hành **bản cập nhật** cho đúng app cũ (giữ package name
     Android / bundle id iOS, khóa ký app, tài khoản store) để giữ lượt cài, đánh giá và người dùng cũ tự lên bản mới.
  2. **Kênh push**: nếu app store còn sống hoặc sẽ thay bằng bản bọc web, dùng **FCM** làm một đường gửi chung
     (FCM gửi được cho Android, iOS qua APNs và cả web) thay vì chỉ Web Push thuần → 13.4 chọn sau khi có 13.0.
  3. **Mời cài**: nếu app store vẫn là kênh chính, manifest khai `related_applications` và lời mời chuyển khách sang
     store thay vì cài PWA; tránh mời cài hai thứ cùng lúc.
  4. **Người dùng app cũ**: nếu app cũ còn gọi API portal (Laravel) thì họ không có QR SePay, `/today`… → cần phương án
     chuyển (cập nhật app, hoặc thông báo cuối cùng qua `notif_token` mời sang bản mới).

## Ràng buộc nền tảng (ghi nhớ khi làm)

- Web Push cần HTTPS (production đã có; local dùng `localhost` hoặc ngrok).
- **iOS/iPadOS 16.4+**: chỉ nhận push khi web đã được **"Thêm vào Màn hình chính"** và mở từ icon; xin quyền phải từ một cú bấm.
- Android Chrome: push chạy cả khi chưa cài; cài qua `beforeinstallprompt`.
- Zalo/Facebook in-app browser không hỗ trợ push và cài app → hướng dẫn "Mở bằng trình duyệt".
- Next.js 16: đọc `node_modules/next/dist/docs/` (mục PWA / manifest) trước khi viết `app/manifest.ts`.

## Task

### 13.0 Kiểm kê app cũ (làm trước 13.3, 13.4, 13.8)
Cần chủ sản phẩm/đội cũ cung cấp, ghi kết quả vào PROGRESS.md:
- App còn trên Google Play / App Store không? Lượt cài, người dùng hoạt động 30 ngày gần nhất.
- Công nghệ (native, Flutter, React Native, webview?) và còn source không. App gọi API nào (portal `/api/*`?), portal còn chạy không.
- Package name Android, bundle id iOS; **khóa ký Android (keystore) hoặc Play App Signing**; quyền vào Google Play Console,
  App Store Connect, tài khoản Apple Developer còn hạn; dự án Firebase (file cấu hình, server key / service account).
- `users.notif_token` là gì (FCM? OneSignal?), bao nhiêu dòng còn giá trị:
  `SELECT COUNT(*) FROM users WHERE notif_token IS NOT NULL AND notif_token <> ''`.
- Quyết định sau kiểm kê (hỏi chủ sản phẩm): (a) gỡ app cũ, chỉ dùng PWA; (b) giữ listing, phát hành bản bọc web mới
  (TWA Android / Capacitor iOS) cùng package/bundle id; (c) giữ app cũ như hiện tại (không khuyến khích: hai giao diện).

### 13.1 Web App Manifest + icon
- `anylearn_v2/src/app/manifest.ts`: `name: 'anyLEARN'`, `short_name`, `lang: 'vi'`, `display: 'standalone'`,
  `start_url: '/today?source=pwa'` (người chưa có khóa sẽ được đưa về trang chủ – kiểm tra `TodayRedirect`/today layout),
  `scope: '/'`, màu theo token của site, icon 192/512/maskable, `shortcuts`: Hôm nay, Lịch, Tìm khóa học, Đơn hàng.
- `public/icons/`: icon + `apple-touch-icon` + splash iOS (như CLR). Metadata `appleWebApp` trong `app/layout.tsx`.
- Kiểm tra Lighthouse "Installable".

### 13.2 Service worker
- Viết tay (không thêm thư viện), giữ `notificationclick` hiện có, thêm:
  - cache-first cho `/_next/static/`, `/icons/`; **không** cache `/v2/api/*`, trang thanh toán, đăng nhập;
  - trang offline đơn giản ("Mất kết nối, thử lại") khi mất mạng;
  - cập nhật phiên bản: đăng ký `sw.js?v=<build id>`, hiện "Có bản mới – tải lại" thay vì `skipWaiting` tự động.
- Gom đăng ký SW vào một chỗ (`components/pwa/ServiceWorkerRegister.tsx`), bỏ khỏi `useNotifications`.

### 13.3 Mời cài app (đúng lúc, không làm phiền)
- Hook `useInstallPrompt`: bắt `beforeinstallprompt` (Android); phát hiện iOS Safari chưa cài (`navigator.standalone`,
  `display-mode: standalone`); phát hiện in-app browser Zalo/FB.
- Thời điểm hiện lời mời (một lần, "Để sau" thì ẩn N ngày, config):
  - trang đơn thành công / trang QR đã thanh toán: "Cài anyLEARN để nhận nhắc lịch học của Bin";
  - `/today` lần thứ 2 trở đi.
- iOS: bottom sheet có hình hướng dẫn "Chia sẻ → Thêm vào MH chính".
- Ghi sự kiện `pwa_prompt_shown / accepted / dismissed / installed` (`appinstalled`) để đo.

### 13.4 Backend Web Push
- Chọn đường gửi theo kết quả 13.0:
  - có app store (cũ hoặc bản bọc mới) → **Firebase Admin SDK (FCM)** cho cả app lẫn web, dùng lại dự án Firebase cũ nếu còn;
  - chỉ PWA → thư viện Web Push (ví dụ `nl.martijndwars:web-push` + BouncyCastle).
  Cả hai đều là **thư viện mới, hỏi chủ sản phẩm trước**. Bảng `push_subscriptions` thêm cột `provider` (`webpush` / `fcm`)
  và `token` cho FCM; `users.notif_token` giữ nguyên cho portal cũ, chỉ đọc để chuyển dữ liệu nếu cần.
  Phương án không thêm thư viện: tự ký VAPID JWT + mã hoá `aes128gcm` – nhiều code, không khuyến khích.
- Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:info@anylearn.vn`). Ghi vào `CLAUDE.md` mục env.
  Public key trả qua `GET /v2/api/push/public-key` (không hardcode ở FE).
- Migration:
  ```sql
  CREATE TABLE push_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    endpoint VARCHAR(1000) NOT NULL,
    endpoint_hash CHAR(64) NOT NULL UNIQUE,   -- sha256(endpoint), vì endpoint quá dài để làm unique index
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NULL,                -- android / ios / desktop
    is_standalone TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    last_success_at DATETIME NULL,
    failure_count INT NOT NULL DEFAULT 0,
    INDEX idx_push_user (user_id)
  );
  ```
- API: `POST /v2/api/push/subscribe` (upsert theo `endpoint_hash`, gán user hiện tại), `POST /v2/api/push/unsubscribe`.
  Đăng xuất → FE gọi unsubscribe (máy dùng chung).
- `PushService.sendToUser(userId, payload)`: gửi tới mọi subscription của user, **bất đồng bộ** (`@Async`, pool nhỏ – server
  2 core); 404/410 → xoá subscription; lỗi khác → tăng `failure_count`, quá N lần thì xoá.
- Gắn vào `NotificationService.createNotification` cùng chỗ đẩy SSE (sau commit). Payload:
  `{ title, body, url, tag, notificationId }` – `tag` để gộp (ví dụ `order-2814`, `chat-room-12`).
- Tôn trọng cài đặt thông báo (plan 06.4) khi bảng đó có; trước đó chỉ push các loại: giao dịch/đơn, nhắc lịch, nhắc thanh toán.
- Giờ yên lặng: không push quảng cáo/gợi ý ngoài 8h–21h; nhắc lịch học thì theo giờ học.

### 13.5 FE: xin quyền đúng cách + đăng ký push
- **Bỏ** `Notification.requestPermission()` tự động lúc đăng nhập trong `useNotifications`.
- Lời mời trước (pre-prompt) của chính site, chỉ khi người dùng bấm "Bật" mới gọi `requestPermission()`:
  - sau đơn thành công: "Bật thông báo để nhận nhắc lịch học và xác nhận thanh toán";
  - `/today`: thẻ "Bật nhắc lịch học";
  - iOS: chỉ hiện khi đang chạy standalone; chưa cài thì hiện hướng dẫn cài (13.3) trước.
- Cấp quyền xong → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → gửi lên 13.4.
- Mỗi lần mở app: nếu đã có quyền, kiểm tra subscription còn không, mất thì đăng ký lại.
- Cài đặt (plan 06.4): công tắc "Thông báo trên thiết bị này" + nút gửi thử.
- Hàm thuần có test: `shouldShowPushPrompt(state)` (quyền, nền tảng, standalone, lần từ chối gần nhất), `urlBase64ToUint8Array`.

### 13.6 Service worker nhận push
- `push` event → `showNotification(title, { body, icon, badge, tag, renotify, data: { url, notificationId } })`.
- Tránh trùng với SSE: khi có tab đang mở và hiển thị (`clients.matchAll` có `visibilityState === 'visible'`), không hiện
  thông báo hệ thống (chuông trong app đã cập nhật qua SSE). Đồng thời bỏ phần tự hiện `new Notification` trong
  `useNotifications` khi đã có push.
- `notificationclick` (đã có) → mở `url`, thêm `?ntf=<id>` để đánh dấu đã đọc + đo click.
- Badge số trên icon app: `navigator.setAppBadge(unread)` nếu trình duyệt hỗ trợ.

### 13.7 Đo
- Admin dashboard: số thiết bị đăng ký push (theo nền tảng), tỉ lệ cài PWA, tỉ lệ gửi thành công, tỉ lệ click theo loại.

### 13.8 Thay app cũ trên store bằng bản dùng lại web (sau 13.0)
- Android: **TWA** (Trusted Web Activity) bọc anyLEARN web, **cùng package name + khóa ký** của app cũ → phát hành như bản
  cập nhật. Cần `/.well-known/assetlinks.json` trên domain (thêm vào Next.js `public/` hoặc nginx).
- iOS: **Capacitor** bọc web, cùng bundle id, push qua APNs/FCM. Apple có thể từ chối app chỉ là webview (guideline 4.2):
  cần thêm phần native tối thiểu (push, badge, mở link sâu) → ước lượng công riêng.
- Link sâu: `anylearn.vn/today`, `/order/...` mở thẳng trong app (Android App Links / iOS Universal Links).
- Nếu chọn (a) gỡ app: trước khi gỡ gửi thông báo cuối qua `notif_token` + bản cập nhật cuối của app cũ mở web, mời cài PWA.
- **Hỏi chủ sản phẩm** chọn (a)/(b)/(c) ở 13.0; ưu tiên có thể kéo lên giai đoạn 1–2 nếu app cũ còn nhiều người dùng.

## Tiêu chí xong (giai đoạn 1)
- Android Chrome và iPhone (đã thêm vào MH chính) cài được anyLEARN, mở từ icon vào `/today`.
- Đóng app hoàn toàn → admin duyệt đơn / job nhắc lịch chạy → điện thoại nhận push, bấm vào mở đúng trang.
- Không còn xin quyền tự động lúc đăng nhập; lời mời chỉ hiện ở đơn thành công và `/today`.
- Đăng xuất → máy đó không nhận push của tài khoản cũ.

## Cần hỏi lại khi làm
- Đồng ý thêm thư viện Java gửi Web Push (13.4)?
- Kết quả kiểm kê app cũ (13.0) và chọn phương án (a) gỡ / (b) thay bằng bản bọc web / (c) giữ nguyên.
