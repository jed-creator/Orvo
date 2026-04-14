import { describe, it, expect } from 'vitest';
import { zenotiAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('zenotiAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(zenotiAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await zenotiAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(zenotiAdapter.getDetails('x')).rejects.toThrow();
  });
});
