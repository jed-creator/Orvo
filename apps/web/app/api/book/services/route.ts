/**
 * GET /api/book/services?q=<text>&filter=<subFilterKey>
 *
 * Unified bookable-services search — beauty/wellness + medspa +
 * fitness + general-booking + shopify-booking + home-services +
 * pet-care in one response. Empty `q` returns an empty array.
 * `filter` narrows the fan-out to a sub-filter from
 * `BOOK_SUB_FILTERS` (e.g., `home-services`, `pet-care`, `beauty`).
 * Unknown filters fall back to the full fan-out. Mirrors
 * `/api/eat/merchants`.
 */
import { NextResponse } from 'next/server';
import { searchBookableServices } from '@/lib/services/booking.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const filter = url.searchParams.get('filter')?.trim() || undefined;
  const services = q ? await searchBookableServices(q, filter) : [];
  return NextResponse.json({ services });
}
