import Link from 'next/link';

/**
 * Marketplace landing. Shows a short welcome + entry points for the
 * scaffold. Listing data is fetched from `/api/market/listings` in a
 * later task — this page is intentionally static so Phase 4 smoke
 * tests stay deterministic.
 */
export default function MarketLandingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Buy, sell, and swap items and services with your neighbors.
        </p>
      </header>
      <Link
        href="/market/new"
        className="inline-block rounded-md border px-4 py-2 text-sm font-medium"
      >
        Create a listing
      </Link>
    </div>
  );
}
