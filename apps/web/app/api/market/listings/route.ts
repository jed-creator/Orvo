/**
 * /api/market/listings
 *
 * GET:  lists active marketplace listings, newest first. RLS exposes
 *       active rows to the anon role so this is publicly readable.
 * POST: creates a new listing attributed to the authenticated user.
 *       Returns 401 without an auth cookie, 400 on invalid body, and
 *       201 with `{listing}` on success.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  supabaseMarketplaceStore,
  validateCreateListing,
  type CreateListingInput,
} from '@/lib/services/marketplace.service';

export async function GET(_req: Request): Promise<Response> {
  try {
    const client = await createClient();
    const store = supabaseMarketplaceStore(client);
    const listings = await store.listActive();
    return NextResponse.json({ listings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: Partial<CreateListingInput>;
  try {
    body = (await req.json()) as Partial<CreateListingInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'auth required' }, { status: 401 });
  }

  const check = validateCreateListing(body);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const store = supabaseMarketplaceStore(client);
    const listing = await store.insertListing(
      user.id,
      body as CreateListingInput,
    );
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
