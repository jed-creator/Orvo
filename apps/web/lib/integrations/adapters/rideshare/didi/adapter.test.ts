import { describe, it, expect } from 'vitest';
import { didiAdapter } from './index';
import { assertAdapterConforms } from '../../../core';

describe('didiAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(didiAdapter)).not.toThrow();
  });

  it('search() returns an empty array (stub)', async () => {
    const results = await didiAdapter.search({ text: 'anything' });
    expect(results).toEqual([]);
  });

  it('getDetails() throws (stub)', async () => {
    await expect(didiAdapter.getDetails('x')).rejects.toThrow();
  });
});
