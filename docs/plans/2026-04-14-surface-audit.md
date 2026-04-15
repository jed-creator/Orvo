# Surface Audit — Phase D3 Batch 4

**Date:** 2026-04-14
**Branch:** `feat/demo-readiness`
**Scope:** Walk every super-app category entry point on mobile and verify it
renders meaningful content for the investor demo tour.

## Inventory of surfaces touched by the demo tour

| Surface | File | Data source |
|---|---|---|
| Mobile Home → Categories | `apps/mobile/app/(tabs)/index.tsx` | Supabase `categories` + `businesses` direct query |
| Mobile Explore (super-app hub) | `apps/mobile/app/(tabs)/explore.tsx` → `ExploreGrid` | `SUPER_APP_CONFIG` static config |
| Mobile super-app category screens | `apps/mobile/app/(super-app)/{shop,eat,ride,trips,tickets,market,book,compare}.tsx` | `searchCategory(key, q)` → web REST |
| Mobile search tab | `apps/mobile/app/(tabs)/search.tsx` | Supabase `businesses` direct query |
| Mobile booking flow | `apps/mobile/app/book/[serviceId].tsx` → `/booking/[id]/confirmation` | Supabase `services`/`bookings` direct query |
| Business dashboard | `apps/web/app/(dashboard)/...` | Supabase directly |
| Admin panel | `apps/web/app/admin/...` | Supabase directly |

The Supabase-direct surfaces (home, search, booking flow, dashboards) are
already populated from the Batch 2 seed script — 32 businesses, ~128
services, ~60 bookings, 20 reviews spread across 6 MVP categories. Those
surfaces are NOT the risk area.

The risk area is the **8 super-app category screens** on mobile. Each calls a
per-category REST endpoint through `apps/mobile/lib/super-app-api.ts`, and the
current `ENDPOINTS` map does not match reality.

## Mobile ENDPOINTS vs actual web routes

| Super-app key | Mobile expects (path / resultKey) | Web actual (path / key) | Status |
|---|---|---|---|
| shop | `/api/shop/search` / `products` | `/api/shop/search` / `results` | ❌ key mismatch |
| eat | `/api/eat/search` / `results` | `/api/eat/merchants` / `merchants` | ❌ path + key mismatch |
| ride | `/api/ride/search` / `rides` | `/api/ride/quote` (POST only) | ❌ route missing |
| trips | `/api/trips/search` / `trips` | `/api/trips` / `trips` (STUB — empty) | ❌ path mismatch + stub |
| tickets | `/api/tickets/search` / `tickets` | `/api/tickets/search` / `events` | ❌ key mismatch |
| market | `/api/market/search` / `items` | `/api/market/listings` / `listings` | ❌ path + key mismatch (and listings is P2P marketplace not grocery) |
| book | `/api/book/services` / `services` | `/api/book/services` / `services` | ✅ matches, but returns `[]` because all 7 booking adapter categories are stubs |
| compare | `/api/compare` / `results` | `/api/compare` / `comparison` (needs `fingerprint` param) | ⚠️ requires fingerprint, not text — not tourable |

## Which routes actually return data today?

Reference adapters with working fixtures:
- **ecommerce/shopify** → 4 products. Powers `/api/shop/search`. ✅
- **restaurants/opentable** → fixtures exist. Powers `/api/eat/merchants`. ✅
- **rideshare/uber** → fixtures exist. `searchRideshare()` in `ride.service.ts`
  exists and would return data IF exposed as a GET route. ⚠️
- **tickets/ticketmaster** → fixtures exist. Powers `/api/tickets/search`. ✅
- **travel/expedia** → fixtures exist. `searchTravel()` in
  `trip-planner.service.ts` exists and would return data IF exposed as a GET
  route. The current `/api/trips` route returns `listStubTrips()` = `[]`. ⚠️

Categories with NO reference adapter and only stubs:
- **grocery** (6 stubs) — affects `market` tile
- **delivery** (7 stubs) — doesn't affect super-app tour directly (covered by
  eat's restaurants reference adapter)
- **beauty-wellness** (7 stubs), **medspa** (3), **fitness** (2),
  **general-booking** (9), **shopify-booking** (6), **home-services** (4),
  **pet-care** (2) — these 43 stubs collectively starve the `/book` route
- **experiences** (6), **hotel-direct** (4) — don't show empty because
  travel/expedia covers /trips

## Plan to fix

### Mobile side — one file, eight lines of change
- `apps/mobile/lib/super-app-api.ts` — rewrite `ENDPOINTS` map to match real
  web paths/keys. For routes that don't exist yet, keep the mobile expectation
  (`/api/<cat>/search`) and CREATE those routes on the web side.
- `apps/mobile/lib/super-app-types.ts` — add `merchants` and `events` to
  `ApiSearchResponse` union so the new result keys typecheck.

### Web side — three new routes, one route edit

**New: `apps/web/app/api/ride/search/route.ts`**
- `GET ?q=<text>` → `{ rides: NormalizedSearchResult[] }`
- Wraps existing `searchRideshare(q)` from `ride.service.ts`. Uber fixtures
  carry the demo weight.

**New: `apps/web/app/api/trips/search/route.ts`**
- `GET ?q=<text>` → `{ trips: NormalizedSearchResult[] }`
- Wraps existing `searchTravel(q)` from `trip-planner.service.ts`. Expedia
  fixtures carry the demo weight.
- Leaves existing `/api/trips` (POST + GET list of stub Trips) alone — that
  route is about the "trip planner" persistence feature, not search.

**New: `apps/web/app/api/market/search/route.ts`**
- `GET ?q=<text>` → `{ items: NormalizedSearchResult[] }`
- No grocery adapter has fixtures. Query the seeded `delivery_merchants`
  table WHERE `category = 'grocery'` (seeded in Batch 2) and map rows to
  `NormalizedSearchResult`. This reuses the super-app seed content we already
  populated.

**Edit: `apps/web/app/api/book/services/route.ts`**
- All 7 booking adapter categories are stubs → current route returns `[]`.
- Keep the adapter fan-out as-is but ALSO query Supabase `services` joined
  with `businesses` (the Batch 2 seed) and concatenate. Result: the `/book`
  super-app tile shows real Orvo-native businesses from the seed.

### What is NOT in scope for Batch 4
- Fixing `/api/compare` to accept a text query. Compare is a
  fingerprint-driven comparison feature, not a search. The `compare` tile
  stays in the grid but we won't feature it in the tour script.
- Adding image URLs to shopify fixtures — mobile `ResultCard` doesn't render
  images today.
- Wiring every other super-app vertical (vouchers, loyalty, etc.) — only the
  8 Explore tiles matter for the demo.

## Acceptance criteria
- Tapping each of the 8 super-app tiles renders at least one visible result
  card (or accepts a no-results state intentionally, which is only the case
  for `compare`).
- Web typecheck + lint clean.
- Mobile typecheck + lint clean.
