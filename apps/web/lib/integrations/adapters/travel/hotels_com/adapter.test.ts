import { describe, it, expect } from 'vitest';
import { hotelsComAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('hotelsComAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(hotelsComAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await hotelsComAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(hotelsComAdapter.getDetails('x')).rejects.toThrow();
  });
});
