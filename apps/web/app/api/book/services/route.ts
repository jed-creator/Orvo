/**
 * GET /api/book/services?q=<text>&filter=<subFilterKey>
 *
 * Unified bookable-services search — beauty/wellness + medspa +
 * fitness + general-booking + shopify-booking + home-services +
 * pet-care. The route returns two flavors of content in one list:
 *
 *   1. Adapter fan-out via `searchBookableServices(q)`. Only
 *      reference adapters with fixtures contribute here today — the
 *      seven booking categories are all stubs right now, so this side
 *      usually returns an empty array.
 *
 *   2. First-party Orvo-native services from `public.services` joined
 *      with approved `public.businesses`. These are the rows seeded by
 *      `npm run seed:demo` and the primary reason the mobile `/book`
 *      tile shows meaningful content during an investor tour. Entries
 *      are mapped into `NormalizedSearchResult` with
 *      `provider = 'orvo'` so the UI treats them identically to
 *      adapter results.
 *
 * `filter` narrows the adapter fan-out to a sub-filter from
 * `BOOK_SUB_FILTERS` (e.g., `home-services`, `pet-care`, `beauty`).
 * Unknown filters fall back to the full fan-out. Orvo-native rows
 * are not sub-filtered today — they return on every call, to keep the
 * tile populated regardless of which tab the user taps. Mirrors the
 * shape used by `/api/eat/merchants`.
 */
import { NextResponse } from 'next/server';
import { searchBookableServices } from '@/lib/services/booking.service';
import { createClient } from '@/lib/supabase/server';
import type { NormalizedSearchResult } from '@/lib/integrations/core';
import '@/lib/integrations/bootstrap';

interface OrvoServiceRow {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  business: {
    id: string;
    name: string;
    avg_rating: number | null;
    cover_image_url: string | null;
    logo_url: string | null;
  } | null;
}

async function fetchOrvoNativeServices(
  q: string,
): Promise<NormalizedSearchResult[]> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Outside a Next.js request scope (e.g. route unit tests hitting GET
    // with a raw Request object). Degrade to adapter-only results — the
    // route still returns a well-formed `{ services }` envelope.
    return [];
  }
  let query = supabase
    .from('services')
    .select(
      'id, name, description, price_cents, duration_minutes, business:businesses(id, name, avg_rating, cover_image_url, logo_url)',
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(40);

  if (q.length > 0) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    // Silently drop on error — the adapter fan-out may still have
    // results, and the tile renders an empty state either way.
    return [];
  }

  return ((data ?? []) as unknown as OrvoServiceRow[])
    .filter((s) => s.business !== null)
    .map((s): NormalizedSearchResult => {
      const cover = s.business?.cover_image_url ?? s.business?.logo_url ?? null;
      return {
        provider: 'orvo',
        externalId: s.id,
        title: s.name,
        category: 'general-booking',
        subtitle: s.business
          ? `${s.business.name} • ${s.duration_minutes} min`
          : `${s.duration_minutes} min`,
        // Emit the business cover photo as the card image. The mobile
        // ResultCard reads `media[0].url` as its hero image.
        media: cover ? [{ url: cover, kind: 'image' as const }] : undefined,
        price: { amount: s.price_cents, currency: 'USD' },
        rating: s.business?.avg_rating ?? undefined,
        metadata: {
          description: s.description ?? '',
          businessId: s.business?.id,
          // Deep link into the native booking flow instead of opening a
          // URL. Mobile's `ResultCard` checks `metadata.deepLink` first so
          // this takes the investor straight from Book → booking screen.
          deepLink: `/book/${s.id}`,
          deepLinkType: 'service',
        },
      };
    });
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const filter = url.searchParams.get('filter')?.trim() || undefined;

  const [adapterResults, orvoResults] = await Promise.all([
    searchBookableServices(q, filter),
    fetchOrvoNativeServices(q),
  ]);

  const services = [...orvoResults, ...adapterResults];
  return NextResponse.json({ services });
}
