import { describe, it, expect } from 'vitest';
import { GET, POST } from './route';

describe('GET /api/trips', () => {
  it('returns 200 with a trips array', async () => {
    const req = new Request('http://test/api/trips');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { trips: unknown };
    expect(body).toHaveProperty('trips');
    expect(Array.isArray(body.trips)).toBe(true);
  });
});

describe('POST /api/trips', () => {
  it('returns 201 with a stub trip envelope on valid input', async () => {
    const req = new Request('http://test/api/trips', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Bangkok long weekend',
        startDate: '2026-05-01',
        endDate: '2026-05-04',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { trip: { id: string; title: string } };
    expect(body.trip).toHaveProperty('id');
    expect(body.trip.title).toBe('Bangkok long weekend');
  });

  it('returns 400 when title is missing', async () => {
    const req = new Request('http://test/api/trips', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: '2026-05-01',
        endDate: '2026-05-04',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when startDate is after endDate', async () => {
    const req = new Request('http://test/api/trips', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Backwards',
        startDate: '2026-05-10',
        endDate: '2026-05-04',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
