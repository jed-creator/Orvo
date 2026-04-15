/**
 * Per-category config for the super-app mobile scaffolds.
 *
 * Every entry drives one screen (e.g. `app/(super-app)/shop.tsx` reads
 * `SUPER_APP_CONFIG.shop`) and one hub card on the Explore tab. The
 * `route` field is the Expo Router pathname to push — these match the
 * web app's URLs exactly so deep links work from both sides.
 */

export interface SuperAppCategoryConfig {
  key: string;
  title: string;
  emoji: string;
  subtitle: string;
  route: string;
}

export const SUPER_APP_CONFIG: Record<string, SuperAppCategoryConfig> = {
  shop: {
    key: 'shop',
    title: 'Shop',
    emoji: '🛍️',
    subtitle: 'Browse products across Shopify, WooCommerce, Squarespace, and more.',
    route: '/shop',
  },
  eat: {
    key: 'eat',
    title: 'Eat',
    emoji: '🍽️',
    subtitle: 'Reserve a table or order delivery — OpenTable, Uber Eats, DoorDash.',
    route: '/eat',
  },
  ride: {
    key: 'ride',
    title: 'Ride',
    emoji: '🚗',
    subtitle: 'Compare rideshare fares across Uber, Lyft, Grab, and Bolt.',
    route: '/ride',
  },
  trips: {
    key: 'trips',
    title: 'Trips',
    emoji: '✈️',
    subtitle: 'Hotels, flights, and experiences from Expedia, Booking.com, Airbnb.',
    route: '/trips',
  },
  tickets: {
    key: 'tickets',
    title: 'Tickets',
    emoji: '🎟️',
    subtitle: 'Events, concerts, and sports from Ticketmaster, StubHub, Eventbrite.',
    route: '/tickets',
  },
  market: {
    key: 'market',
    title: 'Market',
    emoji: '🛒',
    subtitle: 'Grocery delivery from Instacart, Uber Eats, DoorDash, and more.',
    route: '/market',
  },
  book: {
    key: 'book',
    title: 'Book',
    emoji: '📅',
    subtitle: 'Salons, spas, fitness, and service appointments — all in one search.',
    route: '/book',
  },
  compare: {
    key: 'compare',
    title: 'Compare',
    emoji: '📊',
    subtitle: 'Side-by-side comparison across providers and categories.',
    route: '/compare',
  },
};

/**
 * Ordered list used by the Explore hub grid — defines the visual
 * order of the 2×4 grid and matches the web app's super-app category
 * table in `db/migrations/005_super_app_expansion.sql`.
 */
export const SUPER_APP_ORDER: string[] = [
  'shop',
  'eat',
  'ride',
  'trips',
  'tickets',
  'market',
  'book',
  'compare',
];

/**
 * Sub-filter chip vocabulary passed into `CategoryScreen` for the Book
 * tile. Mirrors `BOOK_SUB_FILTERS` in `apps/web/lib/services/
 * booking.service.ts` — kept in sync by hand because the mobile bundle
 * cannot import from the web `@/lib/services` alias. Adding an entry
 * here without adding the matching entry server-side will cause the
 * filter to silently fall through to the full fan-out; that's still a
 * valid empty state, not a crash.
 *
 * Order matters: this is the visual order of the chip row, and `all`
 * is the default selection.
 */
export interface CategorySubFilter {
  /** URL-safe key passed to the API as `?filter=<key>`. */
  key: string;
  /** Short label rendered inside the chip. */
  label: string;
}

export const BOOK_SUB_FILTERS: readonly CategorySubFilter[] = [
  { key: 'all', label: 'All' },
  { key: 'beauty', label: 'Beauty & wellness' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'general-booking', label: 'General' },
  { key: 'home-services', label: 'Home services' },
  { key: 'pet-care', label: 'Pet care' },
];
