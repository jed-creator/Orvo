/**
 * Tickets service — fans a text search across every registered
 * `tickets` adapter (Ticketmaster + Eventbrite + StubHub + AXS plus
 * any future additions) and flattens the results.
 *
 * Like the other super-app services, one misbehaving adapter can't
 * brick the whole fan-out — rejected promises are dropped silently.
 */
import { integrationRegistry } from '@/lib/integrations/core';
import type { NormalizedSearchResult } from '@/lib/integrations/core';

export async function searchEvents(
  query: string,
): Promise<NormalizedSearchResult[]> {
  const adapters = integrationRegistry
    .list()
    .filter((a) => a.category === 'tickets');

  const settled = await Promise.allSettled(
    adapters.map((a) => a.search({ text: query })),
  );

  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
