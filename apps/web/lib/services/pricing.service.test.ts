import { describe, it, expect } from 'vitest';
import {
  latestByProvider,
  selectBest,
  compareFingerprint,
  type PriceSnapshot,
  type PricingStore,
} from './pricing.service';

/**
 * Pure-function tests for the pricing helpers. The store-backed path
 * (Supabase fake + route handler) is covered in
 * `app/api/compare/route.test.ts`; this file only asserts the
 * grouping/winner logic so we can catch regressions without the
 * vi.hoisted fake-client ceremony.
 */

function snap(
  provider: string,
  price: number,
  capturedAt: string,
  id = `${provider}-${capturedAt}`,
): PriceSnapshot {
  return {
    id,
    fingerprint: 'fp-1',
    provider,
    price_amount: price,
    currency: 'USD',
    url: `https://${provider}.test/${id}`,
    captured_at: capturedAt,
  };
}

describe('latestByProvider', () => {
  it('returns an empty array for empty input', () => {
    expect(latestByProvider([])).toEqual([]);
  });

  it('keeps one row per provider and trusts DESC ordering', () => {
    const rows = [
      snap('amazon', 2500, '2026-04-14T12:00:00Z'),
      snap('amazon', 2499, '2026-04-14T10:00:00Z'),
      snap('walmart', 2600, '2026-04-14T09:00:00Z'),
    ];
    const result = latestByProvider(rows);
    expect(result).toHaveLength(2);
    const amazon = result.find((r) => r.provider === 'amazon');
    // First row (DESC) wins even if a later row was cheaper.
    expect(amazon?.price_amount).toBe(2500);
  });

  it('omits fingerprint/id from the projected row', () => {
    const rows = [snap('amazon', 2500, '2026-04-14T12:00:00Z')];
    const result = latestByProvider(rows)[0];
    expect(result).not.toHaveProperty('fingerprint');
    expect(result).not.toHaveProperty('id');
    expect(result.provider).toBe('amazon');
  });
});

describe('selectBest', () => {
  it('returns null for empty input', () => {
    expect(selectBest([])).toBeNull();
  });

  it('picks the lowest price_amount', () => {
    const best = selectBest([
      {
        provider: 'amazon',
        price_amount: 2500,
        currency: 'USD',
        url: '',
        captured_at: '',
      },
      {
        provider: 'walmart',
        price_amount: 2499,
        currency: 'USD',
        url: '',
        captured_at: '',
      },
      {
        provider: 'target',
        price_amount: 2550,
        currency: 'USD',
        url: '',
        captured_at: '',
      },
    ]);
    expect(best?.provider).toBe('walmart');
  });

  it('returns the single row when there is only one provider', () => {
    const best = selectBest([
      {
        provider: 'amazon',
        price_amount: 2500,
        currency: 'USD',
        url: '',
        captured_at: '',
      },
    ]);
    expect(best?.provider).toBe('amazon');
  });
});

describe('compareFingerprint', () => {
  function makeStore(rows: PriceSnapshot[]): PricingStore {
    return {
      async snapshotsForFingerprint() {
        return rows;
      },
    };
  }

  it('returns empty snapshots/byProvider and null best when the store is empty', async () => {
    const result = await compareFingerprint(makeStore([]), 'fp-1');
    expect(result.snapshots).toEqual([]);
    expect(result.byProvider).toEqual([]);
    expect(result.best).toBeNull();
  });

  it('wires fetch → group → best end-to-end', async () => {
    const store = makeStore([
      snap('amazon', 2500, '2026-04-14T12:00:00Z'),
      snap('walmart', 2499, '2026-04-14T11:00:00Z'),
      snap('target', 2550, '2026-04-14T10:00:00Z'),
    ]);
    const result = await compareFingerprint(store, 'fp-1');
    expect(result.fingerprint).toBe('fp-1');
    expect(result.byProvider).toHaveLength(3);
    expect(result.best?.provider).toBe('walmart');
  });
});
