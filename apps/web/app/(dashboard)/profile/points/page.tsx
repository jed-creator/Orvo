import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getBalance,
  getHistory,
  type PointsLedgerEntry,
} from '@/lib/services/orvo-points.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = { title: 'Points' };

/**
 * /profile/points — read-only view of a user's Orvo Points balance
 * and ledger. Points are minted by `earnPoints` (called from booking,
 * review, and admin grant flows) and burned by `redeemPoints`. This
 * page is purely a window into that ledger — no manual minting from
 * the UI.
 */
export default async function PointsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let balance = 0;
  let history: PointsLedgerEntry[] = [];
  let error: string | null = null;
  try {
    [balance, history] = await Promise.all([
      getBalance(user.id),
      getHistory(user.id, 100),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orvo Points</CardTitle>
          <CardDescription>
            Earn points on every booking, review, and trip. Redeem them
            at checkout for a discount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p
              data-testid="points-error"
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              Couldn&apos;t load your points balance ({error}).
            </p>
          ) : (
            <div data-testid="points-balance" className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-zinc-900">
                {balance.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-500">points</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent activity</CardTitle>
          <CardDescription>
            Every credit and redemption against your Orvo Points balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p
              data-testid="points-empty"
              className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
            >
              No activity yet. Complete a booking or write a review to
              start earning.
            </p>
          ) : (
            <ul
              data-testid="points-history"
              className="divide-y divide-zinc-200"
            >
              {history.map((entry) => {
                const isCredit = entry.amount > 0;
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
                      {isCredit ? '+' : ''}
                      {entry.amount.toLocaleString()}
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
