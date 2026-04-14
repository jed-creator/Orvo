import { describe, it, expect } from 'vitest';
import { boulevardAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('boulevardAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(boulevardAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await boulevardAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(boulevardAdapter.getDetails('x')).rejects.toThrow();
  });
});
