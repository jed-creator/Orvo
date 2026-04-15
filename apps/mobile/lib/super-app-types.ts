/**
 * Mobile-side types for the super-app fan-out API.
 *
 * Mirrors `packages/shared/src/super-app/integrations.ts` — we re-declare
 * here rather than importing across the workspace because Metro's monorepo
 * bundling has quirks with the shared package's Zod exports. If the canonical
 * shape in `integrations.ts` changes, update here in lockstep.
 *
 * Historical note: this file used to carry an older pre-canonical shape
 * (`id`, `priceCents`, `externalUrl`, `description`, `meta`). During the
 * demo-readiness pass we realigned it to the real payload the web routes
 * return so mobile cards render price, rating, and tap-to-open links
 * correctly. If you see references to the old shape anywhere, they're
 * stale — the JSON on the wire has always been this canonical form.
 */

export type IntegrationCategory =
  | 'restaurants'
  | 'delivery'
  | 'beauty-wellness'
  | 'medspa'
  | 'fitness'
  | 'general-booking'
  | 'shopify-booking'
  | 'travel'
  | 'hotel-direct'
  | 'experiences'
  | 'rideshare'
  | 'grocery'
  | 'tickets'
  | 'home-services'
  | 'pet-care'
  | 'ecommerce';

export interface Money {
  amount: number;
  currency: string;
}

export interface MediaAsset {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Shape returned by every adapter's `search()` and surfaced by the
 * `/api/<category>/...` routes. Matches `NormalizedSearchResult` in
 * `packages/shared/src/super-app/integrations.ts`.
 *
 * - `externalId` is the adapter/row primary key (the web canonical uses
 *   `externalId`, not `id`, because a single external identifier can
 *   appear across multiple adapters).
 * - `price` is a nested `{ amount, currency }` object. `amount` is in
 *   the smallest currency unit (cents for USD).
 * - `metadata` is an escape hatch — most UI code should NOT depend on
 *   its shape, but a handful of routes place `description` there when
 *   the adapter doesn't have a first-class slot for it. ResultCard
 *   reads `metadata.description` defensively.
 */
export interface NormalizedSearchResult {
  provider: string;
  externalId: string;
  title: string;
  category: IntegrationCategory;
  subtitle?: string;
  media?: MediaAsset[];
  location?: GeoPoint;
  price?: Money;
  rating?: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Shape of responses from `/api/<category>/search` and its siblings.
 * Each super-app route uses a domain-appropriate key name (`results`,
 * `services`, `rides`, `events`, `merchants`, …) — the mobile client
 * reads whichever key matches its `ENDPOINTS` entry and flattens to a
 * `NormalizedSearchResult[]` at the edge.
 */
export type ApiSearchResponse = {
  results?: NormalizedSearchResult[];
  services?: NormalizedSearchResult[];
  rides?: NormalizedSearchResult[];
  trips?: NormalizedSearchResult[];
  tickets?: NormalizedSearchResult[];
  events?: NormalizedSearchResult[];
  merchants?: NormalizedSearchResult[];
  products?: NormalizedSearchResult[];
  listings?: NormalizedSearchResult[];
  items?: NormalizedSearchResult[];
};
