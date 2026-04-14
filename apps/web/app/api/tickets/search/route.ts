/**
 * GET /api/tickets/search?q=<text>
 *
 * Unified event search across Ticketmaster, Eventbrite, StubHub, AXS,
 * and every future `tickets` adapter. Empty `q` returns an empty
 * array — clients debounce and only call once the user has typed
 * something meaningful.
 */
import { NextResponse } from 'next/server';
import { searchEvents } from '@/lib/services/tickets.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const events = q ? await searchEvents(q) : [];
  return NextResponse.json({ events });
}
