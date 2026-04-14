import { describe, it, expect } from 'vitest';
import { bookingComAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('bookingComAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(bookingComAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await bookingComAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(bookingComAdapter.getDetails('x')).rejects.toThrow();
  });
});
