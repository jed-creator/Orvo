import { describe, it, expect } from 'vitest';
import { acuityAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('acuityAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(acuityAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await acuityAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(acuityAdapter.getDetails('x')).rejects.toThrow();
  });
});
