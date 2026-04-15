/**
 * GET /api/eat/merchants?q=<text>
 *
 * Unified food search — restaurants + delivery + convenience in one
 * response. Empty `q` returns whatever each adapter considers its
 * "browse all" response; for the mock reference adapters that means
 * the full fixture list, which is what the mobile super-app screens
 * render on first mount.
 *
 * In addition to the adapter fan-out, this route merges in first-party
 * seeded restaurants from `public.delivery_merchants` (everything that
 * isn't `category = 'grocery'` — those belong to /market). That gives
 * the mobile Eat tile a unified restaurants-and-delivery narrative
 * without needing real adapter credentials, and keeps the Eat ↔ Book
 * story lined up: consumers see local restaurants in Eat the same way
 * they see local service pros in Book.
 */
import { NextResponse } from 'next/server';
import { searchMerchants } from '@/lib/services/eat.service';
import { createClient } from '@/lib/supabase/server';
import type { NormalizedSearchResult } from '@/lib/integrations/core';
import '@/lib/integrations/bootstrap';

interface DeliveryMerchantRow {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  avg_prep_minutes: number | null;
}

/**
 * Picsum picks a deterministic photo per string. We seed the URL off
 * the merchant id so re-running the seed doesn't rotate the cards on
 * the demo screen. 800x500 matches the mobile `ResultCard` hero image.
 */
function merchantMediaUrl(id: string): string {
  return `https://picsum.photos/seed/${id}/800/500`;
}

async function fetchOrvoNativeMerchants(
  q: string,
): Promise<NormalizedSearchResult[]> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Outside a Next.js request scope (e.g. route unit tests hitting
    // GET with a raw Request object). Degrade to adapter-only results.
    return [];
  }
  let query = supabase
    .from('delivery_merchants')
    .select('id, name, category, rating, avg_prep_minutes')
    .neq('category', 'grocery')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(40);

  if (q.length > 0) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as DeliveryMerchantRow[]).map((m): NormalizedSearchResult => ({
    provider: 'orvo-eat',
    externalId: m.id,
    title: m.name,
    category: m.category === 'restaurant' ? 'restaurants' : 'delivery',
    subtitle:
      typeof m.avg_prep_minutes === 'number'
        ? `${capitalize(m.category)} • ~${m.avg_prep_minutes} min`
        : capitalize(m.category),
    media: [{ url: merchantMediaUrl(m.id), kind: 'image' as const }],
    rating: m.rating ?? undefined,
    metadata: {
      description: `Locally sourced ${m.category} — tap to see the menu.`,
      merchantId: m.id,
      merchantCategory: m.category,
    },
  }));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  const [adapterResults, orvoResults] = await Promise.all([
    searchMerchants(q),
    fetchOrvoNativeMerchants(q),
  ]);

  // Orvo-native rows come first so the investor demo shows real
  // seeded content at the top of the list.
  const merchants = [...orvoResults, ...adapterResults];
  return NextResponse.json({ merchants });
}
