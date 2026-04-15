# Phase 8 Delivery — Loyalty, Household, Privacy, Wallet, Prefs, A11y

**Branch:** `feat/super-app-expansion`
**Worktree:** `.worktrees/super-app-expansion`
**Last update:** 2026-04-14
**Status:** ✅ Shipped (services + web UI + mobile UI). Verification (worktree `PLAN.md` Phase 9 / canonical `docs/plans/2026-04-14-orvo-super-app-expansion.md` Phase 8) is the immediate next step.

This file is the durable audit record for the Phase 8 implementation pass so that a fresh Claude Code session picking up this branch after compaction can reconstruct **exactly what shipped, what didn't, and why** without re-reading the full chat history.

---

## TL;DR

Phase 8 adds six user-facing profile surfaces on top of the super-app track:

1. **Orvo Points** loyalty ledger (read-only UI)
2. **Wallet credits** ledger (read-only UI)
3. **Notification preferences** — 10 categories × 3 channels matrix
4. **Accessibility settings** — theme, font scale, reduced motion, high contrast
5. **Privacy** — GDPR-style export + account-deletion request queue
6. **Household** — owner/adult/child membership management

It landed across three commits:

| Commit | Scope |
|---|---|
| `d019f94 feat(profile): loyalty, household, privacy, wallet, prefs, a11y (Phase 8)` | DB migration `007_super_app_profile_features.sql`, all web services, server actions |
| `8d6447a feat(profile): wire 6 sub-pages onto Phase 8 services (Phase 8 UI)` | Web UI — `/profile/*` shell + 6 sub-pages + 7 Playwright auth-gate tests |
| `71ed709 feat(mobile): Phase 8 profile sub-screens for points, wallet, prefs, a11y, privacy, household` | Mobile UI — 6 services + 6 screens + `(tabs)/profile.tsx` rewritten as hub |

Typecheck and lint are clean on both apps after each commit. Web Playwright suite still green (432 unit tests + 7 new profile specs).

---

## 1. What shipped — file inventory

### 1.1 Database (commit `d019f94`)

- `db/migrations/007_super_app_profile_features.sql` — seven tables, permissive RLS:
  - `orvo_points_ledger` — read own, service-role inserts only
  - `wallet_accounts` + `wallet_ledger` — read own via account, service-role ledger inserts
  - `notification_preferences` — user upsert via RLS (primary key `(user_id, category, channel)`)
  - `accessibility_settings` — user upsert via RLS, 1 row per user
  - `privacy_requests` — user INSERT only; status transitions service-role
  - `households` + `household_members` — owner has full CRUD on their rows
- Notification category enum (matches service constants): `eat`, `ride`, `book`, `trips`, `tickets`, `shop`, `market`, `compare`, `promos`, `system`. `system` is always-on transactional.
- Notification channel enum: `push`, `email`, `sms`.
- Household role enum: `owner` (protected — can't be removed), `adult`, `child`.

### 1.2 Web services + server actions (commit `d019f94`)

All under `apps/web/lib/services/`:

- `orvo-points.service.ts` — `getBalance`, `getHistory`, `addEntry` (service-role)
- `wallet.service.ts` — `getBalance`, `getHistory`, `credit`/`debit` (service-role)
- `notification-preferences.service.ts` — `getPreferences`, `setPreference`
- `accessibility.service.ts` — `getSettings`, `upsertSettings` (validates theme enum + font_scale 0.75–2.0)
- `privacy.service.ts` — `requestExport`, `requestDeletion`, `listUserRequests`
- `household.service.ts` — `createHousehold`, `getOwnedHousehold`, `listMembers`, `addMember`, `removeMember` (guards owner from being removed)

Web services use `createAdminClient()` (service_role) because they run in server actions / RSC and bypass RLS. Mobile services (§1.4) use the anon-key user-session client and rely on RLS.

### 1.3 Web UI (commit `8d6447a`)

- `apps/web/app/(dashboard)/profile/layout.tsx` — shared header + `<ProfileNav />` tabs
- `apps/web/app/(dashboard)/profile/page.tsx` — existing profile edit (now redirects back to `/profile` on save)
- `apps/web/app/(dashboard)/profile/points/page.tsx` — 40pt balance card + ledger rows
- `apps/web/app/(dashboard)/profile/wallet/page.tsx` — USD balance + ledger (credit/debit color-coded)
- `apps/web/app/(dashboard)/profile/notifications/page.tsx` — 10×3 toggle matrix with a server action per cell
- `apps/web/app/(dashboard)/profile/accessibility/page.tsx` — theme radio group + font slider + motion/contrast checkboxes, single Save server action
- `apps/web/app/(dashboard)/profile/privacy/page.tsx` — two request buttons + history list + JSON payload preview for the most recent export
- `apps/web/app/(dashboard)/profile/household/page.tsx` — owner view, member list, add/remove server actions
- `apps/web/components/super-app/profile-nav.tsx` — client island, `usePathname()` to highlight current tab
- `apps/web/tests/e2e/profile.spec.ts` — 7 Playwright specs (one per route + index) that assert unauthenticated requests redirect to `/login`. Doubles as a compile smoke test.

### 1.4 Mobile services (commit `71ed709`)

All under `apps/mobile/lib/services/`:

- `orvo-points.ts` — `getBalance`, `getHistory` (read-only; no inserts)
- `wallet.ts` — `findAccountId`, `getBalance(userId, 'USD')`, `getHistory(userId, 'USD', 100)` (read-only)
- `notification-preferences.ts` — same constants as web (`NOTIFICATION_CATEGORIES`, `NOTIFICATION_CHANNELS`, `CATEGORY_LABELS`, `CHANNEL_LABELS`), `getPreferences` merges sparse DB rows with `DEFAULT_ENABLED = true`, `setPreference` upserts through RLS
- `accessibility.ts` — `DEFAULT_ACCESSIBILITY_SETTINGS`, `getSettings` (returns defaults if no row), `upsertSettings` (validates theme enum + font_scale range client-side before writing)
- `privacy.ts` — `requestExport`, `requestDeletion`, `listUserRequests`
- `household.ts` — full CRUD mirroring the web contract; `removeMember` guards against removing the owner

### 1.5 Mobile screens (commit `71ed709`)

- `apps/mobile/app/(tabs)/profile.tsx` — **rewritten from 73-line sign-out stub into a hub**. Shows email + member-since + points/wallet summary cards (via `useFocusEffect`), links to 6 sub-screens, sign-out button at the bottom.
- `apps/mobile/app/profile/points.tsx` — balance card (40pt number) + history list. `+` prefix for earns, color-coded.
- `apps/mobile/app/profile/wallet.tsx` — same layout formatted as USD via `Intl.NumberFormat`.
- `apps/mobile/app/profile/notifications.tsx` — 10×3 Switch matrix. System row disabled 0.6 opacity. Optimistic update → revert + `Alert.alert` on RLS error.
- `apps/mobile/app/profile/accessibility.tsx` — segmented theme control, **discrete font-scale steps** (`[0.75, 0.9, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0]`), Switch toggles for reduced motion + high contrast, Save button with 2.5s flash banner.
- `apps/mobile/app/profile/privacy.tsx` — two cards (export = primary, delete = destructive outline) + request list with status badges. Delete uses `Alert.alert` two-step confirm.
- `apps/mobile/app/profile/household.tsx` — create form (if no owned household) OR member list + add-member form. Raw UUID input with an Adult/Child segmented control for role. Remove confirms via `Alert.alert`.

Each sub-screen uses inline `<Stack.Screen options={{ headerShown: true, title: '…' }} />` for its own header — no root `_layout.tsx` changes needed because Expo Router auto-discovers top-level routes under `app/profile/`.

---

## 2. Architecture decisions & why

### 2.1 Mobile uses direct Supabase with user session, not the web REST API

**Decision:** Mobile services call Supabase directly with the anon-key + AsyncStorage session (matching the existing `bookings.tsx` pattern), rather than going through `apps/mobile/lib/super-app-api.ts` which hits the web REST endpoints.

**Why:**
- RLS on migration 007 already allows every operation the user can legitimately perform on their own rows — the admin-client path in the web service layer is only necessary for points/wallet *inserts*, which happen server-side after a booking settles anyway.
- No need to stand up new `/api/profile/*` endpoints on web just to get the mobile app reading its own data.
- Matches the pattern the codebase already established for consumer reads (`apps/mobile/app/(tabs)/bookings.tsx`).

**Consequence:** mobile points/wallet screens are read-only by design. Earning / crediting flows will run on the server as part of booking settlement, not from the device. This is correct — clients should never mint their own currency.

### 2.2 Discrete font-scale steps on mobile vs range slider on web

**Decision:** Mobile picks from a fixed set of 8 discrete scale steps (`0.75, 0.9, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0`); web uses a continuous `<input type="range">` over the same `0.75–2.0` range.

**Why:**
- React Native has no cross-platform range slider primitive — `@react-native-community/slider` is an extra native dependency we don't need.
- Discrete buttons are friendlier on touch than a thin slider thumb.
- Both UIs write the same `font_scale` column, so cross-surface consistency is preserved as long as mobile rounds to the nearest discrete step on read (it does — `Math.abs(...) < 0.001`).

### 2.3 Optimistic toggle + revert-on-error for notification switches

**Decision:** Mobile `notifications.tsx` flips local Switch state immediately, then awaits the RLS write. On failure it reverts the local cell and surfaces a one-shot `Alert.alert`.

**Why:** touch UIs feel broken if the switch doesn't move under your finger. Network round-trip to Supabase is ~200–400ms on wifi and longer on LTE — that's a perceptible lag. The revert path handles the rare failure case without letting local and remote drift.

### 2.4 Navigation: top-level routes under `app/profile/`, not nested under `(tabs)/profile/`

**Decision:** Sub-screens live at `apps/mobile/app/profile/<name>.tsx` (top-level on the root Stack), not at `apps/mobile/app/(tabs)/profile/<name>.tsx`.

**Why:**
- `(tabs)` is a **tab layout**, not a stack — you can't push new routes from within it.
- Top-level routes push onto the root Stack and can enable their own header via `<Stack.Screen options={{ headerShown: true }} />`.
- Mirrors how `app/booking/[id]/index.tsx` already works.
- No explicit registration needed in root `_layout.tsx` because Expo Router auto-discovers top-level routes. (I almost added a redundant `<Stack.Screen name="profile" />` — don't.)

### 2.5 Raw UUID input for household add-member

**Decision:** Mobile household add-member UI takes a raw `uuid` string.

**Why:** invite-by-email is explicitly deferred to a later phase — that requires a pending-invite table, email templates, magic-link flow, etc. Not in scope for Phase 8. The UI is already labeled *"Email-based invites are coming in a later phase."*

---

## 3. Deferred / follow-ups

These are real gaps that Phase 8 intentionally leaves open. They are **not** verification blockers for the upcoming Phase 9 pass.

1. **Mobile push handler that respects `notification_preferences`.** Expo push tokens aren't wired; when they are, the dispatcher must read the matrix and skip categories the user opted out of.
2. **Applying accessibility settings client-side.** Mobile currently persists `theme` / `font_scale` / `reduced_motion` / `high_contrast` but doesn't *read* them at app start. Needs a provider that hydrates on launch and wraps the root with the correct theme + `Text` scaling.
3. **Invite-by-email household flow.** Raw UUID is a placeholder. Requires `household_invites` table, email send via Resend, token validation.
4. **Export payload generation.** Privacy request inserts are queued as `pending`; the background worker that assembles the export ZIP and flips status → `processing` → `completed` is out of scope (mentioned in the mobile screen copy and the service JSDoc).
5. **Household shared wallet / points.** Schema supports it (all rows belong to a `user_id`), but there's no "spend from household pool" logic yet. Members each have their own balances.
6. **Pre-existing unrelated lint warning** in `apps/mobile/app/booking/[id]/index.tsx` (missing `useEffect` dependency). Not introduced by Phase 8. Left untouched so the commit diff stays focused.

---

## 4. Phase 9 — Verification plan (NEXT STEP)

Per worktree `PLAN.md` §Phase 9 and canonical `docs/plans/2026-04-14-orvo-super-app-expansion.md` §Phase 8, the next action is a full verification sweep and a PR-prep log.

### 4.1 Commands to run (in worktree root)

```bash
# 1. Workspace-wide unit tests
npm test --workspaces --if-present

# 2. Web typecheck + build
npm run build --workspace=@orvo/web

# 3. Mobile typecheck (no build script; use tsc directly)
(cd apps/mobile && npx tsc --noEmit)

# 4. Mobile lint
(cd apps/mobile && npm run lint)

# 5. Playwright E2E (existing booking flow + new profile auth-gate specs)
npx playwright test --config apps/web/playwright.config.ts

# 6. Shared package tests (if present)
npm test --workspace=@orvo/shared --if-present
```

Expected baseline before Phase 9 starts:
- Web unit tests: **432 passing** (per commit `8d6447a` message)
- Mobile typecheck: **clean** (per commit `71ed709` message)
- Mobile lint: **clean for new Phase 8 files**; 1 pre-existing unrelated warning in `booking/[id]/index.tsx`
- Playwright: **7 new profile specs passing** plus the existing booking-flow suite

### 4.2 Deliverable

Create `docs/plans/2026-04-14-orvo-super-app-verification.md` in the **parent repo** (not the worktree — it's a long-lived audit doc) with:

1. Command output summaries (pass counts, build sizes, warnings)
2. Any Phase 8 regressions discovered and their fixes
3. Diff stat summary of all super-app-expansion commits
4. Explicit sign-off line: *"Verification complete — ready to PR."*

Commit in the worktree with `chore(super-app): verification log for super-app scaffold`.

### 4.3 After verification: PR

Once the log is committed, push and open the PR per canonical plan §Task 8.2:

```bash
git push -u origin feat/super-app-expansion
gh pr create --title "feat(super-app): Orvo super app expansion scaffold" --body "$(cat <<'EOF'
## Summary
- Super-app integration hub (89 adapters, 16 categories)
- Web modules: shop, eat, ride, trips, tickets, market, compare, book, explore
- Mobile Explore tab + 8 category screens
- Admin integration hub
- Phase 8 profile features: Orvo Points, Wallet, Notification prefs, Accessibility, Privacy, Household (services + web UI + mobile UI)

See docs/SUPER_APP.md and docs/FEATURE_OUTLINE_COVERAGE.md.
EOF
)"
```

---

## 5. Fast-recovery index

If you pick up this branch after compaction and need to re-orient in under 60 seconds, read these in order:

1. **`PLAN.md`** (worktree root) — phase map
2. **`docs/SUPER_APP.md`** — architecture reference
3. **`docs/FEATURE_OUTLINE_COVERAGE.md`** — what the PDF requires vs what exists
4. **`docs/PHASE_8_DELIVERY.md`** (this file) — what Phase 8 shipped
5. **`git log --oneline -10`** — most recent state
6. **`db/migrations/007_super_app_profile_features.sql`** — Phase 8 schema + RLS

The three Phase 8 commits (`d019f94`, `8d6447a`, `71ed709`) are the authoritative record of implementation; this file is the narrative summary that survives context loss.
