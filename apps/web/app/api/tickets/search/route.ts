/**
 * GET /api/tickets/search?q=<text>
 *
 * Unified event search across Ticketmaster, Eventbrite, StubHub, AXS,
 * and every future `tickets` adapter. Empty `q` returns whatever each
 * adapter considers its "browse all" response — for the mock
 * reference adapters that means the full fixture list, which is what
 * the mobile super-app screens render on first mount.
 */
import { NextResponse } from 'next/server';
import { searchEvents } from '@/lib/services/tickets.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const events = await searchEvents(q);
  return NextResponse.json({ events });
}
