import { describe, it, expect } from 'vitest';
import { booksyAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('booksyAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(booksyAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await booksyAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(booksyAdapter.getDetails('x')).rejects.toThrow();
  });
});
