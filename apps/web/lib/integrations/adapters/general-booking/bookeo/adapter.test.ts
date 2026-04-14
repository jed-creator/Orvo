import { describe, it, expect } from 'vitest';
import { bookeoAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('bookeoAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(bookeoAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await bookeoAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(bookeoAdapter.getDetails('x')).rejects.toThrow();
  });
});
