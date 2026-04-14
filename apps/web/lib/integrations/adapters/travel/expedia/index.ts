/**
 * Expedia reference adapter (mock mode).
 *
 * Covers the full hotel booking lifecycle: search by destination,
 * get hotel details, list rate plans (as Slots with price), book,
 * and cancel. Fixtures are small (4 hotels, a few rate plans each)
 * but exercise the whole flow end-to-end.
 */
import type { IntegrationAdapter } from '../../../core';
import { MockExpediaClient } from './client';
import { toNormalized } from './mapper';

const client = new MockExpediaClient();

export const expediaAdapter: IntegrationAdapter = {
  key: 'expedia',
  category: 'travel',
  displayName: 'Expedia',
  capabilities: ['search', 'details', 'availability', 'book', 'cancel'],

  async search(q) {
    const rows = await client.searchHotels(q.text);
    return rows.map(toNormalized);
  },

  async getDetails(externalId) {
    const row = await client.getHotel(externalId);
    return toNormalized(row);
  },

  async checkAvailability(q) {
    return client.getRatePlans(q.externalId, q.date);
  },

  async book({ externalId, slotId, userId }) {
    return client.createReservation(externalId, slotId, userId);
  },

  async cancel(externalBookingId) {
    return client.cancelReservation(externalBookingId);
  },
};
