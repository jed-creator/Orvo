import { describe, it, expect } from 'vitest';
import { turoAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('turoAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(turoAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await turoAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(turoAdapter.getDetails('x')).rejects.toThrow();
  });
});
