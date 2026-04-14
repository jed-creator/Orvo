import { describe, it, expect } from 'vitest';
import { assertAdapterConforms } from './conformance';
import type { IntegrationAdapter } from './adapter.interface';

const good: IntegrationAdapter = {
  key: 'good',
  category: 'restaurants',
  displayName: 'Good',
  capabilities: ['search', 'details'],
  async search() {
    return [];
  },
  async getDetails() {
    return {
      provider: 'good',
      externalId: 'x',
      title: 'T',
      category: 'restaurants',
    };
  },
};

describe('assertAdapterConforms', () => {
  it('accepts a valid minimal adapter', () => {
    expect(() => assertAdapterConforms(good)).not.toThrow();
  });

  it('accepts an adapter with every capability implemented', () => {
    const full: IntegrationAdapter = {
      ...good,
      capabilities: ['search', 'details', 'availability', 'book', 'cancel', 'webhook'],
      async checkAvailability() {
        return [];
      },
      async book() {
        return { externalBookingId: 'b1', status: 'confirmed' };
      },
      async cancel() {
        return { status: 'cancelled' };
      },
      async handleWebhook() {
        return;
      },
    };
    expect(() => assertAdapterConforms(full)).not.toThrow();
  });

  it('rejects an adapter missing key', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertAdapterConforms({ ...good, key: '' } as any)
    ).toThrow(/key/i);
  });

  it('rejects an adapter missing displayName', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertAdapterConforms({ ...good, displayName: '' } as any)
    ).toThrow(/displayName/i);
  });

  it('rejects an unknown category', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertAdapterConforms({ ...good, category: 'nonsense' } as any)
    ).toThrow();
  });

  it('rejects an unknown capability', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertAdapterConforms({ ...good, capabilities: ['???'] } as any)
    ).toThrow();
  });

  it('rejects an adapter that declares "book" but does not implement it', () => {
    const bad: IntegrationAdapter = {
      ...good,
      capabilities: ['search', 'details', 'book'],
    };
    expect(() => assertAdapterConforms(bad)).toThrow(/book/i);
  });

  it('rejects an adapter that implements "book" without declaring the capability', () => {
    const sneaky: IntegrationAdapter = {
      ...good,
      capabilities: ['search', 'details'],
      async book() {
        return { externalBookingId: 'b1', status: 'confirmed' };
      },
    };
    expect(() => assertAdapterConforms(sneaky)).toThrow(/book/i);
  });
});
