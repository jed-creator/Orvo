import { describe, it, expect, beforeAll } from 'vitest';
import { bootstrap } from './bootstrap';
import { IntegrationRegistry } from './core';

describe('bootstrap', () => {
  const registry = new IntegrationRegistry();

  beforeAll(() => {
    bootstrap(registry);
  });

  it('registers all 89 adapters (84 stubs + 5 references)', () => {
    expect(registry.list().length).toBe(89);
  });

  it('resolves every reference adapter by its declared key', () => {
    const referenceKeys = [
      'opentable',
      'uber',
      'shopify',
      'ticketmaster',
      'expedia',
    ] as const;

    for (const key of referenceKeys) {
      const adapter = registry.get(key);
      expect(adapter, `reference adapter "${key}" should be registered`).toBeDefined();
      expect(adapter?.key).toBe(key);
    }
  });

  it('reference adapters declare more than the interface-minimum capabilities', () => {
    // Every reference adapter implements at least one optional method
    // beyond search+details — that's what makes them "reference".
    const referenceKeys = ['opentable', 'uber', 'shopify', 'ticketmaster', 'expedia'];
    for (const key of referenceKeys) {
      const adapter = registry.get(key)!;
      const extras = adapter.capabilities.filter(
        (c) => c !== 'search' && c !== 'details'
      );
      expect(extras.length, `${key} should declare extra capabilities`).toBeGreaterThan(0);
    }
  });

  it('every category from the seeded provider list has at least one adapter', () => {
    const expectedCategories = [
      'restaurants',
      'delivery',
      'beauty-wellness',
      'medspa',
      'fitness',
      'general-booking',
      'shopify-booking',
      'travel',
      'hotel-direct',
      'experiences',
      'rideshare',
      'grocery',
      'tickets',
      'home-services',
      'pet-care',
      'ecommerce',
    ] as const;
    for (const category of expectedCategories) {
      expect(
        registry.byCategory(category).length,
        `category "${category}" should have at least one adapter`
      ).toBeGreaterThan(0);
    }
  });

  it('throws when called a second time on the same registry (duplicate keys)', () => {
    // bootstrap() is not idempotent on a single registry — the core
    // IntegrationRegistry rejects duplicate keys, which is the safety
    // net we want against accidental re-registration.
    expect(() => bootstrap(registry)).toThrow(/already registered/);
  });
});
