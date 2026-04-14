import type { NormalizedSearchResult } from '../../../core';
import type { UberProductWithFare } from './client';

export function toNormalized(row: UberProductWithFare): NormalizedSearchResult {
  return {
    provider: 'uber',
    externalId: row.externalId,
    title: row.name,
    category: 'rideshare',
    subtitle: row.description,
    media: [
      {
        url: row.imageUrl,
        kind: 'image',
        alt: row.name,
      },
    ],
    price: {
      amount: row.fareCents,
      currency: 'USD',
    },
    metadata: {
      seats: row.seats,
    },
  };
}
