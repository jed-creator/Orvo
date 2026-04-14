/**
 * Ride service — collects quotes from every registered rideshare
 * adapter for a given pickup/dropoff pair.
 *
 * Each adapter's `search` is used as the quote primitive: the
 * reference Uber adapter returns one NormalizedSearchResult per
 * product variant (UberX, XL, Comfort, Black, Green), each carrying a
 * price. Stub adapters return [] until they're filled in. That makes
 * this service a thin fan-out today and a real multi-provider quote
 * flow later without changing the shape.
 */
import { integrationRegistry } from '@/lib/integrations/core';
import type { NormalizedSearchResult } from '@/lib/integrations/core';

export interface RideQuoteRequest {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

export async function quoteRide(
  req: RideQuoteRequest,
): Promise<NormalizedSearchResult[]> {
  const adapters = integrationRegistry
    .list()
    .filter((a) => a.category === 'rideshare');

  const settled = await Promise.allSettled(
    adapters.map((a) =>
      a.search({
        text: 'ride',
        near: req.pickup,
      }),
    ),
  );

  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
