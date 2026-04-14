import { describe, it, expect } from 'vitest';
import { tripComAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('tripComAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(tripComAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await tripComAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(tripComAdapter.getDetails('x')).rejects.toThrow();
  });
});
