import { describe, it, expect } from 'vitest';
import { skyscannerAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('skyscannerAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(skyscannerAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await skyscannerAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(skyscannerAdapter.getDetails('x')).rejects.toThrow();
  });
});
