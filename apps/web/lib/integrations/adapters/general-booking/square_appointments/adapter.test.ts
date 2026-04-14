import { describe, it, expect } from 'vitest';
import { squareAppointmentsAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('squareAppointmentsAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(squareAppointmentsAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await squareAppointmentsAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(squareAppointmentsAdapter.getDetails('x')).rejects.toThrow();
  });
});
