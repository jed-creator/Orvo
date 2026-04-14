import { describe, it, expect } from 'vitest';
import { calendlyAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('calendlyAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(calendlyAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await calendlyAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(calendlyAdapter.getDetails('x')).rejects.toThrow();
  });
});
