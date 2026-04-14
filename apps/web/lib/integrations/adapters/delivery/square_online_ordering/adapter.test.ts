import { describe, it, expect } from 'vitest';
import { squareOnlineOrderingAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('squareOnlineOrderingAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() =>
      assertAdapterConforms(squareOnlineOrderingAdapter),
    ).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await squareOnlineOrderingAdapter.search({
      text: 'anything',
    });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(
      squareOnlineOrderingAdapter.getDetails('x'),
    ).rejects.toThrow();
  });
});
