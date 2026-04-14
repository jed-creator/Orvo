import { describe, it, expect } from 'vitest';
import { wixBookingsAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('wixBookingsAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(wixBookingsAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await wixBookingsAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(wixBookingsAdapter.getDetails('x')).rejects.toThrow();
  });
});
