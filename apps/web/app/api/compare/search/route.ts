/**
 * GET /api/compare/search?q=<text>
 *
 * Listing endpoint for the mobile super-app `/compare` tile. The
 * sibling `GET /api/compare?fingerprint=...` is a detail lookup that
 * returns `price_snapshots` grouped by provider for a single
 * fingerprint — that route is unchanged. This listing companion
 * surfaces one card per seeded product with its cheapest offer so the
 * Compare tab has something meaningful to show without a specific
 * fingerprint in hand.
 *
 * Rows come from `public.products` joined with `public.product_offers`
 * (both have public SELECT policies — see `005_super_app_expansion.sql`).
 * For each product, we rank offers by `price_amount ASC` and take the
 * first — that's the "best price" surface lines up with what the
 * fingerprint detail lookup calls `best`.
 *
 * Response envelope is `{ results: NormalizedSearchResult[] }` so the
 * mobile `super-app-api.ts` ENDPOINTS map (`compare → 'results'`) can
 * render without special casing.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NormalizedSearchResult } from '@/lib/integrations/core';

interface ProductOfferRow {
  id: string;
  provider: string;
  price_amount: number;
  // DB column is plain text, but the canonical Money schema narrows to
  // a small currency union. The seed only writes 'USD', so the assertion
  // is safe in practice.
  currency: 'USD' | 'CAD' | 'EUR' | 'GBP';
  url: string;
  in_stock: boolean | null;
}

interface ProductRow {
  id: string;
  title: string;
  brand: string;
  description: string | null;
  category: string;
  fingerprint: string;
  media: Array<{ url: string; alt?: string }> | null;
  offers: ProductOfferRow[] | null;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select(
      'id, title, brand, description, category, fingerprint, media, offers:product_offers(id, provider, price_amount, currency, url, in_stock)',
    )
    .limit(40);

  if (q.length > 0) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message, results: [] },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as ProductRow[];
  const results: NormalizedSearchResult[] = rows
    .map((row): NormalizedSearchResult | null => {
      const offers = (row.offers ?? []).filter((o) => o.in_stock !== false);
      if (offers.length === 0) return null;
      // Cheapest first — product_offers is an array, so sort in-memory
      // rather than relying on the adjacent-query ordering.
      const sorted = [...offers].sort(
        (a, b) => a.price_amount - b.price_amount,
      );
      const best = sorted[0];
      const providers = Array.from(new Set(offers.map((o) => o.provider)));
      return {
        provider: 'orvo-compare',
        externalId: row.fingerprint,
        title: row.title,
        category: 'ecommerce',
        subtitle: `${row.brand} • Best of ${providers.length} ${
          providers.length === 1 ? 'retailer' : 'retailers'
        }`,
        media:
          row.media && row.media.length > 0
            ? row.media.map((m) => ({
                url: m.url,
                kind: 'image' as const,
                alt: m.alt,
              }))
            : undefined,
        price: { amount: best.price_amount, currency: best.currency },
        url: best.url,
        metadata: {
          description: row.description ?? '',
          fingerprint: row.fingerprint,
          providers,
          offerCount: offers.length,
        },
      };
    })
    .filter((x): x is NormalizedSearchResult => x !== null);

  return NextResponse.json({ results });
}
