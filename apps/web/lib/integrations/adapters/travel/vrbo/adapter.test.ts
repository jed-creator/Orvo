import { describe, it, expect } from 'vitest';
import { vrboAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('vrboAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(vrboAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await vrboAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(vrboAdapter.getDetails('x')).rejects.toThrow();
  });
});
