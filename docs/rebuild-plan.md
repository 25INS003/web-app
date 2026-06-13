# Web-app ground-up rebuild — Nedyway commerce web app

> Status: **active rebuild** on branch `rebuild/typescript-overhaul`.
> This document is the source of truth for the overhaul. Phases are tracked below.

> **Scope (per superproject `docs/SRS.md`, Addendum A.1):** this web app serves
> **three audiences** behind one Next.js app, separated by role-based routing + RBAC:
> 1. **Customer storefront** (the "front") — browse/search catalog, product + reviews,
>    cart, checkout, order tracking/history, account. First-class alongside the mobile apps.
> 2. **Shop-owner dashboard** — shops, products/variants/inventory, orders, analytics.
> 3. **Admin** — shops, shop-owners, categories, promotions, system-wide orders, analytics, users.
>
> Login routes by `user_type`: customer → storefront/account, shop_owner → `/dashboard`,
> admin → `/admin`. The same `/api/v1` backend serves web + mobile customers (no fork).
> Checkout is **COD-first** — the payment gateway is a later enhancement (SRS §4.3).

## Context

The previous `web-app` (Next.js 16, App Router, JS) is treated as a **scratch pad**.
Analysis surfaced foundational problems: insecure auth (tokens in localStorage +
non-httpOnly cookies, **forgeable** `userRole`/`approvalStatus` cookies), client-only
route protection, ~13 Zustand stores each hand-rolling axios calls (no
caching/dedupe), a half-stub endpoints file, no tests, no error boundaries, weak
accessibility, and unfinished features (product variants, working search,
soft-delete filtering/restore, order detail pages).

The backend (separate submodule) is solid and its contract is documented. It
**already issues httpOnly `accessToken`/`refreshToken` cookies**, and the app runs
behind an **nginx reverse proxy** (frontend + `/api` same-origin) — so the secure
path is to rely on first-party httpOnly cookies and never touch tokens in JS.

**Goal:** a from-scratch, TypeScript, production-grade rebuild with a fresh
distinctive design and rethought UX — same feature set, done right, plus the
unfinished features completed.

### Locked decisions
- **Scope:** ground-up rebuild · **UI:** fresh distinctive redesign · **Language:**
  TypeScript · **UX:** rethink flows.
- **Auth:** httpOnly cookies (`withCredentials`), no tokens in JS. Edge redirects via
  `proxy.ts` (cookie *presence*) + **server-side `/auth/me`** for real role/approval
  gating (non-forgeable).
- **Data layer:** **Hybrid** — Server Components fetch initial page data + gate auth;
  **TanStack Query** owns interactive/realtime client state. Zustand only for UI state.
- **Strategy:** in-place incremental — new `src/` structure inside this repo, cut over
  route-group by route-group; old code stays as reference until each area is replaced.

> ⚠️ Next.js 16 renamed the edge-middleware convention to **`proxy.ts`** (not
> `middleware.ts`) — the rebuild uses `proxy.ts`.

## Target architecture

**Stack:** Next 16 (App Router, Turbopack) + **TypeScript**; Tailwind v4 (keep OKLCH
token system, new brand palette) + shadcn/ui (new-york, ported to TS); **TanStack
Query v5**; Server Components + Server Actions; typed axios client (`withCredentials`);
**zod** (schemas → `z.infer` types) + react-hook-form; socket.io-client; next-themes;
framer-motion; recharts; leaflet. Testing: **Vitest + React Testing Library** (units)
and **Playwright** (critical e2e).

### Folder structure (`web-app/src/`)
```
app/                      # thin route files that compose features
  (storefront)/            # customer-facing: /, /search, /c/[category], /p/[product], /cart,
                           #   /checkout, /account, /orders, /track/[order] (mostly public; cart/checkout/account gated)
  (auth)/ (shop)/ (admin)/ # auth flows · shop-owner panel (/dashboard...) · admin (/admin...)
  layout.tsx · providers.tsx     (proxy.ts lives at repo root)
lib/
  api/ client.ts          # axios: withCredentials, envelope-unwrap, 401->refresh->retry queue
      schemas/*.ts         # zod per domain (auth, shop, product, variant, order, category, analytics, notification)
      types.ts             # z.infer types + ApiResponse<T> envelope
  auth/ session.server.ts  # getSession(): server-side /auth/me with forwarded cookies
        guards.ts          # requireRole / requireApproval (server)
  query/ queryClient.ts · keys.ts   # query-key factory
  realtime/ socket.ts      # socket -> query invalidation
features/<domain>/         # storefront: catalog, search, product, cart, checkout, account,
                           #   customer-orders, reviews, addresses, wishlist
                           # auth, onboarding · shop: dashboard, shops, products, orders
                           # admin: admin-shops, admin-owners, admin-categories, analytics, promotions, users
                           # cross-cutting: notifications, support, settings
components/ ui/ (shadcn+custom) · shell/ (storefront-shell: header+search+cart+account;
            dashboard-shell: sidebar+topbar for shop/admin) · common/ (data-table, product-card,
            empty-state, error-boundary, page-header, stat-card)
hooks/ · styles/globals.css
```

### Auth/session flow (httpOnly, non-forgeable)
- **Login:** POST `/auth/login` with `withCredentials` -> backend sets httpOnly cookies.
  Read response only for user/role to choose redirect; **store no tokens**.
- **Every request:** `withCredentials` sends the httpOnly `accessToken` cookie; no `Authorization` header.
- **401:** client interceptor calls `/auth/refresh-token` (refresh cookie sent), backend rotates cookies, retry; concurrent 401s queued.
- **Server gating:** `getSession()` reads `cookies()` and calls `/auth/me` -> `{ user, shop_owner_status }`. Layouts redirect on wrong role / unapproved owner. Source of truth.
- **`proxy.ts`:** cheap presence redirect; may use backend's `userRole`/`approvalStatus` cookies as UX hints only.

### Hybrid data flow per page
Server Component calls `getSession()` + prefetches initial data (server axios) ->
`HydrationBoundary`; client components use `useQuery`/`useMutation` for pagination,
optimistic updates, and socket-driven invalidation (`new-order` -> invalidate
orders/dashboard queries).

## Salvage vs replace
- **Keep/port to TS:** OKLCH Tailwind-v4 tokens (re-palette), shadcn/ui components,
  `floating-label-input`, `animated-icons`, `count-up`, `theme-toggle`, `MapPicker`
  (leaflet), next-themes + framer-motion setup, recharts dashboard patterns, the API
  contract -> zod schemas.
- **Replace:** the 13 data-fetching stores -> TanStack Query + server fetch; insecure
  auth -> httpOnly + server gating; scattered API calls -> typed client; client-only
  guards -> server gating + `proxy.ts`; JS -> TS.

## Rethought UX (highlights)
- **Storefront:** fast, mobile-first commerce — instant search/filter, rich product pages with
  variants + reviews, a frictionless cart and **single-page COD checkout** (address book + slots),
  live order tracking. Browsing is public; only cart/checkout/account require login.
- **Onboarding:** multi-step wizard (business -> address -> bank -> documents -> review)
  with progress + save-draft, replacing the single mega-form.
- **Products:** unified product **+ variants** editor (variants first-class), inline
  inventory, soft-delete with filter + restore, working search.
- **Orders:** realtime status board + detail drawer, bulk accept/ready, validated
  forward-only transitions.
- **Admin:** approval **queue** with side-by-side document review (approve/reject/revoke).
- A11y throughout: keyboard nav, ARIA, focus management, contrast.

## Phased delivery (each phase independently reviewable/shippable)

- **Phase 0 — Foundation:** TS/tsconfig/lint, brand design system (storefront + dashboard),
  typed API client + zod schemas + envelope, auth/session layer (`getSession`, `proxy.ts`),
  TanStack Query provider + key factory + hydration, both app shells, providers/theme/toaster,
  error/loading boundaries, test scaffolding.
- **Phase 1 — Auth (all roles) + role routing — DONE (core):** email/password login,
  register (+auto-login, customer/seller), password reset (email→OTP→new password),
  logout; role-based redirect + approval gating; both shells; (auth) group fully on TS.
  **Deferred (backend-blocked):** phone-OTP login and social login — the backend's
  social routes are commented out and OTP exists only for password reset. Onboarding
  *wizard* + tests roll into later phases.
- **Phase 2 — Customer storefront (WC-1…WC-5):** home/landing, catalog browse, search +
  filter/sort, category pages, product detail + reviews, cart, **COD checkout** (address select/save,
  payment method), order placement, order tracking (realtime) + history + reorder, account/addresses,
  wishlist, support entry. Mobile-first. *(This is the "front".)*
- **Phase 3 — Shop-owner panel:** dashboard (stats/charts), My Shops (CRUD + map), Products +
  Variants + Inventory, Orders (realtime board + detail + transitions + bulk).
- **Phase 4 — Admin panel:** shops mgmt, shop-owners approval queue + doc review, categories
  (nested), promotions/coupons, system-wide orders (cancel/refund), analytics/reports, users,
  system health.
- **Phase 5 — Cross-cutting & polish:** notifications (realtime), support/tickets, settings +
  theme, profiles; a11y (WCAG), empty/error/loading states, perf (target: 95% < 500ms / 1000
  concurrent per SRS §5), e2e for critical paths across all three audiences, remove old code.

> Sequencing note: storefront (Phase 2) is prioritized as the primary public surface; it and
> the panels share the Phase 0/1 foundation. Payment gateway is out of scope now (COD-first).

## Verification
- **Per phase:** `tsc --noEmit`, ESLint/Prettier, `vitest run`.
- **Live smoke test:** run the dev app against the running backend (Mongo+Redis, seed
  data present) via `docker compose -f docker-compose.dev.yml` or `next dev`.
- **E2E (Playwright):** customer happy path (browse -> add to cart -> COD checkout -> track
  order), auth flow, shop-owner happy path (onboard -> add product+variant -> realtime order ->
  advance status), admin approval.

## Backend API contract (reference)

The dashboard consumes these (all under `/api/v1`, ApiResponse envelope
`{ success, message, data, metadata, timestamp }`):
- **Auth:** `POST /auth/{login,register,refresh-token,logout}`, `GET /auth/me`,
  `POST /auth/password/{forgot,verify-otp,resend-otp,reset,set,change}`. Login/refresh
  set httpOnly `accessToken`/`refreshToken` + non-httpOnly `sessionId`/`userRole`/`approvalStatus`.
- **Shop-owner:** `POST /shop-owners/onboarding` (multipart), `GET /shop-owners/status`,
  `GET /shop-owners/shops/my-shops`, `POST /shop-owners/create/shops`,
  `PUT /shop-owners/shops/:id`, `GET /shop-owners/shops/:id/analytics`,
  `GET /shop-owners/dashboard-stats`, soft/hard delete + activate.
- **Products/variants/inventory (shop-scoped under `/shops/:shopId/...` and `/variants/...`):**
  list/create/update/status/delete products; variant CRUD + images; `PUT .../stock`,
  `GET .../inventory/{low-stock,logs}`.
- **Categories:** `GET /admin/category/categories` (public read) + admin CRUD (multipart).
- **Orders (shop-owner):** `GET /shops/:shopId/orders[/stats|/:orderId]`,
  `PUT /shops/:shopId/orders/{accept,ready,status,cancel}` (forward-only transitions).
- **Admin:** `/admin/shops*`, `/admin/shop-owners*` (approve/reject/revoke/verify),
  `/analytics/{overview,sales,users,orders}`, `/admin/system/{health,backup,logs}`.
- **Notifications:** `/notifications/{get,count,preferences,read-all}`, `:id/read`.
- **Realtime (Socket.IO):** client emits `join-shop <shopId>` / `join-room <room>`;
  server emits `new-order` to rooms `<shopId>` and `admin` with
  `{ orderId, amount, shopName, customerName, shopId }`.

## Notes
- Brand colors/logo proposed in Phase 0 for sign-off before building screens.
- `web-app` is a git submodule; rebuild lives on `rebuild/typescript-overhaul`, committed per phase.
