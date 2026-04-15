/**
 * GET /api/ride/search?q=<text>
 *
 * Text-only rideshare listing used by the mobile super-app `/ride`
 * tile. Fans out across every registered rideshare adapter and returns
 * a flat `{ rides }` envelope of `NormalizedSearchResult`. The real
 * pickup/dropoff quote flow lives at `POST /api/ride/quote` — this
 * endpoint is the browse-all companion so a user can see "what ride
 * options does Orvo cover" before committing to a specific trip.
 *
 * Empty `q` returns whatever each adapter's `search` surfaces by
 * default (Uber's reference adapter lists its full product catalogue).
 */
import { NextResponse } from 'next/server';
import { searchRideshare } from '@/lib/services/ride.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const rides = await searchRideshare(q);
  return NextResponse.json({ rides });
}
