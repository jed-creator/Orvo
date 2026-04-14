import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Route-level test for /api/compare. Uses the same vi.hoisted +
 * vi.mock('@/lib/supabase/server') pattern as the marketplace route
 * so the fake client state can be mutated per test.
 */
const { fakeState, fakeCreateClient } = vi.hoisted(() => {
  const state = {
    snapshots: [] as Array<Record<string, unknown>>,
    selectError: null as null | { message: string },
  };

  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: state.snapshots,
              error: state.selectError,
            }),
          }),
        }),
      }),
    }),
  };

  return {
    fakeState: state,
    fakeCreateClient: async () => client,
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: fakeCreateClient,
}));

import { GET } from './route';

function resetFakeState() {
  fakeState.snapshots = [];
  fakeState.selectError = null;
}

describe('GET /api/compare', () => {
  beforeEach(resetFakeState);

  it('returns 400 when fingerprint is missing', async () => {
    const res = await GET(new Request('http://test/api/compare'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when fingerprint is empty string', async () => {
    const res = await GET(new Request('http://test/api/compare?fingerprint='));
    expect(res.status).toBe(400);
  });

  it('returns 200 with empty results when the DB has no snapshots', async () => {
    const res = await GET(
      new Request('http://test/api/compare?fingerprint=fp-1'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      fingerprint: string;
      snapshots: unknown[];
      byProvider: unknown[];
      best: unknown;
    };
    expect(body.fingerprint).toBe('fp-1');
    expect(body.snapshots).toEqual([]);
    expect(body.byProvider).toEqual([]);
    expect(body.best).toBeNull();
  });

  it('groups by provider and picks the lowest price as best', async () => {
    fakeState.snapshots = [
      {
        id: 'snap-1',
        fingerprint: 'fp-1',
        provider: 'amazon',
        price_amount: 2500,
        currency: 'USD',
        url: 'https://amazon.test/1',
        captured_at: '2026-04-14T12:00:00Z',
      },
      {
        id: 'snap-2',
        fingerprint: 'fp-1',
        provider: 'walmart',
        price_amount: 2499,
        currency: 'USD',
        url: 'https://walmart.test/1',
        captured_at: '2026-04-14T11:00:00Z',
      },
      {
        id: 'snap-3',
        fingerprint: 'fp-1',
        provider: 'amazon',
        price_amount: 2450,
        currency: 'USD',
        url: 'https://amazon.test/2',
        captured_at: '2026-04-14T10:00:00Z',
      },
    ];
    const res = await GET(
      new Request('http://test/api/compare?fingerprint=fp-1'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      byProvider: Array<{ provider: string; price_amount: number }>;
      best: { provider: string } | null;
    };
    expect(body.byProvider).toHaveLength(2);
    // First amazon row (DESC) wins → 2500. walmart is 2499.
    expect(body.best?.provider).toBe('walmart');
  });

  it('returns 500 when the DB errors', async () => {
    fakeState.selectError = { message: 'boom' };
    const res = await GET(
      new Request('http://test/api/compare?fingerprint=fp-1'),
    );
    expect(res.status).toBe(500);
  });
});
