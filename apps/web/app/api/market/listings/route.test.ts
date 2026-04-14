import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The marketplace route is the first in apps/web that exercises
 * Supabase. We avoid wiring a real client by mocking
 * `@/lib/supabase/server` with a hand-rolled fake. `vi.hoisted`
 * makes the shared `fakeState` object visible inside the hoisted
 * `vi.mock` factory — tests mutate it between assertions.
 */
const { fakeState, fakeCreateClient } = vi.hoisted(() => {
  const state = {
    user: null as null | { id: string },
    listings: [] as Array<Record<string, unknown>>,
    insertReturn: null as null | Record<string, unknown>,
    insertError: null as null | { message: string },
    selectError: null as null | { message: string },
  };

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: state.user },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: state.listings,
              error: state.selectError,
            }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: state.insertReturn,
            error: state.insertError,
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

import { GET, POST } from './route';

function resetFakeState() {
  fakeState.user = null;
  fakeState.listings = [];
  fakeState.insertReturn = null;
  fakeState.insertError = null;
  fakeState.selectError = null;
}

describe('GET /api/market/listings', () => {
  beforeEach(resetFakeState);

  it('returns 200 with an empty listings array when the DB is empty', async () => {
    const res = await GET(new Request('http://test/api/market/listings'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { listings: unknown[] };
    expect(body.listings).toEqual([]);
  });

  it('passes through whatever rows the DB returns', async () => {
    fakeState.listings = [
      { id: 'listing-1', title: 'Vintage bike', price_amount: 25000 },
      { id: 'listing-2', title: 'Dog walking', price_amount: 2500 },
    ];
    const res = await GET(new Request('http://test/api/market/listings'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { listings: unknown[] };
    expect(body.listings).toHaveLength(2);
  });

  it('returns 500 when the DB errors on select', async () => {
    fakeState.selectError = { message: 'boom' };
    const res = await GET(new Request('http://test/api/market/listings'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/market/listings', () => {
  beforeEach(resetFakeState);

  const validBody = {
    title: 'Vintage bike',
    kind: 'item',
    description: '1982 Peugeot',
    priceCents: 25000,
    currency: 'USD',
  };

  it('returns 401 when the caller is not authenticated', async () => {
    const req = new Request('http://test/api/market/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when the title is missing', async () => {
    fakeState.user = { id: 'user-1' };
    const { title: _title, ...rest } = validBody;
    const req = new Request('http://test/api/market/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rest),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when the kind is neither "item" nor "service"', async () => {
    fakeState.user = { id: 'user-1' };
    const req = new Request('http://test/api/market/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validBody, kind: 'unicorn' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 with the created listing when auth and body are valid', async () => {
    fakeState.user = { id: 'user-1' };
    fakeState.insertReturn = {
      id: 'listing-1',
      seller_user_id: 'user-1',
      ...validBody,
    };
    const req = new Request('http://test/api/market/listings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      listing: { id: string };
    };
    expect(body.listing.id).toBe('listing-1');
  });
});
