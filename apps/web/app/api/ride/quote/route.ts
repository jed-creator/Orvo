/**
 * POST /api/ride/quote
 *
 * Body: `{ pickup: {lat, lng}, dropoff: {lat, lng} }`
 * Returns: `{ quotes: NormalizedSearchResult[] }` — one entry per
 * product variant from every rideshare adapter the registry knows.
 */
import { NextResponse } from 'next/server';
import { quoteRide } from '@/lib/services/ride.service';
import '@/lib/integrations/bootstrap';

interface RawBody {
  pickup?: { lat?: unknown; lng?: unknown };
  dropoff?: { lat?: unknown; lng?: unknown };
}

function isValidPoint(p: unknown): p is { lat: number; lng: number } {
  if (!p || typeof p !== 'object') return false;
  const { lat, lng } = p as { lat?: unknown; lng?: unknown };
  return typeof lat === 'number' && typeof lng === 'number';
}

export async function POST(req: Request): Promise<Response> {
  let body: RawBody;
  try {
    body = (await req.json()) as RawBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isValidPoint(body.pickup) || !isValidPoint(body.dropoff)) {
    return NextResponse.json(
      { error: 'pickup and dropoff must be {lat, lng} objects' },
      { status: 400 },
    );
  }

  const quotes = await quoteRide({
    pickup: body.pickup,
    dropoff: body.dropoff,
  });
  return NextResponse.json({ quotes });
}
