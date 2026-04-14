import { describe, it, expect } from 'vitest';
import { PriceSnapshotSchema, PriceComparisonResultSchema } from './pricing';

describe('pricing schemas', () => {
  it('parses a price snapshot', () => {
    const s = PriceSnapshotSchema.parse({
      id: 's_1',
      fingerprint: 'sha256:hoodie-blue-xl',
      provider: 'shopify',
      price: { amount: 4999, currency: 'USD' },
      url: 'https://shop.example.com/hoodie',
      capturedAt: '2026-04-14T12:00:00Z',
    });
    expect(s.provider).toBe('shopify');
    expect(s.price.amount).toBe(4999);
  });

  it('rejects a snapshot with a bad URL', () => {
    expect(() =>
      PriceSnapshotSchema.parse({
        id: 's_1',
        fingerprint: 'sha256:hoodie-blue-xl',
        provider: 'shopify',
        price: { amount: 4999, currency: 'USD' },
        url: 'not-a-url',
        capturedAt: '2026-04-14T12:00:00Z',
      })
    ).toThrow();
  });

  it('rejects a snapshot with a bad capturedAt', () => {
    expect(() =>
      PriceSnapshotSchema.parse({
        id: 's_1',
        fingerprint: 'sha256:hoodie-blue-xl',
        provider: 'shopify',
        price: { amount: 4999, currency: 'USD' },
        url: 'https://shop.example.com/hoodie',
        capturedAt: 'recently',
      })
    ).toThrow();
  });

  it('parses a comparison result with multiple offers', () => {
    const r = PriceComparisonResultSchema.parse({
      fingerprint: 'sha256:hoodie-blue-xl',
      best: {
        id: 's_1',
        fingerprint: 'sha256:hoodie-blue-xl',
        provider: 'shopify',
        price: { amount: 3999, currency: 'USD' },
        url: 'https://shop-a.example.com/hoodie',
        capturedAt: '2026-04-14T12:00:00Z',
      },
      offers: [
        {
          id: 's_1',
          fingerprint: 'sha256:hoodie-blue-xl',
          provider: 'shopify',
          price: { amount: 3999, currency: 'USD' },
          url: 'https://shop-a.example.com/hoodie',
          capturedAt: '2026-04-14T12:00:00Z',
        },
        {
          id: 's_2',
          fingerprint: 'sha256:hoodie-blue-xl',
          provider: 'woocommerce',
          price: { amount: 5499, currency: 'USD' },
          url: 'https://shop-b.example.com/hoodie',
          capturedAt: '2026-04-14T12:00:00Z',
        },
      ],
      spread: { amount: 1500, currency: 'USD' },
      capturedAt: '2026-04-14T12:00:00Z',
    });
    expect(r.best.provider).toBe('shopify');
    expect(r.offers).toHaveLength(2);
    expect(r.spread.amount).toBe(1500);
  });

  it('accepts a comparison result with a single offer (zero spread)', () => {
    const r = PriceComparisonResultSchema.parse({
      fingerprint: 'sha256:hoodie-blue-xl',
      best: {
        id: 's_1',
        fingerprint: 'sha256:hoodie-blue-xl',
        provider: 'shopify',
        price: { amount: 4999, currency: 'USD' },
        url: 'https://shop.example.com/hoodie',
        capturedAt: '2026-04-14T12:00:00Z',
      },
      offers: [
        {
          id: 's_1',
          fingerprint: 'sha256:hoodie-blue-xl',
          provider: 'shopify',
          price: { amount: 4999, currency: 'USD' },
          url: 'https://shop.example.com/hoodie',
          capturedAt: '2026-04-14T12:00:00Z',
        },
      ],
      spread: { amount: 0, currency: 'USD' },
      capturedAt: '2026-04-14T12:00:00Z',
    });
    expect(r.offers).toHaveLength(1);
    expect(r.spread.amount).toBe(0);
  });
});
