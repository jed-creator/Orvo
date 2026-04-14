/**
 * SimplyBook.me adapter (stub).
 *
 * Minimum-viable implementation — declares `search` + `details`
 * capabilities, returns an empty search result set, and throws on
 * `getDetails`. This exists so the registry can list SimplyBook.me
 * as a known provider while the real connector is being negotiated.
 * Replace the method bodies (and expand capabilities) when a real
 * client lands.
 */
import type { IntegrationAdapter } from '../../../core';

export const simplybookAdapter: IntegrationAdapter = {
  key: 'simplybook',
  category: 'general-booking',
  displayName: 'SimplyBook.me',
  capabilities: ['search', 'details'],

  async search() {
    return [];
  },

  async getDetails() {
    throw new Error('SimplyBook.me adapter: not implemented');
  },
};
