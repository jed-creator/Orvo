/**
 * Airbnb adapter (stub).
 *
 * Minimum-viable implementation — declares `search` + `details`
 * capabilities, returns an empty search result set, and throws on
 * `getDetails`. This exists so the registry can list Airbnb
 * as a known provider while the real connector is being negotiated.
 * Replace the method bodies (and expand capabilities) when a real
 * client lands.
 */
import type { IntegrationAdapter } from '../../../core';

export const airbnbAdapter: IntegrationAdapter = {
  key: 'airbnb',
  category: 'travel',
  displayName: 'Airbnb',
  capabilities: ['search', 'details'],

  async search() {
    return [];
  },

  async getDetails() {
    throw new Error('Airbnb adapter: not implemented');
  },
};
