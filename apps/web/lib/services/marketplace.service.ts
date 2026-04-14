/**
 * Marketplace service — thin wrapper over `marketplace_listings`.
 *
 * The service is decoupled from any specific Supabase helper so
 * route handlers inject a client they've already authenticated, and
 * tests can inject a hand-rolled fake (see `route.test.ts`). The
 * minimal store interface below is the full set of DB calls the
 * scaffold needs.
 *
 * Fields use snake_case because that's the table shape — consumers
 * that need camelCase can map at the client edge.
 */

export interface CreateListingInput {
  kind: 'item' | 'service';
  title: string;
  description: string;
  priceCents: number;
  currency: string;
}

export type CreateListingValidation =
  | { ok: true }
  | { ok: false; reason: 'missing-title' | 'bad-kind' | 'bad-price' };

export function validateCreateListing(
  input: Partial<CreateListingInput>,
): CreateListingValidation {
  if (!input.title || input.title.trim() === '') {
    return { ok: false, reason: 'missing-title' };
  }
  if (input.kind !== 'item' && input.kind !== 'service') {
    return { ok: false, reason: 'bad-kind' };
  }
  if (typeof input.priceCents !== 'number' || input.priceCents < 0) {
    return { ok: false, reason: 'bad-price' };
  }
  return { ok: true };
}

/**
 * Narrow interface over the Supabase client — only the methods the
 * marketplace route uses. Keeps test doubles small and lets us pass
 * either the real `createServerClient()` return value or a fake.
 */
export interface MarketplaceStore {
  listActive(limit?: number): Promise<Array<Record<string, unknown>>>;
  insertListing(
    sellerUserId: string,
    input: CreateListingInput,
  ): Promise<Record<string, unknown>>;
}

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
    insert: (row: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

/**
 * Wraps a Supabase-shaped client into the narrow `MarketplaceStore`
 * interface. The route handler builds one per request.
 *
 * The parameter is typed as `unknown` because Supabase's real client
 * exposes a `PostgrestFilterBuilder` that is thenable but not a full
 * `Promise`, and the generics are deep enough to trip
 * `Type instantiation is excessively deep` when we try to match it
 * structurally against `SupabaseLikeClient`. Casting once inside the
 * function keeps the internal code type-safe against our narrow
 * interface while letting both the real client and test fakes pass
 * at the call site.
 */
export function supabaseMarketplaceStore(client: unknown): MarketplaceStore {
  const c = client as SupabaseLikeClient;
  return {
    async listActive(limit = 50) {
      const { data, error } = await c
        .from('marketplace_listings')
        .select(
          'id, kind, title, description, price_amount, currency, status, created_at, seller_user_id',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async insertListing(sellerUserId, input) {
      const { data, error } = await c
        .from('marketplace_listings')
        .insert({
          seller_user_id: sellerUserId,
          kind: input.kind,
          title: input.title,
          description: input.description,
          price_amount: input.priceCents,
          currency: input.currency,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Insert returned no row');
      return data;
    },
  };
}
