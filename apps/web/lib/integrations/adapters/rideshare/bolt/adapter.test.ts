import { describe, it, expect } from 'vitest';
import { boltAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('boltAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(boltAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await boltAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(boltAdapter.getDetails('x')).rejects.toThrow();
  });
});
