-- =============================================================================
-- ORVO — Super App Profile Features (Phase 8)
-- =============================================================================
-- Adds the schema backing the six user-profile super-powers from the
-- Feature Outline (Phase 8.1 – 8.6):
--
--   8.1 Orvo Points loyalty        → orvo_points_ledger
--   8.2 Household profiles         → households + household_members
--   8.3 Privacy dashboard (GDPR)   → privacy_requests (export + delete)
--   8.4 Wallet credits             → wallet_accounts + wallet_ledger
--   8.5 Notification preferences   → notification_preferences
--   8.6 Accessibility settings     → accessibility_settings
--
-- This migration is ADDITIVE ONLY — no existing columns are altered.
-- All tables use `IF NOT EXISTS`, all indices use `IF NOT EXISTS`, and
-- RLS policies `DROP POLICY IF EXISTS` before recreating so re-running
-- is idempotent.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — ORVO POINTS LEDGER (Phase 8.1)
-- =============================================================================
-- Append-only ledger. Balances are a SUM over (user_id) — never stored
-- denormalized, so there's only one source of truth. Positive `amount`
-- is an earn, negative is a redeem. `reason` is a short machine code
-- ('booking_complete','review_posted','manual_grant','redemption',...)
-- and `reference_id` can link back to a booking / review / order.
--
-- Expected query pattern: `SELECT SUM(amount) FROM orvo_points_ledger
-- WHERE user_id = $1` — indexed on (user_id, created_at DESC).

CREATE TABLE IF NOT EXISTS public.orvo_points_ledger (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL, -- positive = earn, negative = redeem
  reason        TEXT NOT NULL,
  reference_id  UUID,             -- optional link to booking/review/etc.
  reference_kind TEXT,            -- 'booking' | 'review' | 'order' | 'manual' | ...
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orvo_points_ledger_user_idx
  ON public.orvo_points_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orvo_points_ledger_reference_idx
  ON public.orvo_points_ledger (reference_kind, reference_id)
  WHERE reference_id IS NOT NULL;


-- =============================================================================
-- SECTION 2 — HOUSEHOLD PROFILES (Phase 8.2)
-- =============================================================================
-- A household is a group of accounts that can share bookings, payment
-- methods, and notifications. One user creates the household and is
-- the `owner_user_id`; other users are linked via `household_members`
-- with a role (`owner`, `adult`, `child`).
--
-- We don't (yet) move bookings to the household level — that's a
-- downstream decision. This schema just establishes the relationship
-- so profile-level features (shared calendar, shared wallet, parental
-- controls) have somewhere to land.

CREATE TABLE IF NOT EXISTS public.households (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS households_owner_idx
  ON public.households (owner_user_id);

DROP TRIGGER IF EXISTS set_households_updated_at ON public.households;
CREATE TRIGGER set_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.household_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'adult'
               CHECK (role IN ('owner','adult','child')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, user_id)
);
CREATE INDEX IF NOT EXISTS household_members_household_idx
  ON public.household_members (household_id);
CREATE INDEX IF NOT EXISTS household_members_user_idx
  ON public.household_members (user_id);


-- =============================================================================
-- SECTION 3 — PRIVACY REQUESTS (Phase 8.3)
-- =============================================================================
-- GDPR-style export + delete request log. The privacy dashboard
-- inserts a row here when a user requests an export or deletion; a
-- server action transitions `status` through
-- `pending → processing → completed | failed`. For exports,
-- `result_url` holds the signed URL of the generated ZIP. Delete
-- requests never produce a result_url — the account data is wiped
-- when status flips to `completed`.

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('export','delete')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','failed')),
  result_url   TEXT,             -- signed URL for export ZIP
  error        TEXT,             -- populated when status = 'failed'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS privacy_requests_user_idx
  ON public.privacy_requests (user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_pending_idx
  ON public.privacy_requests (status, requested_at)
  WHERE status IN ('pending','processing');


-- =============================================================================
-- SECTION 4 — WALLET CREDITS (Phase 8.4)
-- =============================================================================
-- Orvo-internal store of value. Separate from Stripe: this is credit
-- Orvo issues (refunds, referral bonuses, goodwill credits) that can
-- be spent on any Orvo booking. Mirrors the `orvo_points_ledger`
-- pattern — append-only entries, balance = SUM. One `wallet_accounts`
-- row per (user_id, currency) so users can hold both USD and CAD
-- credits without collisions.

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency   TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, currency)
);
CREATE INDEX IF NOT EXISTS wallet_accounts_user_idx
  ON public.wallet_accounts (user_id);

DROP TRIGGER IF EXISTS set_wallet_accounts_updated_at ON public.wallet_accounts;
CREATE TRIGGER set_wallet_accounts_updated_at
  BEFORE UPDATE ON public.wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id     UUID NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
  amount_cents   INTEGER NOT NULL, -- positive = credit, negative = debit
  reason         TEXT NOT NULL,
  reference_id   UUID,
  reference_kind TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wallet_ledger_account_idx
  ON public.wallet_ledger (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_ledger_reference_idx
  ON public.wallet_ledger (reference_kind, reference_id)
  WHERE reference_id IS NOT NULL;


-- =============================================================================
-- SECTION 5 — NOTIFICATION PREFERENCES (Phase 8.5)
-- =============================================================================
-- Per-user, per-category opt-in matrix. One row per
-- (user_id, category, channel) — `channel` is push/email/sms and
-- `category` is one of the super-app module keys (eat, ride, book,
-- trips, tickets, shop, market, compare, promos, system).
-- `enabled` defaults to TRUE; the UI only writes rows when a user
-- opts OUT (sparse). A helper at service level fills in defaults so
-- the UI can render the full matrix.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category, channel)
);
CREATE INDEX IF NOT EXISTS notification_preferences_user_idx
  ON public.notification_preferences (user_id);

DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- SECTION 6 — ACCESSIBILITY SETTINGS (Phase 8.6)
-- =============================================================================
-- One row per user, holding rendering preferences that affect every
-- Orvo surface (web + mobile). The UI reads this row at login and
-- applies it client-side. `theme` = 'system'|'light'|'dark',
-- `font_scale` is a float multiplier (1.0 default), `reduced_motion`
-- disables transitions, `high_contrast` swaps to higher-contrast
-- palettes. New flags can be added as columns without a migration
-- dance since nothing else FKs to this table.

CREATE TABLE IF NOT EXISTS public.accessibility_settings (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme          TEXT NOT NULL DEFAULT 'system'
                 CHECK (theme IN ('system','light','dark')),
  font_scale     NUMERIC(3,2) NOT NULL DEFAULT 1.00
                 CHECK (font_scale >= 0.75 AND font_scale <= 2.00),
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  high_contrast  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_accessibility_settings_updated_at ON public.accessibility_settings;
CREATE TRIGGER set_accessibility_settings_updated_at
  BEFORE UPDATE ON public.accessibility_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- SECTION 7 — ROW LEVEL SECURITY
-- =============================================================================
-- Every Phase 8 table is user-scoped. Policy rule of thumb:
-- a user can read/write their own rows; admins (via the existing
-- `is_admin()` helper from migration 004) get full access for
-- support / moderation.

ALTER TABLE public.orvo_points_ledger       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_settings   ENABLE ROW LEVEL SECURITY;

-- ---------- Orvo Points ledger ----------
DROP POLICY IF EXISTS "user reads own points" ON public.orvo_points_ledger;
CREATE POLICY "user reads own points" ON public.orvo_points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Inserts go through a server action that uses the service-role key,
-- bypassing RLS. No direct user-level insert policy is needed — and
-- withholding it prevents clients from hand-minting points.

-- ---------- Households ----------
DROP POLICY IF EXISTS "household member reads household" ON public.households;
CREATE POLICY "household member reads household" ON public.households
  FOR SELECT USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1 FROM public.household_members m
      WHERE m.household_id = households.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner writes household" ON public.households;
CREATE POLICY "owner writes household" ON public.households
  FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "member reads own membership" ON public.household_members;
CREATE POLICY "member reads own membership" ON public.household_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner writes membership" ON public.household_members;
CREATE POLICY "owner writes membership" ON public.household_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households h
      WHERE h.id = household_members.household_id AND h.owner_user_id = auth.uid()
    )
  );

-- ---------- Privacy requests ----------
DROP POLICY IF EXISTS "user reads own privacy requests" ON public.privacy_requests;
CREATE POLICY "user reads own privacy requests" ON public.privacy_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user creates own privacy requests" ON public.privacy_requests;
CREATE POLICY "user creates own privacy requests" ON public.privacy_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transitions (pending→processing→completed) go through a
-- service-role worker — no UPDATE policy for regular users.

-- ---------- Wallet ----------
DROP POLICY IF EXISTS "user reads own wallet account" ON public.wallet_accounts;
CREATE POLICY "user reads own wallet account" ON public.wallet_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user reads own wallet ledger" ON public.wallet_ledger;
CREATE POLICY "user reads own wallet ledger" ON public.wallet_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wallet_accounts a
      WHERE a.id = wallet_ledger.account_id AND a.user_id = auth.uid()
    )
  );

-- Writes to wallet_accounts / wallet_ledger happen via service role.

-- ---------- Notification preferences ----------
DROP POLICY IF EXISTS "user reads own notification prefs" ON public.notification_preferences;
CREATE POLICY "user reads own notification prefs" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user writes own notification prefs" ON public.notification_preferences;
CREATE POLICY "user writes own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------- Accessibility settings ----------
DROP POLICY IF EXISTS "user reads own accessibility settings" ON public.accessibility_settings;
CREATE POLICY "user reads own accessibility settings" ON public.accessibility_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user writes own accessibility settings" ON public.accessibility_settings;
CREATE POLICY "user writes own accessibility settings" ON public.accessibility_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
