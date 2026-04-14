/**
 * Unit tests for `booking.service.ts` — focus is the pure
 * `resolveBookFilter` helper and the shape of `BOOK_SUB_FILTERS`.
 * The actual `searchBookableServices` fan-out is exercised
 * end-to-end by `app/api/book/services/route.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import {
  BOOK_SUB_FILTERS,
  resolveBookFilter,
} from './booking.service';

const FULL_FANOUT = [
  'beauty-wellness',
  'medspa',
  'fitness',
  'general-booking',
  'shopify-booking',
  'home-services',
  'pet-care',
];

describe('BOOK_SUB_FILTERS', () => {
  it('starts with an "all" tab that targets every booking category', () => {
    expect(BOOK_SUB_FILTERS[0]?.key).toBe('all');
    expect(BOOK_SUB_FILTERS[0]?.categories).toEqual([]);
  });

  it('includes both home-services and pet-care as standalone tabs', () => {
    const keys = BOOK_SUB_FILTERS.map((f) => f.key);
    expect(keys).toContain('home-services');
    expect(keys).toContain('pet-care');
  });

  it('every filter has a human-readable label', () => {
    for (const f of BOOK_SUB_FILTERS) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe('resolveBookFilter', () => {
  it('returns the full fan-out for undefined', () => {
    expect(resolveBookFilter(undefined)).toEqual(FULL_FANOUT);
  });

  it('returns the full fan-out for "all"', () => {
    expect(resolveBookFilter('all')).toEqual(FULL_FANOUT);
  });

  it('returns the full fan-out for an unknown filter', () => {
    expect(resolveBookFilter('not-a-real-filter')).toEqual(FULL_FANOUT);
  });

  it('returns a single-category array for home-services', () => {
    expect(resolveBookFilter('home-services')).toEqual(['home-services']);
  });

  it('returns a single-category array for pet-care', () => {
    expect(resolveBookFilter('pet-care')).toEqual(['pet-care']);
  });

  it('groups beauty-wellness + medspa under the "beauty" filter', () => {
    expect(resolveBookFilter('beauty')).toEqual([
      'beauty-wellness',
      'medspa',
    ]);
  });

  it('groups general-booking + shopify-booking under "general-booking"', () => {
    expect(resolveBookFilter('general-booking')).toEqual([
      'general-booking',
      'shopify-booking',
    ]);
  });
});
