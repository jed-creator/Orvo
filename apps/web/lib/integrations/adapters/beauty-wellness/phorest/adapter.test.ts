import { describe, it, expect } from 'vitest';
import { phorestAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('phorestAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(phorestAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await phorestAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(phorestAdapter.getDetails('x')).rejects.toThrow();
  });
});
