import { describe, it, expect } from 'vitest';
import { appointyAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('appointyAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(appointyAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await appointyAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(appointyAdapter.getDetails('x')).rejects.toThrow();
  });
});
