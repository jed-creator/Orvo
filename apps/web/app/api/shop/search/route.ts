/**
 * GET /api/shop/search?q=<text>
 *
 * Fans out the query across every registered ecommerce adapter and
 * returns a flat `{ results }` envelope. An empty `q` returns whatever
 * each adapter considers its "browse all" response — for the mock
 * reference adapters that means the full fixture list, which is what
 * the mobile super-app screens render on first mount.
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
  const results = await searchProducts(q);
  return NextResponse.json({ results });
}
