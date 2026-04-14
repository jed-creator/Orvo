import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/tickets/search', () => {
  it('returns 200 with an events array for an empty query', async () => {
    const req = new Request('http://test/api/tickets/search');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { events: unknown };
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
  });

  it('fans across every tickets adapter for a real query', async () => {
    const req = new Request('http://test/api/tickets/search?q=hamilton');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      events: Array<{ provider: string }>;
    };
    expect(Array.isArray(body.events)).toBe(true);
    // Ticketmaster is a reference adapter seeded with events — its
    // fixtures contain at least one show matching a broad query.
    const providers = new Set(body.events.map((e) => e.provider));
    expect(providers.has('ticketmaster')).toBe(true);
  });
});
