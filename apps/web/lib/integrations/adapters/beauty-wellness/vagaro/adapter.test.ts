import { describe, it, expect } from 'vitest';
import { vagaroAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('vagaroAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(vagaroAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await vagaroAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(vagaroAdapter.getDetails('x')).rejects.toThrow();
  });
});
