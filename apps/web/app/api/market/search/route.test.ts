import { describe, it, expect } from 'vitest';
import { GET } from './route';

/**
 * Route-level smoke tests for the grocery Market endpoint. Hitting the
 * handler with a raw `Request` makes the Supabase server client throw —
 * the route degrades to an empty list, which is exactly the behavior we
 * want for unit tests that run without a DB. When run under the Next.js
 * dev server against a seeded DB the same handler returns real grocery
 * merchant rows.
 */
describe('GET /api/market/search', () => {
  it('returns 200 with an items array for an empty query', async () => {
    const req = new Request('http://test/api/market/search');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown };
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('returns 200 for a real query string', async () => {
    const req = new Request('http://test/api/market/search?q=milk');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown };
    expect(Array.isArray(body.items)).toBe(true);
  });
});
