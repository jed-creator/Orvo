import { describe, it, expect } from 'vitest';
import { cowlendarAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('cowlendarAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(cowlendarAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await cowlendarAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(cowlendarAdapter.getDetails('x')).rejects.toThrow();
  });
});
