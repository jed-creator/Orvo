import { describe, it, expect } from 'vitest';
import { expediaAdapter } from './index';
import {
  assertAdapterConforms,
  NormalizedSearchResultSchema,
  SlotSchema,
} from '../../../core';

describe('expediaAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(expediaAdapter)).not.toThrow();
  });

  it('declares the expected capabilities', () => {
    expect(expediaAdapter.key).toBe('expedia');
    expect(expediaAdapter.category).toBe('travel');
    expect(expediaAdapter.capabilities).toEqual(
      expect.arrayContaining(['search', 'details', 'availability', 'book', 'cancel'])
    );
  });

  it('search() returns hotels matching the destination', async () => {
    const results = await expediaAdapter.search({ text: 'seattle' });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(() => NormalizedSearchResultSchema.parse(r)).not.toThrow();
      expect(r.provider).toBe('expedia');
      expect(r.category).toBe('travel');
      expect(r.price).toBeDefined();
    }
  });

  it('search() returns an empty array when nothing matches', async () => {
    const results = await expediaAdapter.search({ text: 'zz-no-such-city' });
    expect(results).toEqual([]);
  });

  it('getDetails() returns a hotel for a known externalId', async () => {
    const details = await expediaAdapter.getDetails('xp-hotel-monaco');
    expect(() => NormalizedSearchResultSchema.parse(details)).not.toThrow();
    expect(details.externalId).toBe('xp-hotel-monaco');
  });

  it('getDetails() throws for an unknown externalId', async () => {
    await expect(expediaAdapter.getDetails('xp-hotel-mars')).rejects.toThrow();
  });

  it('checkAvailability() returns nightly slots with price', async () => {
    const slots = await expediaAdapter.checkAvailability!({
      externalId: 'xp-hotel-monaco',
      date: '2026-05-01',
      quantity: 1,
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(() => SlotSchema.parse(s)).not.toThrow();
      expect(s.price).toBeDefined();
    }
  });

  it('book() returns a confirmed reservation', async () => {
    const booking = await expediaAdapter.book!({
      externalId: 'xp-hotel-monaco',
      slotId: 'rate-king-nonref',
      userId: 'user-abc',
    });
    expect(booking.externalBookingId).toMatch(/^xp-res-/);
    expect(booking.status).toBe('confirmed');
  });

  it('cancel() returns a cancelled status for a known reservation', async () => {
    const booking = await expediaAdapter.book!({
      externalId: 'xp-hotel-monaco',
      slotId: 'rate-king-nonref',
      userId: 'user-abc',
    });
    const result = await expediaAdapter.cancel!(booking.externalBookingId);
    expect(result.status).toBe('cancelled');
  });
});
