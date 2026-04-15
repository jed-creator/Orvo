/**
 * GET /api/market/search?q=<text>
 *
 * Grocery-market listing used by the mobile super-app `/market` tile.
 * None of the registered grocery adapters (Instacart, Uber Eats
 * Grocery, DoorDash Grocery, Skip Grocery, Just Eat Grocery, Grabmart)
 * currently have mock fixtures, so the route sources its results
 * directly from the seeded `delivery_merchants` table where
 * `category = 'grocery'`. That's the `npm run seed:demo` catalog — a
 * handful of neighborhood grocers plus their item lists.
 *
 * Rows are mapped into `NormalizedSearchResult` so the mobile
 * `CategoryScreen` can render them the same way it renders adapter
 * output. `provider = 'orvo-market'` flags them as first-party demo
 * content.
 *
 * The text query does a simple case-insensitive match against the
 * merchant name; empty queries return everything.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NormalizedSearchResult } from '@/lib/integrations/core';

interface DeliveryMerchantRow {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  avg_prep_minutes: number | null;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Outside a Next.js request scope (e.g. route unit tests hitting
    // GET with a raw Request object). Degrade to an empty list — the
    // envelope shape stays the same so the mobile client renders an
    // empty state instead of crashing.
    return NextResponse.json({ items: [] });
  }
  let query = supabase
    .from('delivery_merchants')
    .select('id, name, category, rating, avg_prep_minutes')
    .eq('category', 'grocery')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(25);

  if (q.length > 0) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message, items: [] },
      { status: 500 },
    );
  }

  const items: NormalizedSearchResult[] = ((data ?? []) as DeliveryMerchantRow[]).map(
    (m) => ({
      provider: 'orvo-market',
      externalId: m.id,
      title: m.name,
      category: 'grocery',
      subtitle:
        typeof m.avg_prep_minutes === 'number'
          ? `Grocery & essentials • ~${m.avg_prep_minutes} min pickup`
          : 'Grocery & everyday essentials',
      // Deterministic picsum hero per merchant — keyed off id so
      // re-seeds don't rotate the cards on-screen mid-demo.
      media: [
        {
          url: `https://picsum.photos/seed/${m.id}/800/500`,
          kind: 'image' as const,
        },
      ],
      rating: m.rating ?? undefined,
      metadata: {
        description:
          'Fresh produce, pantry staples, and local favorites delivered fast.',
      },
    }),
  );

  return NextResponse.json({ items });
}
