/**
 * Mobile → web API client for super-app category search.
 *
 * The heavy lifting (fan-out over 89 adapters, Promise.allSettled,
 * normalization) lives in the web app's service layer — mobile just
 * calls the REST endpoint and renders the response. This keeps the
 * adapter universe in one place and avoids bundling all 89 TypeScript
 * adapter files into the Metro output.
 *
 * Base URL comes from `EXPO_PUBLIC_WEB_API_URL`. For local development
 * on a simulator, set this to your web dev server (e.g. `http://
 * localhost:3300`). For a physical device, use the machine's LAN IP
 * (e.g. `http://192.168.1.42:3300`) — `localhost` resolves to the
 * device, not the dev machine.
 */
import type {
  ApiSearchResponse,
  NormalizedSearchResult,
} from './super-app-types';

const WEB_API_URL =
  process.env.EXPO_PUBLIC_WEB_API_URL ?? 'http://localhost:3300';

/**
 * Per-category endpoint map. Matches the web app's API routes. The
 * `resultKey` is the JSON property that holds the results array —
 * routes vary (`results`, `services`, `rides`, etc.) because each
 * module's service uses a domain-appropriate name.
 */
interface CategoryEndpoint {
  path: string;
  resultKey: keyof ApiSearchResponse;
}

const ENDPOINTS: Record<string, CategoryEndpoint> = {
  shop: { path: '/api/shop/search', resultKey: 'results' },
  eat: { path: '/api/eat/merchants', resultKey: 'merchants' },
  ride: { path: '/api/ride/search', resultKey: 'rides' },
  trips: { path: '/api/trips/search', resultKey: 'trips' },
  tickets: { path: '/api/tickets/search', resultKey: 'events' },
  market: { path: '/api/market/search', resultKey: 'items' },
  book: { path: '/api/book/services', resultKey: 'services' },
  compare: { path: '/api/compare/search', resultKey: 'results' },
};

/**
 * Runs a search against the given super-app category. Returns an
 * empty array on any network/parse/schema failure — the scaffold UIs
 * render an "empty state" which is the right UX for both "no results"
 * and "API unreachable".
 *
 * `filter` is an optional sub-filter key forwarded as `?filter=<key>`
 * to the endpoint. Only a few routes honor it today — `/api/book/
 * services` is the canonical consumer, paired with the `BOOK_SUB_FILTERS`
 * vocabulary. Other routes simply ignore the parameter, so it's safe to
 * pass unconditionally.
 *
 * Failures are logged via `console.warn` so they're visible in Metro's
 * device log during development.
 */
export async function searchCategory(
  category: string,
  query: string,
  filter?: string,
): Promise<NormalizedSearchResult[]> {
  const endpoint = ENDPOINTS[category];
  if (!endpoint) {
    console.warn(`[super-app-api] unknown category: ${category}`);
    return [];
  }

  const params = new URLSearchParams({ q: query });
  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }
  const url = `${WEB_API_URL}${endpoint.path}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.warn(
        `[super-app-api] ${category} returned ${res.status}: ${url}`,
      );
      return [];
    }
    const json = (await res.json()) as ApiSearchResponse;
    // Different routes use different result keys — normalize here so
    // callers can always destructure a flat NormalizedSearchResult[].
    const results = json[endpoint.resultKey];
    return Array.isArray(results) ? results : [];
  } catch (err) {
    console.warn(`[super-app-api] ${category} fetch failed:`, err);
    return [];
  }
}

/**
 * Convenience export for screens that want to know the raw endpoint
 * map (e.g. for debug views).
 */
export { ENDPOINTS as SUPER_APP_ENDPOINTS };
