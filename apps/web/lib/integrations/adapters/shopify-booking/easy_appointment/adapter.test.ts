import { describe, it, expect } from 'vitest';
import { easyAppointmentAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('easyAppointmentAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(easyAppointmentAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await easyAppointmentAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(easyAppointmentAdapter.getDetails('x')).rejects.toThrow();
  });
});
