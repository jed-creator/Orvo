import type { NormalizedSearchResult } from '../../../core';
import type { ShopifyProductFixture } from './fixtures';

export function toNormalized(row: ShopifyProductFixture): NormalizedSearchResult {
  return {
    provider: 'shopify',
    externalId: row.id,
    title: row.title,
    category: 'ecommerce',
    subtitle: row.vendor,
    media: [
      {
        url: row.imageUrl,
        kind: 'image',
        alt: row.title,
      },
    ],
    price: {
      amount: row.priceCents,
      currency: 'USD',
    },
    rating: row.rating,
    url: `https://example.myshopify.com/products/${row.handle}`,
    metadata: {
      vendor: row.vendor,
      description: row.description,
    },
  };
}
