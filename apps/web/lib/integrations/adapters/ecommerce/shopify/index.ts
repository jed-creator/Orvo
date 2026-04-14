/**
 * Shopify reference adapter (mock mode).
 *
 * Shopify only exposes `search`, `details`, and `webhook` — booking is
 * not a retail concept, and direct purchases go through the merchant's
 * own checkout flow, not Orvo. The webhook handler accepts product
 * update events so downstream code can refresh the Explore hub cache
 * when a merchant changes inventory.
 *
 * Running in mock mode: the client returns hard-coded products. When
 * a real Shopify token lands, swap `client.ts` for one that hits
 * `https://{shop}.myshopify.com/api/2024-07/graphql.json` with the
 * `X-Shopify-Storefront-Access-Token` header — the adapter index
 * doesn't need to change.
 */
import type { IntegrationAdapter } from '../../../core';
import { MockShopifyClient } from './client';
import { toNormalized } from './mapper';

const client = new MockShopifyClient();

export const shopifyAdapter: IntegrationAdapter = {
  key: 'shopify',
  category: 'ecommerce',
  displayName: 'Shopify',
  capabilities: ['search', 'details', 'webhook'],

  async search(q) {
    const rows = await client.searchProducts(q.text);
    return rows.map(toNormalized);
  },

  async getDetails(externalId) {
    const row = await client.getProduct(externalId);
    return toNormalized(row);
  },

  async handleWebhook(payload) {
    // The real handler would verify `signature` against the
    // SHOPIFY_WEBHOOK_SECRET, then dispatch by topic. The mock just
    // validates shape so callers that pass garbage get a clear error.
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Shopify webhook: payload must be an object');
    }
    // No-op in mock mode — a real implementation would invalidate the
    // product cache for the affected merchant.
  },
};
