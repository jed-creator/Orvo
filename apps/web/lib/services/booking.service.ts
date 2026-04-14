/**
 * Booking service — fans out a bookable-service search across the
 * seven appointment-oriented integration categories:
 * `beauty-wellness` (salons, spas, nail techs…),
 * `medspa` (injectables, laser, aesthetics…),
 * `fitness` (studios, trainers, yoga…),
 * `general-booking` (consultants, tutors, coaches…),
 * `shopify-booking` (Shopify merchants with booking apps),
 * `home-services` (Thumbtack, TaskRabbit, Angi, Bark),
 * `pet-care` (Rover, Wag).
 *
 * The /book landing page presents all verticals in a single results
 * list by default, with optional sub-filter tabs so a user can narrow
 * to e.g. "home-services" only. `BOOK_SUB_FILTERS` is the UI-facing
 * vocabulary — an ordered array of `{ key, label, categories }` that
 * the page renders as tabs. `all` means no filter, `beauty` groups
 * beauty + medspa + fitness (the "personal care" umbrella), and each
 * other entry is a 1-to-1 passthrough to its category.
 *
 * `Promise.allSettled` keeps one misbehaving adapter from breaking the
 * whole fan-out. Mirrors `eat.service.ts` — the pattern is
 * intentionally duplicated rather than abstracted so each module can
 * evolve its category list independently.
 */
import { integrationRegistry } from '@/lib/integrations/core';
import type {
  IntegrationCategory,
  NormalizedSearchResult,
} from '@/lib/integrations/core';

const BOOK_CATEGORIES: IntegrationCategory[] = [
  'beauty-wellness',
  'medspa',
  'fitness',
  'general-booking',
  'shopify-booking',
  'home-services',
  'pet-care',
];

export interface BookSubFilter {
  /** URL-safe slug. `all` means no filter. */
  key: string;
  /** Human label for the tab. */
  label: string;
  /**
   * Which integration categories this filter resolves to. Empty array
   * means "all of BOOK_CATEGORIES".
   */
  categories: IntegrationCategory[];
}

/**
 * Ordered list of sub-filter tabs for the /book page. Render in this
 * order; the first entry (`all`) is the default.
 */
export const BOOK_SUB_FILTERS: readonly BookSubFilter[] = [
  { key: 'all', label: 'All', categories: [] },
  {
    key: 'beauty',
    label: 'Beauty & wellness',
    categories: ['beauty-wellness', 'medspa'],
  },
  { key: 'fitness', label: 'Fitness', categories: ['fitness'] },
  {
    key: 'general-booking',
    label: 'General',
    categories: ['general-booking', 'shopify-booking'],
  },
  {
    key: 'home-services',
    label: 'Home services',
    categories: ['home-services'],
  },
  { key: 'pet-care', label: 'Pet care', categories: ['pet-care'] },
];

/**
 * Resolve a sub-filter key to the categories it targets. Unknown or
 * empty keys fall back to the full BOOK_CATEGORIES list (the "all" tab
 * behavior), so callers never have to special-case missing input.
 */
export function resolveBookFilter(
  key: string | undefined,
): IntegrationCategory[] {
  if (!key || key === 'all') return BOOK_CATEGORIES;
  const match = BOOK_SUB_FILTERS.find((f) => f.key === key);
  if (!match || match.categories.length === 0) return BOOK_CATEGORIES;
  return match.categories;
}

export async function searchBookableServices(
  query: string,
  filterKey?: string,
): Promise<NormalizedSearchResult[]> {
  const categories = resolveBookFilter(filterKey);

  const adapters = integrationRegistry
    .list()
    .filter((a) => categories.includes(a.category));

  const settled = await Promise.allSettled(
    adapters.map((a) => a.search({ text: query })),
  );

  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
