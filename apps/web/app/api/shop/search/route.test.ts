import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/shop/search', () => {
  it('returns 200 with a results array for an empty query', async () => {
    const req = new Request('http://test/api/shop/search');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown };
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('returns 200 with a results array for a real query', async () => {
    const req = new Request('http://test/api/shop/search?q=hoodie');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown };
    expect(Array.isArray(body.results)).toBe(true);
  });
});
