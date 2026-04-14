import { describe, it, expect } from 'vitest';
import { setmoreAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('setmoreAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(setmoreAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await setmoreAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(setmoreAdapter.getDetails('x')).rejects.toThrow();
  });
});
