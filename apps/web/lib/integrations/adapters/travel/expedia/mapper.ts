import type { NormalizedSearchResult } from '../../../core';
import { RATE_PLANS, type HotelFixture } from './fixtures';

export function toNormalized(row: HotelFixture): NormalizedSearchResult {
  // Surface the lowest rate plan as the "starting at" price.
  const plans = RATE_PLANS[row.externalId] ?? [];
  const minPriceCents = plans.length
    ? Math.min(...plans.map((p) => p.priceCents))
    : undefined;

  return {
    provider: 'expedia',
    externalId: row.externalId,
    title: row.name,
    category: 'travel',
    subtitle: `${row.city}, ${row.country} · ${row.starRating}★`,
    media: [
      {
        url: row.imageUrl,
        kind: 'image',
        alt: row.name,
      },
    ],
    location: row.location,
    price: minPriceCents
      ? { amount: minPriceCents, currency: 'USD' }
      : undefined,
    rating: row.guestRating,
    metadata: {
      city: row.city,
      country: row.country,
      starRating: row.starRating,
    },
  };
}
