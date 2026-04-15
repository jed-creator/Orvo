/**
 * GET /api/trips/search?q=<text>
 *
 * Unified travel search across the travel, hotel-direct, and
 * experiences adapter categories. Returns a flat `{ trips }` envelope
 * of `NormalizedSearchResult`. The Expedia reference adapter provides
 * the demo-weight fixture content until real connector credentials
 * land; stubs contribute empty arrays.
 *
 * This is separate from `GET /api/trips`, which is the trip-planner
 * persistence stub — that endpoint will eventually list the
 * authenticated user's saved itineraries. Search is its own surface.
 */
import { NextResponse } from 'next/server';
import { searchTravel } from '@/lib/services/trip-planner.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const trips = await searchTravel(q);
  return NextResponse.json({ trips });
}
