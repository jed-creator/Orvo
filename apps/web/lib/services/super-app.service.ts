/**
 * Super-app categories service — reads `super_app_categories` (see
 * migration 005, section 10) and falls back to a compiled-in copy
 * of the seed when the DB is unreachable or empty. The fallback
 * exists so the Explore hub page still renders a full 2×N grid in
 * Playwright smoke runs that don't hit a real Supabase instance.
 *
 * The fallback is kept in lockstep with the `INSERT` in
 * `db/migrations/005_super_app_expansion.sql` — if you change the
 * seed, update this list too (and bump the test).
 */

export interface SuperAppCategory {
  key: string;
  title: string;
  icon: string | null;
  sort_order: number;
  enabled: boolean;
}

export const SUPER_APP_CATEGORIES_FALLBACK: readonly SuperAppCategory[] = [
  {
    key: 'shop',
    title: 'Shop',
    icon: 'shopping-bag',
    sort_order: 10,
    enabled: true,
  },
  {
    key: 'eat',
    title: 'Eat',
    icon: 'utensils',
    sort_order: 20,
    enabled: true,
  },
  { key: 'ride', title: 'Ride', icon: 'car', sort_order: 30, enabled: true },
  {
    key: 'trips',
    title: 'Trips',
    icon: 'plane',
    sort_order: 40,
    enabled: true,
  },
  {
    key: 'tickets',
    title: 'Tickets',
    icon: 'ticket',
    sort_order: 50,
    enabled: true,
  },
  {
    key: 'market',
    title: 'Market',
    icon: 'store',
    sort_order: 60,
    enabled: true,
  },
  {
    key: 'book',
    title: 'Book',
    icon: 'calendar',
    sort_order: 70,
    enabled: true,
  },
  {
    key: 'compare',
    title: 'Compare',
    icon: 'bar-chart',
    sort_order: 80,
    enabled: true,
  },
] as const;

/**
 * Maps a category key to a route path. Every scaffolded super-app
 * module routes to its own `/<key>` landing page. `/services` is a
 * merchant-dashboard route and must NOT be reachable from the
 * consumer-facing super-app nav — `book` gets its own `/book` page
 * (see `app/(book)/book/page.tsx`).
 */
export function hrefForCategory(key: string): string {
  return `/${key}`;
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
        ) => Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

/**
 * Reads enabled categories from the DB and falls back to the
 * compiled-in seed on any failure (error, empty result, or thrown
 * exception). The fallback keeps the Explore hub deterministic and
 * renderable even in environments without Supabase — Playwright CI,
 * local dev without env vars, etc.
 */
export async function fetchSuperAppCategories(
  client: unknown,
): Promise<SuperAppCategory[]> {
  try {
    const c = client as SupabaseLikeClient;
    const { data, error } = await c
      .from('super_app_categories')
      .select('key, title, icon, sort_order, enabled')
      .eq('enabled', true)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) {
      return [...SUPER_APP_CATEGORIES_FALLBACK];
    }
    return data as unknown as SuperAppCategory[];
  } catch {
    return [...SUPER_APP_CATEGORIES_FALLBACK];
  }
}
