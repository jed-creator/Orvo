/**
 * Book That App (BTA) adapter (stub).
 *
 * Minimum-viable implementation — declares `search` + `details`
 * capabilities, returns an empty search result set, and throws on
 * `getDetails`. This exists so the registry can list Book That App (BTA)
 * as a known provider while the real connector is being negotiated.
 * Replace the method bodies (and expand capabilities) when a real
 * client lands.
 */
import type { IntegrationAdapter } from '../../../core';

export const btaAdapter: IntegrationAdapter = {
  key: 'bta',
  category: 'shopify-booking',
  displayName: 'Book That App (BTA)',
  capabilities: ['search', 'details'],

  async search() {
    return [];
  },

  async getDetails() {
    throw new Error('Book That App (BTA) adapter: not implemented');
  },
};
