/**
 * GET /api/shop/search?q=<text>
 *
 * Fans out the query across every registered ecommerce adapter and
 * returns a flat `{ results }` envelope. An empty `q` returns an empty
 * results array — the client is expected to debounce and only call
 * this once the user has typed something meaningful.
 *
 * The side-effect import of `bootstrap` populates the shared
 * `integrationRegistry` singleton on first request so we don't need a
 * dedicated boot hook.
 */
import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/services/shopping.service';
import '@/lib/integrations/bootstrap';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const results = q ? await searchProducts(q) : [];
  return NextResponse.json({ results });
}
