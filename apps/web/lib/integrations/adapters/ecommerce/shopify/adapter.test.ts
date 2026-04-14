import { describe, it, expect } from 'vitest';
import { shopifyAdapter } from './index';
import {
  assertAdapterConforms,
  NormalizedSearchResultSchema,
} from '../../../core';

describe('shopifyAdapter', () => {
  it('conforms to the adapter contract', () => {
    expect(() => assertAdapterConforms(shopifyAdapter)).not.toThrow();
  });

  it('declares the expected capabilities (search, details, webhook)', () => {
    expect(shopifyAdapter.key).toBe('shopify');
    expect(shopifyAdapter.category).toBe('ecommerce');
    expect(shopifyAdapter.capabilities).toEqual(
      expect.arrayContaining(['search', 'details', 'webhook'])
    );
    // Mock Shopify does not wire booking flows — those don't exist for
    // retail anyway.
    expect(shopifyAdapter.capabilities).not.toContain('availability');
    expect(shopifyAdapter.capabilities).not.toContain('book');
    expect(shopifyAdapter.capabilities).not.toContain('cancel');
  });

  it('search() returns products whose title matches the query', async () => {
    const results = await shopifyAdapter.search({ text: 'hoodie' });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(() => NormalizedSearchResultSchema.parse(r)).not.toThrow();
      expect(r.provider).toBe('shopify');
      expect(r.category).toBe('ecommerce');
      expect(r.price).toBeDefined();
    }
    expect(results.some((r) => /hoodie/i.test(r.title))).toBe(true);
  });

  it('search() returns an empty array when nothing matches', async () => {
    const results = await shopifyAdapter.search({ text: 'zz-no-such-product' });
    expect(results).toEqual([]);
  });

  it('getDetails() returns a product for a known externalId', async () => {
    const details = await shopifyAdapter.getDetails('gid://shopify/Product/1001');
    expect(() => NormalizedSearchResultSchema.parse(details)).not.toThrow();
    expect(details.externalId).toBe('gid://shopify/Product/1001');
  });

  it('getDetails() throws for an unknown externalId', async () => {
    await expect(
      shopifyAdapter.getDetails('gid://shopify/Product/nope')
    ).rejects.toThrow();
  });

  it('handleWebhook() accepts a valid JSON payload without throwing', async () => {
    const payload = { id: 1001, event: 'products/update' };
    await expect(
      shopifyAdapter.handleWebhook!(payload, 'sha256=fake-signature')
    ).resolves.toBeUndefined();
  });

  it('handleWebhook() throws when the payload is not an object', async () => {
    await expect(
      shopifyAdapter.handleWebhook!('not-an-object' as unknown)
    ).rejects.toThrow();
  });
});
