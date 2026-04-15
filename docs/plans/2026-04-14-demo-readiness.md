# Orvo Demo Readiness Plan

**Date:** 2026-04-14
**Branch:** `feat/demo-readiness`
**Goal:** Turn the current MVP into a non-public, fully-functional demo that an
investor can click through end-to-end across all 16 super-app categories. The
demo does NOT need to take real money or complete real external bookings — but
every category must *visibly* have content, and every major flow must make it
to a confirmation screen without dead ends.

## Context — what we are and are not building

### In scope
- **Visible breadth.** All 16 super-app categories return content when searched
  or browsed. No empty states on the tour path.
- **Core MVP depth.** The consumer → book → confirm → review loop works
  end-to-end against real data in all three apps (consumer mobile, business
  dashboard, admin panel).
- **Honest affordances.** Where payment is bypassed, the UI says "Demo mode"
  rather than "real Stripe — coming in Phase 7+". Copy aligned with what the
  user will actually see.
- **A runbook.** `docs/DEMO.md` — cold-start instructions so Bridget can open
  the demo from a dead laptop and walk an investor through it in ~15 minutes.

### Out of scope (explicit user decisions — do NOT do these)
- **No real payment collection.** Payments remain deferred per free-MVP
  strategy. Stripe Connect onboarding stays wired (it already works) but
  PaymentIntent creation is NOT added. Bookings record `payment_status =
  'not_required'` and move straight to confirmed. See
  `project_orvo.md` memory for full context.
- **No adapter build-out to real APIs.** Adapters remain mock clients. We are
  not signing contracts with Ticketmaster, Uber, etc.
- **No production launch.** App Store / Play Store submission, marketing pages,
  and real Terms/Privacy content are all post-demo work.

## Audit findings — what we learned during investigation

1. **MVP core (Phases 1–10) is solid.** Bookings, payments table, reviews,
   admin panel, mobile app all exist and compile. Lint/typecheck clean on
   `feat/demo-readiness` baseline.

2. **Super-app adapters are mock clients.** 5 of 89 providers have full mock
   implementations with `fixtures.ts` + `client.ts` + `mapper.ts`:
   - `restaurants/opentable`
   - `rideshare/uber`
   - `tickets/ticketmaster`
   - `ecommerce/shopify`
   - `travel/expedia`

   The other 84 are stubs that return `[]` from `search()` and throw from
   `getDetails()`. They exist so `integration_providers` table has rows and
   the admin integration hub can list them as "connectable."

3. **Gap for the demo.** If a user searches for a category whose only
   providers are stubs, results come back empty. Categories with no reference
   adapter:
   - `beauty-wellness`, `delivery`, `experiences`, `fitness`,
     `general-booking`, `grocery`, `home-services`, `hotel-direct`, `medspa`,
     `pet-care`, `shopify-booking` — 11 categories.

4. **Mobile booking UX is demo-hostile.** `apps/mobile/app/book/[serviceId].tsx`:
   - Raw text inputs for date (YYYY-MM-DD) and time (HH:MM). Ugly and
     error-prone in front of an investor.
   - Disclaimer copy reads *"Payment will be collected at the time of service
     for MVP. Real Stripe payment sheet comes in Phase 7+ after native build"*
     — mentions internal phase numbers, undermines the demo narrative.

5. **No demo seed script exists.** `apps/web/tools/scripts/` contains only
   codegen tooling (bootstrap, stub-adapter). Categories are seeded via
   migration but businesses, services, consumers, and bookings are not.

## Strategy

The investor should see **depth in core MVP** and **breadth across categories**.
We get depth by seeding realistic Orvo-native businesses (no external
integration required — they live in `public.businesses`) and breadth by making
sure the universal search / category browse surface shows something for every
one of the 16 categories.

For category breadth, the cheapest path is to seed Orvo-native content for
*every* category — that way the demo doesn't depend on external adapter
fixtures existing. We still keep the 5 reference adapters wired because they
demonstrate the fan-out architecture story ("here's how we'd federate with
OpenTable when we're ready"), but they're a bonus layer on top of
first-party content, not the primary source of results.

**Key decision:** we will NOT add fixture files to the 84 stub adapters. That
would be ~2 days of fixture writing for visual coverage that seed data already
gives us for free. The stub adapters stay stubs.

## Phases

### Phase D1 — Core seed script (1 PR unit)

**Goal:** One idempotent script that populates the database with enough content
for the demo to feel alive across all 16 categories.

**File:** `apps/web/tools/scripts/seed-demo.ts`

**Invocation:** `npm run seed:demo` (add to `apps/web/package.json`).

**What it creates:**

| Entity | Count | Notes |
|---|---|---|
| Consumer auth users | 3 | `demo-consumer-1@orvo.app`, etc. Password-reset-ready so Bridget can log in live. |
| Provider auth users | 16 | One per category, owns the businesses in that category. |
| Admin auth user | 1 | `demo-admin@orvo.app` — role = `admin`. |
| Businesses | 32 | 2 per category × 16 categories. Each has name, description, address, photos, phone, website, stripe_account_id (fake), status = `approved`. |
| Services | ~128 | 4 services per business. Realistic names + prices per category (see fixture map below). |
| Staff | 32 | 1 staff member per business (sufficient for availability rules). |
| Availability rules | 32 | M–F 9–5 for each staff, via `availability_rules`. |
| Bookings | ~60 | Spread across consumers. Mix: 20 past-completed (with reviews), 25 upcoming-confirmed, 10 pending, 5 cancelled. |
| Reviews | 20 | Attached to past-completed bookings. 1–5 stars weighted toward 4–5. |
| Favorites | ~12 | Each demo consumer favorites 4 businesses. |

**Fixture content per category:** literal data embedded in the script. Example
shape (`beauty-wellness`):

```ts
const CATEGORY_FIXTURES = {
  'beauty-wellness': {
    businesses: [
      { name: 'The Rooted Salon', city: 'Seattle', ... },
      { name: 'Copper & Co. Barbershop', city: 'Asheville', ... },
    ],
    services: [
      { name: 'Women\'s Haircut', duration_min: 60, price_cents: 8500 },
      { name: 'Color & Highlights', duration_min: 120, price_cents: 18500 },
      { name: 'Beard Trim', duration_min: 30, price_cents: 3500 },
      { name: 'Full Color', duration_min: 90, price_cents: 12000 },
    ],
  },
  // ... 15 more
}
```

**Idempotency:** the script deletes any rows tagged with `metadata->>'seed' =
'demo'` before inserting, so re-running it is safe.

**Guards:**
- Only runs if `NEXT_PUBLIC_APP_URL` contains `localhost` OR `VERCEL_ENV !==
  'production'`. Aborts otherwise with a loud error.
- Uses `SUPABASE_SERVICE_ROLE_KEY` (required), not the anon key.
- Logs a summary at the end: "Seeded 32 businesses, 128 services, 60 bookings,
  20 reviews."

**Acceptance:**
- Running `npm run seed:demo` against a fresh Supabase project leaves the DB in
  a state where:
  - Web dashboard shows a populated business list.
  - Admin panel shows the 16 demo businesses awaiting approval (or already
    approved — TBD during implementation).
  - Mobile app search for any of the 16 categories returns at least 2 results.
  - At least one demo consumer has upcoming bookings visible on their profile.

---

### Phase D2 — Mobile booking UX polish

**Goal:** Make the consumer booking flow look like a real app, not a demo stub.

**Files:**
- `apps/mobile/app/book/[serviceId].tsx`
- `apps/mobile/app/booking/[id].tsx` (confirmation screen) — light review

**Changes:**

1. **Date/time picker.** Replace the two `TextInput`s with
   `@react-native-community/datetimepicker` (already in Expo SDK — no native
   build required). Default date = tomorrow, time = next available 30-min slot.

2. **Disclaimer copy rewrite.** Current text mentions "MVP", "Phase 7+", and
   "native build" — all internal jargon. Replace with:

   > *"This is a demo booking — no payment is collected. A confirmation will
   > be sent to your email."*

   Then render it subtly (gray caption under the button), not as a loud
   yellow callout.

3. **Confirmation screen.** Verify it reads the seeded booking correctly and
   shows business name, service, date, staff. If it currently shows "Payment:
   Pending — collect on site", change to "Demo booking confirmed."

4. **Remove `payment_status: 'pending'`** from the booking insert — set it to
   `'not_required'` instead. This aligns with the free-MVP story and avoids
   the business dashboard showing a stale "payment pending" queue.

**Acceptance:**
- Can pick a date/time via native picker on iOS simulator.
- Copy nowhere mentions "MVP" or "Phase N".
- A booking created from the mobile app appears on the business dashboard with
  the right status and no "pending payment" warning.

---

### Phase D3 — Universal search & category browse sanity check

**Goal:** After Phase D1 seeds data, walk through every top-level category
entry point and confirm something meaningful renders.

**Surfaces to verify:**
- **Consumer mobile home screen** — 16 category tiles, tap each, confirm
  results.
- **Consumer mobile universal search** — search "hair", "food", "ride",
  "tickets", "hotel" — each should return at least one seeded result.
- **Business dashboard → browse** — list view shows seeded businesses.
- **Admin panel → businesses** — all 32 show; approval flow works on one
  unapproved test row.

**Fixes expected:** empty-state copy if a category *still* comes up empty,
missing indexes that slow down search, mis-wired category filter IDs
(super_app_categories.key vs categories.slug). Work through each finding as a
small commit.

**Acceptance:** zero empty states on the scripted tour path.

---

### Phase D4 — Demo runbook

**File:** `docs/DEMO.md`

**Sections:**

1. **Cold-start checklist** — what to do on Bridget's laptop 10 minutes before
   an investor call:
   - `git checkout main && git pull`
   - `npm install`
   - Start Supabase local OR point to staging project (env var toggle)
   - `npm run seed:demo`
   - `npm run dev` (web) in one tab
   - `npx expo start` (mobile) in another tab
   - Open iOS simulator, open `localhost:3000`, open admin `localhost:3000/admin`
   - Login as `demo-consumer-1@orvo.app`

2. **The tour script** — ordered walkthrough with talking points:
   - Open consumer mobile → show 16 categories
   - Tap "Beauty & Wellness" → show businesses, reviews, photos
   - Book a service → highlight the flow ends on confirmation
   - Swap to business dashboard → show the booking just landed
   - Swap to admin panel → show approvals, users, reviews
   - Back to consumer → show upcoming bookings on profile
   - Tap another category (e.g. "Tickets") → show breadth
   - Mention "every category has real businesses. Same schema. Same flow."

3. **Reset-between-demos** — how to re-seed without duplicating data
   (`npm run seed:demo` is idempotent per Phase D1).

4. **Known demo caveats** — one honest paragraph about what's intentionally
   mocked (payment, real external adapters) and why.

---

### Phase D5 — End-to-end dry run

**Goal:** Bridget (or me driving a simulator) walks the full tour top to
bottom, finds the rough edges, and we fix them before declaring done.

**Process:**
1. Fresh clone of `feat/demo-readiness`
2. Run cold-start checklist from `docs/DEMO.md`
3. Execute the tour script step by step
4. Log every issue (copy, layout, broken link, console error) as a fix commit
5. Re-run until zero issues

**Acceptance:** clean dry run, nothing logged on the second pass.

## Execution order

```
D1 (seed) → D2 (mobile UX) → D3 (surface check) → D4 (runbook) → D5 (dry run)
```

D1 gates everything else because D3 depends on seed data existing. D2 and D3
could in principle run in parallel, but they'll touch the same mobile file in
places, so serial is safer for a solo workflow.

## Per-batch review checkpoints

Per `superpowers:executing-plans`: execute in batches of ~3 sub-tasks, then
pause for review. Natural batch boundaries below.

| Batch | Work | Reports back |
|---|---|---|
| 1 | D1 scaffolding: script file, idempotency guard, category-fixture map, consumer/provider/admin user creation | Script compiles, runs against local Supabase, creates users only (no businesses yet) |
| 2 | D1 completion: businesses, services, staff, availability, bookings, reviews | Full seed runs green, verification queries show expected row counts |
| 3 | D2: date picker + copy cleanup + `payment_status` change | Mobile booking flow demo-able on simulator |
| 4 | D3: walk all surfaces, fix whatever's empty | Zero empty states remain |
| 5 | D4 + D5: runbook written, dry run complete | `docs/DEMO.md` exists, dry run notes attached |

## What this plan deliberately does NOT include

- Adding fixture data to stub adapters (84 files × ~50 lines each = not worth
  it; seed data covers the visible need)
- Rewriting the admin integration hub (it works; we just don't highlight
  stub adapters during the tour)
- New UI components (the existing dashboard/mobile screens are sufficient once
  populated with data)
- New database migrations (schema is already rich enough; we're filling, not
  extending)
- CI changes / test additions beyond what the seed script needs to prove it
  works (time-box: don't rat-hole on tests for a demo branch)
- Deleting the "MVP" / "Phase N" internal phase references from files other
  than the mobile booking screen. They exist all over the codebase in
  comments and docs. Cleanup is post-demo.

## Rollback plan

If demo readiness takes longer than expected and an investor date is imminent:
- **Minimum viable demo** = D1 + D4. Seed data + a written tour script is
  enough to show the platform even with the ugly date picker. Cut D2/D3/D5 if
  forced.
- The branch is non-destructive — if we throw it away, main still ships.
