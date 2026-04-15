import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getBalance,
  getHistory,
  type WalletLedgerEntry,
} from '@/lib/services/wallet.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = { title: 'Wallet' };

const CURRENCY = 'USD';

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * /profile/wallet — Orvo wallet credit balance + ledger. Credits are
 * minted by refunds, referral bonuses, and goodwill adjustments; debits
 * happen at checkout when the user opts to spend wallet credit.
 *
 * This page renders only USD for now — the service supports multiple
 * currencies but Phase 8 ships with a single-currency view.
 */
export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let balanceCents = 0;
  let history: WalletLedgerEntry[] = [];
  let error: string | null = null;
  try {
    [balanceCents, history] = await Promise.all([
      getBalance(user.id, CURRENCY),
      getHistory(user.id, CURRENCY, 100),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orvo Wallet</CardTitle>
          <CardDescription>
            Store credit, refunds, and referral bonuses. Use it at
            checkout anywhere on Orvo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p
              data-testid="wallet-error"
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              Couldn&apos;t load your wallet balance ({error}).
            </p>
          ) : (
            <div
              data-testid="wallet-balance"
              className="flex items-baseline gap-2"
            >
              <span className="text-4xl font-bold text-zinc-900">
                {formatMoney(balanceCents, CURRENCY)}
              </span>
              <span className="text-sm text-zinc-500">{CURRENCY}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent activity</CardTitle>
          <CardDescription>
            Credits and debits against your wallet, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p
              data-testid="wallet-empty"
              className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
            >
              No wallet activity yet. Refunds and referral bonuses will
              appear here.
            </p>
          ) : (
            <ul
              data-testid="wallet-history"
              className="divide-y divide-zinc-200"
            >
              {history.map((entry) => {
                const isCredit = entry.amount_cents > 0;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {entry.reason}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={
                        isCredit
                          ? 'font-semibold text-emerald-700'
                          : 'font-semibold text-zinc-700'
                      }
                    >
                      {isCredit ? '+' : '−'}
                      {formatMoney(Math.abs(entry.amount_cents), CURRENCY)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
