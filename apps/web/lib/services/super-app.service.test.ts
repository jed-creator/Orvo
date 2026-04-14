import { describe, it, expect } from 'vitest';
import {
  fetchSuperAppCategories,
  hrefForCategory,
  SUPER_APP_CATEGORIES_FALLBACK,
} from './super-app.service';

/**
 * Unit tests for the super-app categories service. The service is
 * deliberately resilient — it falls back to the compiled-in seed on
 * any DB failure — so these tests exercise all four fallback paths
 * (empty data, null data, error, thrown exception) plus the happy
 * path where the DB returns real rows.
 */

function makeFakeClient(
  result:
    | {
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }
    | { throws: true },
) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => {
            if ('throws' in result) throw new Error('boom');
            return result;
          },
        }),
      }),
    }),
  };
}

describe('fetchSuperAppCategories', () => {
  it('returns DB rows when the query succeeds with data', async () => {
    const fake = makeFakeClient({
      data: [
        {
          key: 'shop',
          title: 'Shop',
          icon: 'shopping-bag',
          sort_order: 10,
          enabled: true,
        },
      ],
      error: null,
    });
    const result = await fetchSuperAppCategories(fake);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('shop');
  });

  it('falls back to the seed when the query returns null data', async () => {
    const fake = makeFakeClient({ data: null, error: null });
    const result = await fetchSuperAppCategories(fake);
    expect(result).toHaveLength(SUPER_APP_CATEGORIES_FALLBACK.length);
  });

  it('falls back to the seed when the query returns empty data', async () => {
    const fake = makeFakeClient({ data: [], error: null });
    const result = await fetchSuperAppCategories(fake);
    expect(result).toHaveLength(SUPER_APP_CATEGORIES_FALLBACK.length);
  });

  it('falls back to the seed when the query errors', async () => {
    const fake = makeFakeClient({
      data: null,
      error: { message: 'relation does not exist' },
    });
    const result = await fetchSuperAppCategories(fake);
    expect(result).toHaveLength(SUPER_APP_CATEGORIES_FALLBACK.length);
    expect(result[0].key).toBe('shop');
  });

  it('falls back to the seed when the client throws', async () => {
    const fake = makeFakeClient({ throws: true });
    const result = await fetchSuperAppCategories(fake);
    expect(result).toHaveLength(SUPER_APP_CATEGORIES_FALLBACK.length);
  });
});

describe('SUPER_APP_CATEGORIES_FALLBACK', () => {
  it('contains all 8 seeded categories in sort order', () => {
    expect(SUPER_APP_CATEGORIES_FALLBACK).toHaveLength(8);
    const keys = SUPER_APP_CATEGORIES_FALLBACK.map((c) => c.key);
    expect(keys).toEqual([
      'shop',
      'eat',
      'ride',
      'trips',
      'tickets',
      'market',
      'book',
      'compare',
    ]);
  });
});

describe('hrefForCategory', () => {
  it('routes scaffolded modules to their /<key> page', () => {
    expect(hrefForCategory('shop')).toBe('/shop');
    expect(hrefForCategory('compare')).toBe('/compare');
  });

  it('routes "book" to the consumer /book module (not /services)', () => {
    // /services is the merchant dashboard — consumers must never land
    // there from the super-app nav.
    expect(hrefForCategory('book')).toBe('/book');
    expect(hrefForCategory('book')).not.toBe('/services');
  });
});
