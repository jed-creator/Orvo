import { describe, it, expect } from 'vitest';
import { simplybookAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('simplybookAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(simplybookAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await simplybookAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(simplybookAdapter.getDetails('x')).rejects.toThrow();
  });
});
