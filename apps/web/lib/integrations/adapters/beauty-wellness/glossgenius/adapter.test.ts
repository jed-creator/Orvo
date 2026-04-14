import { describe, it, expect } from 'vitest';
import { glossgeniusAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('glossgeniusAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(glossgeniusAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await glossgeniusAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(glossgeniusAdapter.getDetails('x')).rejects.toThrow();
  });
});
