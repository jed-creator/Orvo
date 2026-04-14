/**
 * GET /api/book/services?q=<text>
 *
 * Unified bookable-services search — beauty/wellness + medspa +
 * fitness + general-booking + shopify-booking in one response. Empty
 * `q` returns an empty array. Mirrors `/api/eat/merchants`.
 */
import { NextResponse } from 'next/server';
import { searchBookableServices } from '@/lib/services/booking.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const services = q ? await searchBookableServices(q) : [];
  return NextResponse.json({ services });
}
