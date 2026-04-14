import { describe, it, expect } from 'vitest';
import { grabAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('grabAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(grabAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await grabAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(grabAdapter.getDetails('x')).rejects.toThrow();
  });
});
