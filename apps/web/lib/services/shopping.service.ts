/**
 * Shopping service — fans out a text search across every ecommerce
 * adapter in the integration registry and flattens the results into a
 * single normalized list.
 *
 * Consumers (the `/api/shop/search` route, server actions, etc.) call
 * `searchProducts(query)` and get a unified view of inventory across
 * Shopify, WooCommerce, BigCommerce, Square Online, and every other
 * ecommerce provider the registry knows about.
 *
 * Error handling uses `Promise.allSettled` so a single misbehaving
 * adapter can't brick the whole search — rejected fan-outs are dropped
 * silently. Observability (logging which providers failed) will come
 * later with the structured logging work planned for Phase 8.
 */
import { integrationRegistry } from '@/lib/integrations/core';
import type { NormalizedSearchResult } from '@/lib/integrations/core';

export async function searchProducts(
  query: string,
): Promise<NormalizedSearchResult[]> {
  const ecommerce = integrationRegistry
    .list()
    .filter((a) => a.category === 'ecommerce');

  const settled = await Promise.allSettled(
    ecommerce.map((a) => a.search({ text: query })),
  );

  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
