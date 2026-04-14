/**
 * Privacy dashboard service (Phase 8.3).
 *
 * GDPR-style export + delete requests. The dashboard page POSTs a
 * server action that calls `requestExport` or `requestDeletion`,
 * which inserts a row in `privacy_requests` with `status = 'pending'`.
 * A background worker (not in scope for this phase) picks up pending
 * rows, generates the export ZIP (or runs the deletion), and
 * transitions `status` to `completed` / `failed`.
 *
 * `buildExportPayload` is the synchronous in-process helper the UI
 * uses to show "what will be in your export" — it gathers the user's
 * rows from the profile + booking + review tables into a single
 * JSON-shaped object. Safe to call from server components.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type PrivacyRequestKind = 'export' | 'delete';
export type PrivacyRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface PrivacyRequest {
  id: string;
  user_id: string;
  kind: PrivacyRequestKind;
  status: PrivacyRequestStatus;
  result_url: string | null;
  error: string | null;
  requested_at: string;
  completed_at: string | null;
}

export async function requestExport(userId: string): Promise<PrivacyRequest> {
  return insertRequest(userId, 'export');
}

export async function requestDeletion(
  userId: string,
): Promise<PrivacyRequest> {
  return insertRequest(userId, 'delete');
}

async function insertRequest(
  userId: string,
  kind: PrivacyRequestKind,
): Promise<PrivacyRequest> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('privacy_requests')
    .insert({ user_id: userId, kind, status: 'pending' })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Failed to create privacy request');
  return data as PrivacyRequest;
}

export async function listUserRequests(
  userId: string,
): Promise<PrivacyRequest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('privacy_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });
  return (data ?? []) as PrivacyRequest[];
}

/**
 * Gathers every Orvo row that belongs to `userId` into a single
 * JSON-shaped object. Intended for the "preview your export"
 * panel on the privacy dashboard — the background worker calls
 * this too, then uploads the result to Supabase Storage and
 * writes the signed URL onto the request row.
 *
 * Tables touched:
 *   - profiles            (identity)
 *   - bookings            (all bookings the user made)
 *   - reviews             (reviews the user wrote)
 *   - orvo_points_ledger  (loyalty history)
 *   - wallet_ledger       (credit history via wallet_accounts)
 *   - notification_preferences
 *   - accessibility_settings
 *   - households (as owner) + household_members (as member)
 */
export interface ExportPayload {
  profile: Record<string, unknown> | null;
  bookings: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  orvo_points: Record<string, unknown>[];
  wallet_ledger: Record<string, unknown>[];
  notification_preferences: Record<string, unknown>[];
  accessibility_settings: Record<string, unknown> | null;
  households_owned: Record<string, unknown>[];
  household_memberships: Record<string, unknown>[];
  generated_at: string;
}

export async function buildExportPayload(
  userId: string,
): Promise<ExportPayload> {
  const admin = createAdminClient();

  const [
    profile,
    bookings,
    reviews,
    points,
    walletAccounts,
    notifPrefs,
    a11y,
    households,
    memberships,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('bookings').select('*').eq('user_id', userId),
    admin.from('reviews').select('*').eq('author_id', userId),
    admin.from('orvo_points_ledger').select('*').eq('user_id', userId),
    admin
      .from('wallet_accounts')
      .select('id, currency, created_at')
      .eq('user_id', userId),
    admin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId),
    admin
      .from('accessibility_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('households').select('*').eq('owner_user_id', userId),
    admin
      .from('household_members')
      .select('*, households(id, name)')
      .eq('user_id', userId),
  ]);

  // Expand wallet ledger per-account so the export lines up with the UI.
  const walletAccountIds = (walletAccounts.data ?? []).map((a) => a.id);
  const walletLedger = walletAccountIds.length
    ? (
        await admin
          .from('wallet_ledger')
          .select('*')
          .in('account_id', walletAccountIds)
      ).data ?? []
    : [];

  return {
    profile: profile.data ?? null,
    bookings: bookings.data ?? [],
    reviews: reviews.data ?? [],
    orvo_points: points.data ?? [],
    wallet_ledger: walletLedger,
    notification_preferences: notifPrefs.data ?? [],
    accessibility_settings: a11y.data ?? null,
    households_owned: households.data ?? [],
    household_memberships: memberships.data ?? [],
    generated_at: new Date().toISOString(),
  };
}
