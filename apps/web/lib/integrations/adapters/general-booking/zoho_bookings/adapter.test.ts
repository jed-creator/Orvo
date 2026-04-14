import { describe, it, expect } from 'vitest';
import { zohoBookingsAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('zohoBookingsAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(zohoBookingsAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await zohoBookingsAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(zohoBookingsAdapter.getDetails('x')).rejects.toThrow();
  });
});
