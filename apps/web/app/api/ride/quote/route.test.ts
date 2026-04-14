import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('POST /api/ride/quote', () => {
  it('returns 200 with a quotes array for a valid pickup/dropoff', async () => {
    const req = new Request('http://test/api/ride/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pickup: { lat: 47.6062, lng: -122.3321 },
        dropoff: { lat: 47.6205, lng: -122.3493 },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { quotes: unknown };
    expect(body).toHaveProperty('quotes');
    expect(Array.isArray(body.quotes)).toBe(true);
  });

  it('returns 400 when the body is missing pickup or dropoff', async () => {
    const req = new Request('http://test/api/ride/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('includes quotes from Uber since it is a reference adapter with products', async () => {
    const req = new Request('http://test/api/ride/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pickup: { lat: 47.6062, lng: -122.3321 },
        dropoff: { lat: 47.6205, lng: -122.3493 },
      }),
    });
    const res = await POST(req);
    const body = (await res.json()) as {
      quotes: Array<{ provider: string }>;
    };
    const providers = new Set(body.quotes.map((q) => q.provider));
    expect(providers.has('uber')).toBe(true);
  });
});
