/**
 * Wallet credits service (Phase 8.4).
 *
 * Orvo-internal store of value — credit Orvo issues for refunds,
 * referral bonuses, goodwill adjustments. Separate from Stripe.
 * Mirrors the `orvo-points.service` pattern:
 *
 *   - `wallet_accounts` — one row per (user_id, currency)
 *   - `wallet_ledger`   — append-only entries, balance = SUM
 *
 * A user can hold both USD and CAD credits without collisions. The
 * service auto-creates an account on first credit, so callers don't
 * need to pre-create rows.
 */
import { createAdminClient } from '@/lib/supabase/server';

export interface WalletAccount {
  id: string;
  user_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  account_id: string;
  amount_cents: number;
  reason: string;
  reference_id: string | null;
  reference_kind: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WalletMoveInput {
  userId: string;
  currency?: string;
  amountCents: number; // positive number; caller chooses credit/debit via the function name
  reason: string;
  referenceId?: string;
  referenceKind?: string;
  metadata?: Record<string, unknown>;
}

async function ensureAccount(
  userId: string,
  currency: string,
): Promise<WalletAccount> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', currency)
    .maybeSingle();
  if (existing) return existing as WalletAccount;

  const { data: created, error } = await admin
    .from('wallet_accounts')
    .insert({ user_id: userId, currency })
    .select('*')
    .single();
  if (error || !created) {
    throw error ?? new Error('Failed to create wallet account');
  }
  return created as WalletAccount;
}

export async function getBalance(
  userId: string,
  currency = 'USD',
): Promise<number> {
  const admin = createAdminClient();
  const { data: account } = await admin
    .from('wallet_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('currency', currency)
    .maybeSingle();
  if (!account) return 0;

  const { data: entries } = await admin
    .from('wallet_ledger')
    .select('amount_cents')
    .eq('account_id', account.id);
  return (entries ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0,
  );
}

export async function getHistory(
  userId: string,
  currency = 'USD',
  limit = 50,
): Promise<WalletLedgerEntry[]> {
  const admin = createAdminClient();
  const { data: account } = await admin
    .from('wallet_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('currency', currency)
    .maybeSingle();
  if (!account) return [];

  const { data } = await admin
    .from('wallet_ledger')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as WalletLedgerEntry[];
}

export async function creditWallet(input: WalletMoveInput): Promise<void> {
  if (input.amountCents <= 0) {
    throw new Error('creditWallet requires a positive amountCents');
  }
  const account = await ensureAccount(
    input.userId,
    input.currency ?? 'USD',
  );
  const admin = createAdminClient();
  const { error } = await admin.from('wallet_ledger').insert({
    account_id: account.id,
    amount_cents: input.amountCents,
    reason: input.reason,
    reference_id: input.referenceId ?? null,
    reference_kind: input.referenceKind ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

export async function debitWallet(input: WalletMoveInput): Promise<void> {
  if (input.amountCents <= 0) {
    throw new Error('debitWallet requires a positive amountCents');
  }
  const currency = input.currency ?? 'USD';
  const balance = await getBalance(input.userId, currency);
  if (balance < input.amountCents) {
    throw new Error(
      `Insufficient wallet balance (${currency}): ${balance}, requested ${input.amountCents}`,
    );
  }
  const account = await ensureAccount(input.userId, currency);
  const admin = createAdminClient();
  const { error } = await admin.from('wallet_ledger').insert({
    account_id: account.id,
    amount_cents: -input.amountCents,
    reason: input.reason,
    reference_id: input.referenceId ?? null,
    reference_kind: input.referenceKind ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}
