import { describe, it, expect } from 'vitest';
import { uberAdapter } from './index';
import {
  assertAdapterConforms,
  NormalizedSearchResultSchema,
  SlotSchema,
} from '../../../core';

describe('uberAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(uberAdapter)).not.toThrow();
  });

  it('declares the expected capabilities', () => {
    expect(uberAdapter.key).toBe('uber');
    expect(uberAdapter.category).toBe('rideshare');
    expect(uberAdapter.capabilities).toEqual(
      expect.arrayContaining(['search', 'details', 'availability', 'book', 'cancel'])
    );
  });

  it('search() returns the Uber product catalogue as normalized results', async () => {
    const results = await uberAdapter.search({
      text: 'uber',
      near: { lat: 47.6062, lng: -122.3321 },
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(() => NormalizedSearchResultSchema.parse(r)).not.toThrow();
      expect(r.provider).toBe('uber');
      expect(r.category).toBe('rideshare');
      // Every Uber product must have a price (this is what the rider picks on).
      expect(r.price).toBeDefined();
    }
    // Catalogue must include at least UberX.
    expect(results.some((r) => /uberx/i.test(r.title))).toBe(true);
  });

  it('getDetails() returns a product for a known externalId', async () => {
    const details = await uberAdapter.getDetails('uber-x');
    expect(() => NormalizedSearchResultSchema.parse(details)).not.toThrow();
    expect(details.externalId).toBe('uber-x');
  });

  it('getDetails() throws for an unknown externalId', async () => {
    await expect(uberAdapter.getDetails('uber-moon-rover')).rejects.toThrow();
  });

  it('checkAvailability() returns ETA slots in Slot shape', async () => {
    const slots = await uberAdapter.checkAvailability!({
      externalId: 'uber-x',
      date: '2026-05-01',
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(() => SlotSchema.parse(s)).not.toThrow();
    }
  });

  it('book() returns an accepted ride with an externalBookingId', async () => {
    const booking = await uberAdapter.book!({
      externalId: 'uber-x',
      slotId: 'eta-now',
      userId: 'user-abc',
    });
    expect(booking.externalBookingId).toMatch(/^uber-ride-/);
    expect(booking.status).toBe('accepted');
  });

  it('cancel() returns a cancelled status for a known ride', async () => {
    const booking = await uberAdapter.book!({
      externalId: 'uber-x',
      slotId: 'eta-now',
      userId: 'user-abc',
    });
    const result = await uberAdapter.cancel!(booking.externalBookingId);
    expect(result.status).toBe('cancelled');
  });
});
