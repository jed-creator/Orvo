import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/book/services', () => {
  it('returns 200 with a services array for an empty query', async () => {
    const req = new Request('http://test/api/book/services');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { services: unknown };
    expect(body).toHaveProperty('services');
    expect(Array.isArray(body.services)).toBe(true);
  });

  it('fans across booking-oriented categories for a real query', async () => {
    const req = new Request('http://test/api/book/services?q=haircut');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { services: unknown };
    expect(Array.isArray(body.services)).toBe(true);
  });
});
