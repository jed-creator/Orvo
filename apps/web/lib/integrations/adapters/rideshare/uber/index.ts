/**
 * Uber reference adapter (mock mode).
 *
 * Returns the Uber product catalogue (UberX/XL/Comfort/Black/Green) with
 * fares computed from a flat base × product multiplier. Used as the
 * reference for rideshare until connector credentials land.
 */
import type { IntegrationAdapter } from '../../../core';
import { MockUberClient } from './client';
import { toNormalized } from './mapper';

const client = new MockUberClient();

export const uberAdapter: IntegrationAdapter = {
  key: 'uber',
  category: 'rideshare',
  displayName: 'Uber',
  capabilities: ['search', 'details', 'availability', 'book', 'cancel'],

  async search() {
    // Uber search is "show me products I can request right now" — the
    // catalogue is fixed, but real API calls honor the rider's pickup
    // coordinates. The mock ignores them.
    const products = await client.listProducts();
    return products.map(toNormalized);
  },

  async getDetails(externalId) {
    const row = await client.getProduct(externalId);
    return toNormalized(row);
  },

  async checkAvailability(q) {
    return client.getEtas(q.externalId, q.date);
  },

  async book({ externalId, slotId, userId }) {
    return client.requestRide(externalId, slotId, userId);
  },

  async cancel(externalBookingId) {
    return client.cancelRide(externalBookingId);
  },
};
