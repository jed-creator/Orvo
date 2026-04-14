import { describe, it, expect } from 'vitest';
import { lyftAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('lyftAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(lyftAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await lyftAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(lyftAdapter.getDetails('x')).rejects.toThrow();
  });
});
