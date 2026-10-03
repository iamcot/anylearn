# anylearn_v2 — Next.js Frontend

## Stack
- **Next.js 16.2.9** with App Router (`src/app/`)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** (utility classes + `style={}` props for brand colors)
- **No UI library** — all components custom-built
- **No axios** — native `fetch` API
- **Port:** 3000 (default)

## Running

```bash
npm run dev    # dev server → http://localhost:3000
npm run build  # production build
npm start      # serve production build
```

## Environment

`anylearn_v2/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/v2/api
```

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
| `Header` | `components/Header.tsx` | Sticky nav, auth state, cart count badge |
| `Footer` | `components/Footer.tsx` | Site footer |
| `AuthModal` | `components/AuthModal.tsx` | Global overlay login/register — triggered anywhere |
| `CourseCard` | `components/CourseCard.tsx` | Reusable course card grid item |
| `SearchCard` | `components/SearchCard.tsx` | Search bar widget (used on homepage + info) |
| `PromoSlider` | `components/PromoSlider.tsx` | Promo banner carousel |
| `ScrollRow` | `components/ScrollRow.tsx` | Horizontal scroll carousel |
| `BackButton` | `components/BackButton.tsx` | Back navigation |
| `FloatContact` | `components/FloatContact.tsx` | Fixed "Need help?" floating button |

## Auth System

- `src/context/AuthContext.tsx` — React Context provider
- User object stored in `localStorage` as key `anylearn_user`
- Exposes `user`, `login(user)`, `logout()`, `cartCount`, `refreshCartCount()`
- `AuthModal` can be opened globally; auto-redirects after login
- Auth pages (`/login`, `/register`) also work standalone

## API Client — `src/lib/api.ts`

Base URL: `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'`

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

## Brand Colors
- Blue: `#00539b`
- Green: `#00a651`
- Red/accent: `#e73348`

## Utility

```typescript
getCourseUrl(item)  // Generates /class/:id/:slug with Vietnamese diacritic stripping
```

## Patterns

- Server Components fetch on the server for SEO (homepage, PDP, info)
- Client Components handle interactivity (search filters, cart, auth forms)
- Protected pages check `AuthContext` and trigger `AuthModal` if not logged in (don't redirect)
- No global state library — AuthContext + local useState is sufficient
- ISR revalidation: 60 seconds for public data
