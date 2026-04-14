/**
 * Pricing service — reads `price_snapshots` (see migration 005) and
 * turns the raw rows into a per-provider comparison with a "best"
 * winner. The table is append-only and not uniquely keyed on
 * `(fingerprint, provider)`, so we pull the recent history ordered
 * DESC and keep only the first row per provider.
 *
 * Structure mirrors `marketplace.service.ts`: a narrow
 * `SupabaseLikeClient` describes the call chain we need, a
 * `supabasePricingStore` factory wires a real (or fake) client into
 * the `PricingStore` interface, and pure helpers on top do the
 * grouping so they can be unit-tested without a DB.
 */

export interface PriceSnapshot {
  id: string;
  fingerprint: string;
  provider: string;
  price_amount: number;
  currency: string;
  url: string;
  captured_at: string;
}

export interface ProviderSnapshot {
  provider: string;
  price_amount: number;
  currency: string;
  url: string;
  captured_at: string;
}

export interface PriceComparison {
  fingerprint: string;
  snapshots: PriceSnapshot[];
  byProvider: ProviderSnapshot[];
  best: ProviderSnapshot | null;
}

/**
 * Keep only the most recent snapshot per provider. Input must be
 * captured_at DESC (the first row per provider wins). The function
 * is pure so tests can pass hand-built rows without a DB mock.
 */
export function latestByProvider(
  snapshots: PriceSnapshot[],
): ProviderSnapshot[] {
  const seen = new Set<string>();
  const out: ProviderSnapshot[] = [];
  for (const s of snapshots) {
    if (seen.has(s.provider)) continue;
    seen.add(s.provider);
    out.push({
      provider: s.provider,
      price_amount: s.price_amount,
      currency: s.currency,
      url: s.url,
      captured_at: s.captured_at,
    });
  }
  return out;
}

/**
 * Winner = lowest `price_amount`. Returns null for an empty input.
 * We intentionally don't normalise across currencies — that's a
 * price-engine concern for a later phase.
 */
export function selectBest(
  byProvider: ProviderSnapshot[],
): ProviderSnapshot | null {
  if (byProvider.length === 0) return null;
  return byProvider.reduce((best, cur) =>
    cur.price_amount < best.price_amount ? cur : best,
  );
}

export interface PricingStore {
  snapshotsForFingerprint(
    fingerprint: string,
    limit?: number,
  ): Promise<PriceSnapshot[]>;
}

/**
 * Compose: fetch → latest per provider → best. Route handlers call
 * this instead of the store methods directly so the grouping logic
 * is exercised by the route tests.
 */
export async function compareFingerprint(
  store: PricingStore,
  fingerprint: string,
): Promise<PriceComparison> {
  const snapshots = await store.snapshotsForFingerprint(fingerprint);
  const byProvider = latestByProvider(snapshots);
  const best = selectBest(byProvider);
  return { fingerprint, snapshots, byProvider, best };
}

/**
 * Narrow interface over the Supabase client — read-only slice we
 * need for price comparisons. Local to this service to keep modules
 * independent; compare to `marketplace.service.ts` which has an
 * analogous interface with an extra `insert()` branch.
 */
interface SupabaseLikeClient {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (
        col: string,
        val: unknown,
      ) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => {
          limit: (n: number) => Promise<{
            data: Array<Record<string, unknown>> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

/**
 * Wrap a Supabase-shaped client into `PricingStore`. Client is typed
 * as `unknown` + cast internally for the same reason as
 * `supabaseMarketplaceStore`: Supabase's real builder generics trip
 * TypeScript's deep-instantiation limit when matched structurally.
 */
export function supabasePricingStore(client: unknown): PricingStore {
  const c = client as SupabaseLikeClient;
  return {
    async snapshotsForFingerprint(fingerprint, limit = 100) {
      const { data, error } = await c
        .from('price_snapshots')
        .select(
          'id, fingerprint, provider, price_amount, currency, url, captured_at',
        )
        .eq('fingerprint', fingerprint)
        .order('captured_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as PriceSnapshot[];
    },
  };
}
