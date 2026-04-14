/**
 * Booking service — fans out a bookable-service search across the
 * five appointment-oriented integration categories:
 * `beauty-wellness` (salons, spas, nail techs…),
 * `medspa` (injectables, laser, aesthetics…),
 * `fitness` (studios, trainers, yoga…),
 * `general-booking` (consultants, tutors, home-services overlap…),
 * `shopify-booking` (Shopify merchants with booking apps).
 *
 * The /book landing page presents all five verticals in a single
 * results list, so the service returns one flat array of normalized
 * providers rather than grouping by category. The client groups at
 * render time if needed.
 *
 * `Promise.allSettled` keeps one misbehaving adapter from breaking the
 * whole fan-out. Mirrors `eat.service.ts` exactly — the pattern is
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
];

export async function searchBookableServices(
  query: string,
): Promise<NormalizedSearchResult[]> {
  const adapters = integrationRegistry
    .list()
    .filter((a) => BOOK_CATEGORIES.includes(a.category));

  const settled = await Promise.allSettled(
    adapters.map((a) => a.search({ text: query })),
  );

  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
