# anylearn_v2 — Next.js Frontend

## Stack
- **Next.js 16.2.9** with App Router (`src/app/`)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** (utility classes with the color tokens in `globals.css`, see UI rules)
- **No UI library** — all components custom-built
- **No axios** — native `fetch` API
- **Port:** 3000 (default)

## Running

```bash
npm run dev    # dev server → http://localhost:3000
npm run build  # production build
npm start      # serve production build
npm run typecheck && npm run lint && npm test   # run after every change
```

## Environment

`anylearn_v2/.env.local` (optional, these are the defaults):
```
NEXT_PUBLIC_API_URL=/v2/api                 # browser calls the API on the same origin
API_SERVER_ORIGIN=http://localhost:8080     # Java server: target of the /v2/* rewrite and of SSR fetches
ALLOWED_DEV_ORIGINS=192.168.1.10            # optional, comma-separated LAN IPs allowed to open `next dev`
```

- `src/lib/apiBase.ts` is the only place that knows the API address. Import `API_BASE` from it, never read `NEXT_PUBLIC_API_URL` elsewhere.
- `next.config.ts` rewrites `/v2/*` to `API_SERVER_ORIGIN` (in production nginx answers `/v2/*` first). Rewrites are fixed at build time, so set `API_SERVER_ORIGIN` before `next build` if it is not the default.
- Phone testing: run `npm run dev`, then `ngrok http 3000` and open the ngrok URL (ngrok domains are already in `allowedDevOrigins`). Over wifi: `ALLOWED_DEV_ORIGINS=<your LAN IP> npm run dev -- -H 0.0.0.0`, open `http://<your LAN IP>:3000`.
- Payment flows redirect to the Java `FRONTEND_URL` / `PAYMENT_CALLBACK_URL`; set them to the ngrok URL when testing payments on a phone.

## Pages (App Router)

| Route | File | Type | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Homepage: hero, categories, featured courses, events, articles |
| `/info` | `app/info/page.tsx` | Server | About/marketing page: stats, partners, team |
| `/login` | `app/login/page.tsx` | Client | Phone + password login form |
| `/register` | `app/register/page.tsx` | Client | Registration form |
| `/terms` | `app/terms/page.tsx` | Server | Terms of service |
| `/search` | `app/search/page.tsx` | Client | Search with filters (courses/schools/teachers) |
| `/class/[id]/[slug]` | `app/class/.../page.tsx` | Server | PDP — course detail, SEO metadata |
| `/add2cart/[itemId]` | `app/add2cart/.../page.tsx` | Client | Enrollment config (student, plan, trial) |
| `/checkout` | `app/checkout/page.tsx` | Client | Cart review + payment method |
| `/order/[orderId]` | `app/order/.../page.tsx` | Client | Order confirmation + payment instructions |

## Components

| Component | File | Description |
|---|---|---|
| `Header` | `components/Header.tsx` | Sticky nav; pieces in `components/header/*` (`AccountMenu`, `NotificationBell`, `MobileMenu`, `useNotifications`) |
| `Footer` | `components/Footer.tsx` | Site footer |
| `AuthModal` | `components/AuthModal.tsx` | Global overlay login/register — triggered anywhere |
| `CourseCard` | `components/CourseCard.tsx` | Reusable course card grid item |
| `SearchCard` | `components/SearchCard.tsx` | Search bar widget (used on homepage + info) |
| `PromoSlider` | `components/PromoSlider.tsx` | Promo banner carousel |
| `ScrollRow` | `components/ScrollRow.tsx` | Horizontal scroll carousel |
| `BackButton` | `components/BackButton.tsx` | Back navigation |

## Auth System

- `src/context/AuthContext.tsx` — React Context provider
- User object stored in `localStorage` as key `anylearn_user`, read through `useSyncExternalStore` (`lib/auth/userStore.ts`), so tabs stay in sync and there is no setState-in-effect. `isAuthLoading` is true on the server and during hydration.
- Exposes `user`, `login(user)`, `logout()`, `cartCount`, `refreshCartCount()`
- `AuthModal` can be opened globally; auto-redirects after login
- Auth pages (`/login`, `/register`) also work standalone

## API Client — `src/lib/api.ts`

`lib/api.ts` only re-exports the modules in `lib/api/` (`client`, `catalog`, `articles`, `auth`, `notifications`, `cart`, `orders`, `account`). Keep importing from `@/lib/api`; add new functions to the module of their domain.

Base URL: `API_BASE` from `src/lib/apiBase.ts` (`/v2/api` in the browser, `API_SERVER_ORIGIN` + `/v2/api` during SSR)

### Helper functions
- `apiFetch<T>(path)` — public requests, uses `next: { revalidate: 60 }` (ISR)
- `authFetch<T>(path, token)` — sends `Authorization: Bearer <token>` header

### Exported API functions

```typescript
getHomeV2()                    // GET /config/homev2/buyer
getCategories()                // GET /config/category
getUserProfile(userId)         // GET /user/profile/:userId
getPdpData(id)                 // GET /pdp/:id
searchItems(q, page, ...)      // GET /search?q=...&filters
searchUsers(q, role, ...)      // GET /search/users?q=...
searchTags(q?)                 // GET /search-tags

loginApi(phone, password)      // GET /login?phone=&password=
registerApi(name, phone, ...)  // POST /register

getCartInfo(itemId, token)     // GET /cart-info/:itemId  [auth]
addToCart(payload, token)      // POST /cart/add          [auth]
getCart(token)                 // GET /cart               [auth]
removeCartItem(id, token)      // DELETE /cart/:id        [auth]
checkout(payload, token)       // POST /checkout          [auth]
getOrder(orderId, token)       // GET /order/:orderId     [auth]
```

### Key TypeScript interfaces
`Item`, `PdpData`, `PdpItem`, `PdpAuthor`, `PdpReview`, `HomeData`, `Category`
`AuthUser`, `CartItem`, `CartInfoData`, `OrderData`
`SearchResult`, `UserResult`, `UserSearchResult`

## UI rules (same conventions as the CLR project)

- **Colors come from the tokens in `src/app/globals.css`** (`green`, `green-dark`, `green-soft`, `blue`, `blue-dark`, `blue-soft`, `yellow`, `red`, `red-soft`, `ink`, `text`, `muted`, `subtle`, `line`, `bg`, `navy`, `warn-*`, ...). Write `text-blue`, `bg-green-soft`, `border-line`. Do not write hex codes, `[#...]` classes or color values in `style={}` inside components. Missing a color? Add a token first.
- **Every time you touch a page with buttons, check each one: primary or secondary?** and fix its colour in the same change (do not leave a blue, yellow or tinted button behind). The legacy `btn--blue`/`btn--yellow` are now green and `btn--outline`/`btn--white` are white with a `line` border; a selected tab, filter or page number uses the chosen style, never a solid blue fill. Plain text links may stay `text-blue`.
- **Button and chip colours are one system, the same on every page**: primary action = solid green (`btn btn--green`); secondary = white with a thin `line` border; a chosen option / suggestion chip = light green (`border-green bg-green-soft text-green-dark`); a small round "change" button = solid green with a white icon and a `title`. Do not use blue for buttons or chips. The guest "who is this for" controls share `components/guest/chipStyles.ts`.
- **Font**: Be Vietnam Pro via `next/font` (`app/layout.tsx`). Weights: normal text 400; `font-medium`/`font-semibold`/`font-bold` all render 500; `font-extrabold`/`font-black` render 600 (big numbers, hero titles only). Do not set `fontWeight` inline.
- **Mobile and desktop**: design for 360px first, check 360 / 768 / 1280. One breakpoint for the app chrome: below `lg` (1024px) is mobile (compact header, bottom tabs for logged-in people), `lg` and up is desktop (full header, no tabs). Touch targets at least 44px, no horizontal page scroll.
- **Layout classes**: write Tailwind classes, not new rules in `globals.css`. The old `.btn*`, `.section*`, `.field`, `.tag`, `.search-*`, `.pdp-*`, `.hero-section` classes are being phased out page by page. These legacy classes and the `* { min-width: 0 }` reset live in `@layer base` / `@layer components`, so Tailwind utilities always override them (`btn btn--green py-2 text-sm` really is smaller). Never add unlayered CSS (except `.container`), it would beat every utility.
- **Brand gradient**: `bg-gradient-to-br from-blue to-green` (soft version: `from-blue-soft to-green-soft`). Overlays use opacity modifiers (`bg-white/15`, `text-white/90`), shadows use `shadow-card` / `shadow-raised`.
- **Icons**: inline SVG from `components/icons.tsx`, not emoji. Star ratings use `components/StarRating.tsx`.
- **Shared pieces, do not re-implement**: `formatPrice` / `formatDate` / `formatRelativeDay` in `lib/format/`, `SUBTYPE_LABELS` in `config/itemLabels.ts`, `BackLink` (fixed target) and `BackButton` (history back), skeletons in `components/PageSkeleton.tsx`, `useToast()` from `components/ToastProvider.tsx` instead of `alert()`/`confirm()`.
- **New page**: add a `loading.tsx` with a skeleton that matches the page layout (skeletons live in `components/PageSkeleton.tsx`). Without it a Server Component page freezes the old screen until its API calls finish, so a click looks dead. A `loading.tsx` also covers child routes (`helpcenter/loading.tsx` serves `helpcenter/[id]/[slug]`). Pages that read `useAuth()` must render a skeleton, not `null`, while `isAuthLoading`. The home page lives in `app/(home)/` so its skeleton does not leak onto other routes; the root `loading.tsx` is a neutral fallback.
- **Pure logic** (formatting, query building, price/date helpers) lives in `src/lib/**` as plain functions with a vitest `*.test.ts` next to it. Do not copy helpers between files.
- UI strings in Vietnamese with diacritics.

## Cart, checkout, order

- Shared pieces: `SectionCard` (card with icon header), `RadioOption` (large tap target radio), `Modal`, `ActivityFields` + `lib/activities.ts` (trial/test/visit selection and the payload sent to the API), `ItemActivityChips`, `cart/OrderLine` (one cart or order row), `cart/ApplyRow` (points / voucher input).
- Totals live in `lib/checkout/totals.ts` (`calcCheckoutTotals`, `clampPoints`); 1 anyPoint = `POINT_VALUE_VND` in `config/points.ts`.
- Schedule text comes from `lib/format/schedule.ts`; labels (cycle, weekday, activity) from `config/itemLabels.ts`.
- Tailwind resets `ol`/`ul`: add `list-decimal` / `list-disc` yourself.

## /account

- Every page wraps its content in `components/account/AccountCard`; forms use `FormField`, `Alert`; status labels use `Badge`. The menu (`app/account/layout.tsx`) is a scrollable chip bar below `lg` and a sidebar from `lg`.
- `/account/schedule`: date logic is pure and tested in `lib/schedule/calendar.ts` (`eventsOnDate`, `computeEffectiveEnd`, ...). Views are in `components/schedule/*`. Below `md` the month view shows dots plus the selected day's list, the week view stacks days, and event details open as a bottom sheet. Event colors are the `event-1..7` / `activity` tokens in `globals.css`.

## /search

- The URL is the only state: `lib/search/query.ts` parses it (`parseSearchParams`) and writes it (`buildSearchUrl`); every control calls `apply()` in `app/search/page.tsx`, which rewrites the URL with `history.replaceState`, and one effect fetches for the current URL (`lib/search/fetchResults.ts`). Page number is the `page` param (1-based). Do not add parallel `useState` copies of filters.
- UI pieces live in `components/search/*`; filter options in `config/searchFilters.ts`; recent searches in `localStorage` via `useSearchHistory`.

## /login, /register, /forgot-password, AuthModal

- Forms live in `components/auth/*` (`LoginForm`, `RegisterForm`, `AuthCard`); the pages and `AuthModal` only wrap them, do not copy a form. Validation is pure in `lib/auth/validation.ts` (tested), limits in `config/auth.ts`.
- `/login?redirect=` goes through `safeRedirect` (same-site paths only). `/login?reset=success` shows the "password reset" message.
- `AuthModal` mounts its body only while open, so each opening starts on the requested tab with empty forms.

## Bank transfer QR (order page)

- `lib/vietqr/payload.ts` builds the VietQR (EMVCo, Napas 247) string, tested; the QR is drawn in the browser with the `qrcode` package (`components/payment/useQrImage.ts`). The transfer note (`ALQR{orderId}`) comes from the order API (`transferNote`, built by `TransferNote.java`). `orderTransferNote` is only the fallback for an older backend (FE and Java deploy separately), so the QR never depends on the new field; keep both in the same format. Never hide the whole panel because an API field is missing. `BankTransferPanel` shows only while the order is `new`/`pay_pending`; `useOrderStatus` polls every `ORDER_STATUS_POLL_MS`.

## Search insights and "Tìm giúp tôi"

- `app/search/page.tsx` fetches through `fetchSearchResults(state, createSearchTracking())` (`components/search/searchTracking.ts`: a random `ref` per search, a random browser id in `localStorage` `anylearn.sessionKey`, who the visitor said the courses are for; pure parts in `lib/search/searchTracking.ts`). Only page 0 sends the tracking query. A tap on a result calls `trackSearchClick(item.id)` (`CourseResultCard`).
- A visitor with a guest answer gets the search opened already filtered to their age: `takeGuestAutoAge` runs in the fetch effect, applies the filter to the URL and waits for the next render, so the search is fetched (and logged) once.
- Form: `components/search/CourseRequestModal.tsx` (fields, prefilled from the search and the guest answer) opened by `CourseRequestCta` from the empty result (`NoResults`), a line under every result list (`RequestHelpLine`) and a block on the home page. Validation is pure in `lib/search/courseRequest.ts` (same phone rule as the server); options in `config/courseRequest.ts`; call in `lib/api/courseRequests.ts`.

## Guest learners (who the courses are for)

- A visitor who is not logged in is asked once "Bạn đang tìm khóa học cho ai?" (`components/guest/GuestLearnerSheet.tsx`, mounted by `GuestLearnerHost` in the root layout, only on `/`, `/search`, `/class/*`; "Để sau" waits `GUEST_PROMPT_DISMISS_DAYS`). The answer (children: nickname + birth year, up to 5; or themselves) lives only in `localStorage` key `anylearn.guestLearners` (`config/guestLearners.ts`); `components/guest/guestLearnerStore.ts` is the store (memory fallback when storage is blocked), `useGuestLearners` the hook. All rules are pure and tested in `lib/guest/guestLearners.ts` (parse/validate, age bucket for the search filter, name+year matching, store updates).
- Used before an account exists: chips right under the hero search box on the home page (`GuestLearnerStrip`: white bordered pills linking to `/search?age=…`, same look as the search page chips), search chips that set the existing `age` filter and open `/search` filtered once per tab (`GuestLearnerChips`), "Đăng ký cho" picker on the course page (`GuestLearnerPicker`, inside `RegisterButton`).
- Register (`AuthContext.register`): `importGuestLearners` creates each child with `POST /user/children` (`dob` = `yyyy-01-01`, `dobYearOnly: true`) **before** the login is stored, removes each one from storage as soon as it is saved, and remembers the selected child in `PENDING_CHILD_KEY`; `/add2cart` picks it (`takePendingChildId`) unless `?child=` says otherwise. Login (`LoginLeftovers` in `GuestLearnerHost`): children that already exist on the account (same name without accents; the birth year need not agree) are used as they are, the rest are offered with "Thêm bé vào tài khoản?" and the open `/add2cart` reloads its child list when they are added (`notifyChildrenChanged` / `useChildrenVersion`). The guest sheet refuses two children with the same name; any leftover guest answer is cleared once a person is logged in.
- Checkout needs the full date of birth of every learner in the cart: the cart API marks lines with `dobComplete: false` (birth year only, or none; also for the account owner), `lib/checkout/learnerDob.ts` lists them, `components/cart/LearnerDobForm.tsx` asks day + month (year preset, a different year needs a tick), and the pay button stays disabled until all are saved. The backend refuses checkout the same way (`LEARNER_DOB_REQUIRED`).

## PWA (install as an app)

- Manifest: `app/manifest.ts` (served at `/manifest.webmanifest`, starts at `/?source=pwa`). Icons in `public/icons/` (192, 512, 512 maskable, apple-touch, monochrome `badge-96` for notifications), drawn from the "a" mark of `LogoanyLEARN.svg`. `appleWebApp` metadata and `viewport.themeColor` live in `app/layout.tsx`.
- Service worker: hand-written `public/sw.js`, registered only by `components/pwa/ServiceWorkerRegister.tsx` as `/sw.js?v=<NEXT_PUBLIC_BUILD_ID>` (`next.config.ts` sets the id from `GITHUB_SHA` or the build time, and serves `/sw.js` with `no-store`). It caches only static files (`/_next/static/`, `/icons/`, `/cdn/`) and shows `public/offline.html` when a page cannot load; pages and `/v2/api` are never cached (personal data). In `next dev` it registers with `cache=0`, so nothing is cached. A new build waits until the person taps "Tải lại" in the banner; the page reloads only after that tap.
- Install card: `components/pwa/InstallAppCard.tsx`, shown on `/today` from the 2nd visit and on `/order/[id]?status=success`. Mode logic is pure and tested in `lib/pwa/installPrompt.ts`: Chrome install dialog (`beforeinstallprompt`, kept in `installPromptStore.ts`), Safari steps on iOS, "open in a browser" for Zalo/Facebook in-app browsers, hidden when already installed or after "Để sau" (`config/pwa.ts`).
- Web Push: the site never asks for notification permission by itself. `components/pwa/AppPromptCard.tsx` (on `/today` and the order page while waiting for the transfer or after payment) shows `EnablePushCard` ("Bật thông báo") when `lib/pwa/push.ts` says the browser can receive push, otherwise the install card (iPhone: notifications only work in the installed app). `/account/notifications` turns them on/off for this device and sends a test. `components/pwa/pushDevice.ts` subscribes (`/push/subscribe`), re-registers a device that already has permission once per account (`syncPushDevice`, called from `useNotifications`), and forgets it on logout (`AuthContext.logout`).
- The service worker `push` handler always shows the notification (Safari revokes silent push) with tag `notif-<id>`, the same tag the open tab uses for its SSE notification, so they replace each other. Tapping opens `/notifications/open?id&route&extra`, which marks it read and goes to `resolveNotificationRoute` (`lib/notifications/route.ts`, also used by the bell). The app icon badge follows the unread count.

## Home page (plan 04.3)

- `app/(home)/page.tsx` is server rendered (hero, partners, articles); the personal rows are client components in `components/home/*` that read `useHomeContext` (chosen child from `anylearn.activeLearner`, shared with `/search`; the saved home point for "near"). What each row asks the search API is decided by the pure `lib/home/blocks.ts`.
- `/search?locate=1` (home chip "Gần tôi") asks for the position once on arrival (`FilterBar` `autoLocate`).

## Static and content pages

- API HTML (policies, guides, articles, help center) is rendered with the `rich-content` class (list, heading, link, image styles in `globals.css`; there is no typography plugin, `prose` does nothing). Policy and guide pages share `components/DocPage.tsx` + `lib/docs/fetchDoc.ts`.
- Article type labels and icons: `config/articleTypes.ts`, `components/article/ArticleTypeLabel.tsx`. Terms text: `config/terms.ts`.

## Utility

```typescript
getCourseUrl(item)  // Generates /class/:id/:slug with Vietnamese diacritic stripping
```

## Patterns

- Lint must stay at 0 problems. Do not call `setState` synchronously inside `useEffect`: derive the value, use `useSyncExternalStore` (`useIsClient`, browser-only values) or set state inside the promise callback. Rating status for an item: `components/useItemRatingStatus.ts`.

- Server Components fetch on the server for SEO (homepage, PDP, info)
- Client Components handle interactivity (search filters, cart, auth forms)
- Protected pages check `AuthContext` and trigger `AuthModal` if not logged in (don't redirect)
- No global state library — AuthContext + local useState is sufficient
- ISR revalidation: 60 seconds for public data

## /today

- Routes: `/today`, `/today/diary` and `/today/community` (coming soon), `/join/[sessionId]`. `SiteChrome` hides the global header/footer on these routes.
- Code: `src/components/today/*`, `src/lib/today/*` (types, api, format helpers with vitest tests), flags in `src/lib/features.ts`.
- Styling follows the rest of the site (site logo, body font, `blue`/`green`/`ink`/`muted`/`line` tokens, pill buttons). The mockup is a layout reference only.
- `/today` uses the global `Header` (`components/Header.tsx` detects `/today`): nav items come from `src/lib/today/nav.ts`, the logo links to `/?browse=1`, and on mobile the hamburger is replaced by a search icon. Bottom tabs are `components/AppTabs.tsx`, rendered by `SiteChrome` for every logged-in person below `lg` (1024px) on every page; below `lg` a logged-in person also gets the compact header (logo, search, cart, bell, no hamburger). The account tab shows the user avatar. `/account` uses a sticky scrollable chip bar on mobile instead of the side menu.
- `components/SiteChrome.tsx` is a client component: it must receive `Header`/`Footer` as props from the server layout. Do not import `Footer` inside it (Footer is an async server component and would loop on the client).
- Run tests with `npm test`.
