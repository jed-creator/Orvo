/**
 * /api/compare
 *
 * GET `?fingerprint=...` — returns `price_snapshots` for a given
 * normalized product fingerprint, grouped by provider with a `best`
 * winner. Fingerprints are expected to come from the pricing engine
 * (Phase 7 work); this scaffold just returns whatever rows exist and
 * lets the caller decide how to render them.
 *
 * Returns 400 when the fingerprint is missing and 500 on DB errors.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  compareFingerprint,
  supabasePricingStore,
} from '@/lib/services/pricing.service';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const fingerprint = url.searchParams.get('fingerprint')?.trim() ?? '';
  if (!fingerprint) {
    return NextResponse.json(
      { error: 'fingerprint required' },
      { status: 400 },
    );
  }

  try {
    const client = await createClient();
    const store = supabasePricingStore(client);
    const comparison = await compareFingerprint(store, fingerprint);
    return NextResponse.json(comparison);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
