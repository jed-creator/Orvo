import { describe, it, expect } from 'vitest';
import { kayakAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('kayakAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(kayakAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await kayakAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(kayakAdapter.getDetails('x')).rejects.toThrow();
  });
});
