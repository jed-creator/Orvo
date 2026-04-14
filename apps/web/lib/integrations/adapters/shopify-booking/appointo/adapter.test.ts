import { describe, it, expect } from 'vitest';
import { appointoAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('appointoAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(appointoAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await appointoAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(appointoAdapter.getDetails('x')).rejects.toThrow();
  });
});
