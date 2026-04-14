import { describe, it, expect } from 'vitest';
import { freshaAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('freshaAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(freshaAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await freshaAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(freshaAdapter.getDetails('x')).rejects.toThrow();
  });
});
