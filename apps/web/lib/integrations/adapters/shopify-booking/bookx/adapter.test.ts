import { describe, it, expect } from 'vitest';
import { bookxAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('bookxAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(bookxAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await bookxAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(bookxAdapter.getDetails('x')).rejects.toThrow();
  });
});
