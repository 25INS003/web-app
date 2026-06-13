# Web-app ground-up rebuild — Nedyway admin + shop-owner dashboard

> Status: **active rebuild** on branch `rebuild/typescript-overhaul`.
> This document is the source of truth for the overhaul. Phases are tracked below.

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
  (auth)/ (admin)/ (shop)/   # (page) -> (shop) for clarity (route groups don't affect URLs)
  layout.tsx · providers.tsx     (proxy.ts lives at repo root)
lib/
  api/ client.ts          # axios: withCredentials, envelope-unwrap, 401->refresh->retry queue
      schemas/*.ts         # zod per domain (auth, shop, product, variant, order, category, analytics, notification)
      types.ts             # z.infer types + ApiResponse<T> envelope
  auth/ session.server.ts  # getSession(): server-side /auth/me with forwarded cookies
        guards.ts          # requireRole / requireApproval (server)
  query/ queryClient.ts · keys.ts   # query-key factory
  realtime/ socket.ts      # socket -> query invalidation
features/<domain>/         # auth, onboarding, dashboard, shops, products, orders,
                           # admin-shops, admin-owners, admin-categories, analytics, notifications, settings
components/ ui/ (shadcn+custom) · shell/ (sidebar, header, app-shell) · common/ (data-table, empty-state, error-boundary, page-header, stat-card)
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
- **Onboarding:** multi-step wizard (business -> address -> bank -> documents -> review)
  with progress + save-draft, replacing the single mega-form.
- **Products:** unified product **+ variants** editor (variants first-class), inline
  inventory, soft-delete with filter + restore, working search.
- **Orders:** realtime status board + detail drawer, bulk accept/ready, validated
  forward-only transitions.
- **Admin:** approval **queue** with side-by-side document review (approve/reject/revoke).
- A11y throughout: keyboard nav, ARIA, focus management, contrast.

## Phased delivery (each phase independently reviewable/shippable)

- **Phase 0 — Foundation:** TS/tsconfig/lint, brand design system, typed API client +
  zod schemas + envelope, auth/session layer (`getSession`, `proxy.ts`, login action),
  TanStack Query provider + key factory + hydration, redesigned app shell (shop + admin),
  providers/theme/toaster, error/loading boundaries, test scaffolding.
- **Phase 1 — Auth + onboarding slice:** login, register, forgot/verify-otp/reset,
  logout; onboarding wizard; approval status + gating; tests.
- **Phase 2 — Shop-owner core:** dashboard, My Shops (CRUD + map), Products + Variants +
  Inventory, Orders (realtime + detail + transitions + bulk).
- **Phase 3 — Admin:** shops mgmt, shop-owners approval queue + doc review, categories
  (nested), analytics/reports, system health.
- **Phase 4 — Cross-cutting & polish:** notifications (realtime), settings + theme,
  profile; a11y, empty/error/loading states, perf, e2e, remove old code.

## Verification
- **Per phase:** `tsc --noEmit`, ESLint/Prettier, `vitest run`.
- **Live smoke test:** run the dev app against the running backend (Mongo+Redis, seed
  data present) via `docker compose -f docker-compose.dev.yml` or `next dev`.
- **E2E (Playwright):** auth flow, shop-owner happy path (onboard -> add product+variant
  -> realtime order -> advance status), admin approval.

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
