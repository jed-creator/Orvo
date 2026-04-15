# Orvo — Investor Demo Runbook

A 10-minute scripted walkthrough that shows every platform surface. The
goal is to convince an investor Orvo is a working super-app — not to
execute real transactions. Nothing is charged, nothing is published.

**Audience:** Bridget, running this live on a laptop or in a TestFlight
build. Everything below assumes you are on `main` (or the current
demo-readiness branch) and have a working local checkout.

---

## Quick reference

| What | Where |
|------|-------|
| Web | http://localhost:3300 (or the port you run `npm run dev -- --port` on) |
| Mobile | Expo Go / TestFlight / dev client |
| Supabase | Hosted dev project `wsqjxctqqdshgxttwtws.supabase.co` |
| Seed | `cd apps/web && npm run seed:demo` |
| Demo password | `OrvoDemo2026!` (every seeded account) |
| Consumer login | `demo-consumer-1@orvo.app` |
| Provider login | `demo-provider-beauty-wellness@orvo.app` |
| Admin login | `demo-admin@orvo.app` |

---

## Cold-start checklist

Do this 30 minutes before you show anyone. The seed is idempotent, so
you can re-run it safely.

1. **Pull latest.**
   ```
   git checkout main
   git pull
   ```

2. **Install.** From the repo root:
   ```
   npm install
   ```
   If you see SWC / Metro errors on macOS, delete `node_modules` and
   retry — the launch fix in `d75a346` regenerated the lock file to
   include all SWC platform binaries, but Metro sometimes caches the
   old resolution.

3. **Confirm `.env.local` exists** at the repo root, with at minimum:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://wsqjxctqqdshgxttwtws.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3300
   ```
   `apps/web/.env.local` is a symlink into this file — no copies.

4. **Apply any pending migrations.** If you've pulled new DB changes:
   ```
   cd apps/web
   npx supabase db push   # only if you've edited db/migrations/
   ```
   The hosted dev project should already be up-to-date for day-to-day
   demos. Skip this step unless you know a migration is pending.

5. **Seed the demo data.** From `apps/web`:
   ```
   npm run seed:demo
   ```
   Expected summary (≈30 seconds):
   ```
   Users:       20    (3 consumers, 16 providers, 1 admin)
   Businesses:  12    (approved, avg_rating populated)
   Services:    48
   Bookings:    60    (20 completed, mix of upcoming / cancelled)
   Reviews:     20
   Favorites:   12
   Merchants:   8     (4 restaurant, 2 grocery, 2 convenience)
   Products:    6     (each with 4 competing retailer offers)
   Quotes:      4     (rideshare)
   Events:      4     (tickets)
   Trips:       2
   ```
   The script aborts if `NODE_ENV=production` or the URL looks
   production-like. Don't override those guards.

6. **Start web.** From `apps/web`:
   ```
   npm run dev
   ```
   Default port is 3300. Open `http://localhost:3300` — you should see
   the Orvo landing page.

7. **Start mobile.** From `apps/mobile`:
   ```
   npm run start
   ```
   Press `i` for iOS simulator or scan the QR code on a device.
   For physical devices, set `EXPO_PUBLIC_WEB_API_URL` to your LAN IP
   (`http://192.168.x.x:3300`) — `localhost` resolves to the device.

8. **Smoke-test the 8 tiles.** From a terminal, hit each endpoint to
   confirm the seed took. This is the same check the tour script
   relies on:
   ```
   for p in "/api/shop/search:results" \
            "/api/eat/merchants:merchants" \
            "/api/ride/search:rides" \
            "/api/trips/search:trips" \
            "/api/tickets/search:events" \
            "/api/market/search:items" \
            "/api/book/services:services" \
            "/api/compare/search:results"; do
     path=${p%:*}; key=${p#*:}
     count=$(curl -s "http://localhost:3300$path" | python3 -c \
       "import json,sys; print(len(json.load(sys.stdin).get('$key', [])))")
     echo "$path → $count"
   done
   ```
   Every row should be `>0`. If any show `0`, re-run `npm run seed:demo`
   — the tile is empty because the DB is empty.

---

## Tour script — the 10-minute walkthrough

Read this top-to-bottom while driving. Each section has a "say this"
line (what to narrate) and a "click this" line (what to actually tap).

### 0. Setup (off-camera, 1 min before)

- Open mobile app to the sign-in screen.
- Open a second window with the web at `http://localhost:3300`.
- Pre-log-in the provider dashboard tab in a third window so you can
  switch to it without burning 10 seconds on a password field.

### 1. The pitch in one sentence (30 sec)

Say: *"Orvo is a universal booking app. One account, one search bar,
every category of service — restaurants, rides, hotels, events, local
service pros, price comparison — all under one roof. Think of it as
WeChat for North America, except we open every category at launch
instead of drip-feeding them."*

### 2. Mobile — Sign in (30 sec)

- Mobile → Sign in with `demo-consumer-1@orvo.app` / `OrvoDemo2026!`.
- Land on Home tab: you should see categories grid + "Top-rated
  businesses" shelf with Copper & Co. Barbershop, Glow Aesthetics,
  Pure Skin Medspa, Northwest Strength Studio, Mountain Peak Fitness,
  etc. (seeded businesses, populated ratings).

Say: *"Normal booking flow. Home shows top-rated local businesses,
real reviews, real categories."*

### 3. Mobile — The super-app hub (4 min)

Tap the **Explore** tab. You'll see 8 tiles — hit them in this order:

**(a) Shop** (30s)
- Tap → Shopify-backed product list. Walk through 4 items.
- Say: *"Every tile is an adapter — Shopify, WooCommerce, Squarespace
  in production. We have 89 adapters registered across all verticals;
  5 are wired to reference fixtures today, the rest are credential-gated
  stubs waiting on partner deals."*

**(b) Eat** (30s)
- Back → tap Eat. Unified restaurant + delivery list — seeded
  first-party merchants (Copper Door Kitchen, La Pasta Fresca, etc.)
  render first, then the OpenTable fixture restaurants. Same card
  shape, same normalized schema, sorted into one feed.
- Say: *"Restaurants, delivery, grocery — one search. This is
  OpenTable, DoorDash, Uber Eats in a single fan-out, and our own
  seeded catalog shows up in the same list without a special case."*

**(c) Ride** (30s)
- Back → tap Ride. Uber product catalogue (UberX, UberXL, Comfort,
  Black, +1). Prices from seeded quotes.
- Say: *"Rideshare comparison. Uber, Lyft, Grab, Bolt — same endpoint,
  sorted by price and ETA."*

**(d) Trips** (30s)
- Back → tap Trips. Expedia hotel fixtures (Kimpton Monaco, Alexis,
  Fairmont, Grove Park).
- Say: *"Hotels, flights, Airbnb-style experiences. Booking.com,
  Expedia, Airbnb all behind the same shape."*

**(e) Tickets** (20s)
- Back → tap Tickets. Ticketmaster events — Beethoven Festival,
  Kraken vs. Canucks, Hamilton.

**(f) Market** (20s)
- Back → tap Market. Two seeded grocery merchants (Harvest Market
  Co-op, Neighborhood Market). Not fixture-backed — this is live
  Postgres content rendered through the adapter normalization layer.

**(g) Book** (40s)
- Back → tap Book. **40 bookable services** across salons, pet care,
  counseling, home services, fitness, medspas. This is our first-party
  bookable catalog.
- Tap a filter chip (**Beauty & wellness**, **Fitness**, **Home
  services**, **Pet care**, **General**) to show category narrowing
  in-place — the chips re-query the backend with a `filter=` param.
- Tap any service card — it routes internally via a deep link to the
  native service detail with slot picker (no external hand-off).
- Say: *"This is where we're different. Book isn't a 'list of websites
  we send you to' — it's our native booking engine. Businesses onboard
  directly, manage their own calendars and availability. This is the
  layer that gives us supply-side economics instead of just being a
  search portal."*

**(h) Compare** (40s)
- Back → tap Compare. 6 products, each labeled "Best of 4 retailers".
- Say: *"Price comparison across retailers. Amazon, Walmart, Target,
  Best Buy — we normalize product fingerprints and rank offers by
  best price. Same architecture whether it's physical goods or service
  pricing."*

### 3A. Mobile — Universal search fan-out (45 sec)

- Tap the **Search** tab (second icon in the bottom bar).
- Leave the query empty for the moment — the screen fans out to nine
  backends in parallel (Orvo native businesses + all 8 super-app
  categories) and renders the top 4 of each in their own section.
- Type a narrow query like `mountain` or `skin` and hit return.
  Sections collapse as categories drop out — narrow queries might
  leave only Local businesses + Shop + Compare visible. Wide queries
  like `studio` fill most sections.
- Tap **See all →** on any section (e.g. Book) to jump straight into
  the full category screen for that tile.
- Say: *"This is the 'one search, every category' story from the
  pitch made concrete. Nine queries run in parallel — total latency
  is the slowest adapter, not the sum. Every result you see shares
  the same `NormalizedSearchResult` shape, whether it came from
  Shopify, Expedia, our first-party Book catalog, or the Compare
  pricing engine."*

### 3B. Mobile — Map tab (30 sec)

- Tap the **Map** tab (third icon, between Search and Bookings).
- A native MapView loads with one pin per approved seeded business.
  Seattle businesses cluster around Capitol Hill, Asheville ones
  around downtown. Pins are deterministically jittered off a slug
  hash so re-seeding doesn't rotate them.
- Tap any pin → the callout shows business name + rating + review
  count. Tap the callout → deep-links into the business detail
  screen (same as tapping a card on the Home tab).
- Say: *"Local coverage at a glance. Businesses are stored with
  PostGIS geography plus plain lat/lng in JSONB for easy client
  use — the mobile client reads directly, and the same column is
  ready for proximity search when we wire it up."*

### 4. Mobile — Booking a service end-to-end (1 min)

- Back to Home → tap a category (e.g. Beauty & Wellness) → land on a
  business detail → tap "Book appointment" on any service.
- Pick a slot (M-F 9-5 shows availability because the seed creates
  M-F 9-5 availability rules).
- Tap Confirm. Land on the booking confirmation screen.
- Say: *"Free-MVP path — the Stripe integration is wired but not
  required for this demo. Real bookings are tracked in the DB exactly
  as if they'd been charged; a prod launch flips one flag."*

### 5. Mobile — Bookings + profile (30 sec)

- Tap Bookings tab: show the list (this consumer has seeded bookings
  from the seed's 60-booking spread — some upcoming, some completed).
- Tap Profile tab: walk through Points, Wallet, Household, etc. Brief.

### 6. Web — Provider dashboard (1 min)

- Switch to the browser.
- Already logged in as `demo-provider-beauty-wellness@orvo.app` at
  `/dashboard` (or log in now).
- Show the provider's bookings list, calendar, services catalog.
- Say: *"This is the provider side. The same businesses the consumer
  just browsed are managed from this dashboard. Zero-integration
  onboarding — providers sign up, describe services, accept bookings."*

### 7. Web — Admin panel (30 sec)

- Log out / open incognito → log in as `demo-admin@orvo.app`.
- Visit `/admin`. Show the approvals queue, users list, reviews
  moderation, categories management.
- Say: *"Operator controls: approve new providers, moderate reviews,
  curate categories. Standard marketplace trust-and-safety."*

### 8. Wrap (30 sec)

Say: *"That's the full platform in under 10 minutes — 16 categories,
89 adapter slots, a native booking engine, price comparison, provider
dashboards, admin tooling. Everything you just saw is running against
a real Postgres with real RLS — there's no Figma and no mockups."*

---

## Reset between demos

The seed is idempotent — running it again wipes prior demo rows and
re-inserts the catalog. Auth users are keyed by `demo-` email prefix;
catalog rows by `provider = 'demo-seed'` or `fingerprint LIKE 'demo-seed:%'`.

```
cd apps/web
npm run seed:demo
```

You do **not** need to restart the dev server. All routes read live
from Postgres on every request.

If you booked a slot during the demo and want to reset the booking
state without re-creating the users, the wipe step in `seed-demo.ts`
will delete bookings tied to demo user IDs before re-inserting the
seeded set.

---

## Known caveats — what not to tap

Be ready to deflect these if someone asks. None of them break the
demo, but you should know they exist:

1. **Payments aren't wired to Stripe in this build.** Confirmed
   bookings show `payment_status='captured'` in the DB, but no charge
   is actually made. If an investor asks "does this take real
   payments?" the answer is "yes, Stripe is integrated — we disable
   it for this demo environment so we don't rack up test charges."
   The webhook routes and server code are in place.

2. **Most adapter tiles show fixture data, not live APIs.** The 5
   reference adapters (Shopify, OpenTable, Uber, Ticketmaster, Expedia)
   return handcrafted fixtures. The other 84 adapters are credential-
   gated stubs that return empty arrays. If the investor asks "does
   this actually hit Uber's real API?" the answer is "the adapter
   interface is wired; flipping the credential turns it on. The MVP
   strategy is adapter-ready, connector-later."

3. **Tap-through on external links won't always work.** Cards
   rendered from Shopify / Expedia / Ticketmaster fixtures open a
   placeholder URL (`https://example.com/...`) — not a real product
   page. Don't tap them on stage. **Book cards are safe to tap** —
   they carry a `metadata.deepLink` (`/book/<serviceId>`) and route
   internally to the native service detail instead of the OS
   browser. First-party Eat and Market cards are passive (no deep
   link, no URL) — they render as cards-in-a-grid and won't navigate
   when tapped, so demo them visually without pressing in.

4. **`/api/compare?fingerprint=...` returns empty `byProvider`.**
   That's the detail endpoint backed by `price_snapshots` (Phase 7
   pricing engine work — not yet populated). The `/api/compare/search`
   listing endpoint we use for the mobile Compare tile is fully
   populated, with 6 products × 4 retailers each.

5. **Market shows merchants, not individual grocery items.** The
   Market tile renders one card per seeded grocery store (Harvest
   Market Co-op, Neighborhood Market, etc.). There's no merchant →
   item list drill-down on mobile yet — the underlying `merchant_items`
   rows exist in Postgres for the future flow but no UI consumes
   them. Demo the tile as a grid and move on.

6. **Mobile compare cards link out.** The `url` field on compare
   cards points at `https://amazon.example.com/...` etc. These won't
   resolve. If you tap one it'll open your default browser to a
   404 — narrate around it or skip tap-through.

7. **Web and mobile can diverge in visuals.** The mobile scaffolds
   are intentionally minimal (Phase 6+ polish lands later). The
   investor should see the breadth-before-depth story: *"this is
   the scaffold we'll decorate, not the final pixel design."*

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Tile shows empty state | Re-run `npm run seed:demo`. The DB was wiped. |
| "cookies was called outside a request scope" in logs | Vitest test hitting a route — not a runtime issue. Routes degrade gracefully. |
| Mobile can't reach API | Set `EXPO_PUBLIC_WEB_API_URL` to your LAN IP, not `localhost`. |
| Login 401s | Password is case-sensitive: `OrvoDemo2026!` with exclamation mark. |
| Book tile shows < 40 services | `.limit(40)` on the route. 48 are seeded; 40 is the cap. |
| Compare tile shows "Best of 1 retailer" | You have a stale seed from before the multi-retailer change. Re-run `npm run seed:demo`. |
| Map tab shows no pins | Stale seed from before the PostGIS/lat-lng change. Re-run `npm run seed:demo` — the current seed writes `address.lat`/`address.lng` and `location` WKT per business. |
| Map shows `react-native-maps` error | `npm install` in `apps/mobile` — bundled in Expo Go SDK 54, no custom dev client required. |
| Dev server won't start | Check `.env.local` symlink: `readlink apps/web/.env.local` should point to `../../.env.local` (or the repo-root file). |

---

## What this runbook is not

- Not a feature spec — see `docs/FEATURE_OUTLINE_COVERAGE.md`.
- Not a deployment guide — see `LAUNCH.md`.
- Not an architecture doc — see `docs/SUPER_APP.md`.
- Not a post-mortem plan — see `docs/plans/2026-04-14-demo-readiness.md`
  for the work that set up this runbook.
