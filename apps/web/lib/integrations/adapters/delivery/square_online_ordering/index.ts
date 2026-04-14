/**
 * Square Online Ordering adapter (stub).
 *
 * Square Online Ordering is Square's restaurant-specific online
 * ordering/delivery product, distinct from the general Square Online
 * store builder (see `adapters/ecommerce/square_online`). PDF Appendix
 * A lists both as separate platforms under Food Delivery & Takeout and
 * E-commerce Platforms respectively.
 *
 * Minimum-viable implementation — declares `search` + `details`
 * capabilities, returns an empty search result set, and throws on
 * `getDetails`. This exists so the registry can list Square Online
 * Ordering as a known provider while the real connector is being
 * negotiated.
 */
import type { IntegrationAdapter } from '../../../core';

export const squareOnlineOrderingAdapter: IntegrationAdapter = {
  key: 'square_online_ordering',
  category: 'delivery',
  displayName: 'Square Online Ordering',
  capabilities: ['search', 'details'],

  async search() {
    return [];
  },

  async getDetails() {
    throw new Error('Square Online Ordering adapter: not implemented');
  },
};
