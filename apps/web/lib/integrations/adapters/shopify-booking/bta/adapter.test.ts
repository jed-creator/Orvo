import { describe, it, expect } from 'vitest';
import { btaAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('btaAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(btaAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await btaAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(btaAdapter.getDetails('x')).rejects.toThrow();
  });
});
