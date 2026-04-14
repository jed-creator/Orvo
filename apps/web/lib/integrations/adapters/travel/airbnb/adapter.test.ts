import { describe, it, expect } from 'vitest';
import { airbnbAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('airbnbAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(airbnbAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await airbnbAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(airbnbAdapter.getDetails('x')).rejects.toThrow();
  });
});
