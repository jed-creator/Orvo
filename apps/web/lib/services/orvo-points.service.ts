/**
 * Orvo Points service (Phase 8.1).
 *
 * Append-only loyalty ledger. Balances are always a live SUM over a
 * user's `orvo_points_ledger` rows — never denormalized, so there's
 * only one source of truth and the ledger can be audited.
 *
 * Callers:
 *   - `earnPoints` runs after a booking completes, a review is
 *     posted, or admin manually grants goodwill points. Positive
 *     amount.
 *   - `redeemPoints` is called when a user spends points at
 *     checkout or on a reward. Negative amount written; the caller
 *     must check the balance first (the service enforces that the
 *     resulting balance can't go below zero).
 *   - `getBalance` / `getHistory` are read-only views for the
 *     profile/wallet UI.
 *
 * Writes use the admin client so RLS can remain read-only for
 * end-users (clients can inspect their own rows but never mint
 * points). See `007_super_app_profile_features.sql` RLS policies.
 */
import { createAdminClient } from '@/lib/supabase/server';

export interface PointsEarnInput {
  userId: string;
  amount: number; // must be > 0
  reason: string;
  referenceId?: string;
  referenceKind?: string;
  metadata?: Record<string, unknown>;
}

export interface PointsRedeemInput {
  userId: string;
  amount: number; // positive number; service writes it as negative
  reason: string;
  referenceId?: string;
  referenceKind?: string;
  metadata?: Record<string, unknown>;
}

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  reference_kind: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('orvo_points_ledger')
    .select('amount')
    .eq('user_id', userId);
  return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
}

export async function getHistory(
  userId: string,
  limit = 50,
): Promise<PointsLedgerEntry[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('orvo_points_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as PointsLedgerEntry[];
}

export async function earnPoints(input: PointsEarnInput): Promise<void> {
  if (input.amount <= 0) {
    throw new Error('earnPoints requires a positive amount');
  }
  const admin = createAdminClient();
  const { error } = await admin.from('orvo_points_ledger').insert({
    user_id: input.userId,
    amount: input.amount,
    reason: input.reason,
    reference_id: input.referenceId ?? null,
    reference_kind: input.referenceKind ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

export async function redeemPoints(input: PointsRedeemInput): Promise<void> {
  if (input.amount <= 0) {
    throw new Error('redeemPoints requires a positive amount');
  }
  const balance = await getBalance(input.userId);
  if (balance < input.amount) {
    throw new Error(
      `Insufficient points: balance ${balance}, requested ${input.amount}`,
    );
  }
  const admin = createAdminClient();
  const { error } = await admin.from('orvo_points_ledger').insert({
    user_id: input.userId,
    amount: -input.amount,
    reason: input.reason,
    reference_id: input.referenceId ?? null,
    reference_kind: input.referenceKind ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}
