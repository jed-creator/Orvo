import { describe, it, expect } from 'vitest';
import { meetyAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('meetyAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(meetyAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await meetyAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(meetyAdapter.getDetails('x')).rejects.toThrow();
  });
});
