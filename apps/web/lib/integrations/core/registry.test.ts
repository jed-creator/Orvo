import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationRegistry } from './registry';
import type { IntegrationAdapter } from './adapter.interface';

const fakeRestaurant: IntegrationAdapter = {
  key: 'fake-rest',
  category: 'restaurants',
  displayName: 'Fake Restaurant Provider',
  capabilities: ['search', 'details'],
  async search() {
    return [];
  },
  async getDetails() {
    return {
      provider: 'fake-rest',
      externalId: 'x',
      title: 'Test',
      category: 'restaurants',
    };
  },
};

const fakeRideshare: IntegrationAdapter = {
  key: 'fake-ride',
  category: 'rideshare',
  displayName: 'Fake Rideshare',
  capabilities: ['search', 'details'],
  async search() {
    return [];
  },
  async getDetails() {
    return {
      provider: 'fake-ride',
      externalId: 'y',
      title: 'Ride',
      category: 'rideshare',
    };
  },
};

describe('IntegrationRegistry', () => {
  let reg: IntegrationRegistry;
  beforeEach(() => {
    reg = new IntegrationRegistry();
  });

  it('registers and resolves adapters by key', () => {
    reg.register(fakeRestaurant);
    expect(reg.get('fake-rest')).toBe(fakeRestaurant);
  });

  it('returns undefined for unknown keys', () => {
    expect(reg.get('nonexistent')).toBeUndefined();
  });

  it('lists adapters by category', () => {
    reg.register(fakeRestaurant);
    reg.register(fakeRideshare);
    expect(reg.byCategory('restaurants')).toHaveLength(1);
    expect(reg.byCategory('rideshare')).toHaveLength(1);
    expect(reg.byCategory('tickets')).toHaveLength(0);
  });

  it('lists all registered adapters', () => {
    reg.register(fakeRestaurant);
    reg.register(fakeRideshare);
    expect(reg.list()).toHaveLength(2);
  });

  it('throws on duplicate key', () => {
    reg.register(fakeRestaurant);
    expect(() => reg.register(fakeRestaurant)).toThrow(/already registered/);
  });

  it('throws when registering an adapter with an empty key', () => {
    const bad = { ...fakeRestaurant, key: '' };
    expect(() => reg.register(bad)).toThrow();
  });

  it('has a global singleton exported as integrationRegistry', async () => {
    const mod = await import('./registry');
    expect(mod.integrationRegistry).toBeInstanceOf(IntegrationRegistry);
  });
});
