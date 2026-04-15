/**
 * Demo seed script.
 *
 * Populates the Orvo database with enough content to run a scripted
 * investor demo across all 16 super-app categories. See
 * `docs/plans/2026-04-14-demo-readiness.md` for the full strategy.
 *
 * USAGE
 *   cd apps/web
 *   npm run seed:demo
 *
 * REQUIREMENTS
 *   - `.env.local` in `apps/web/` with NEXT_PUBLIC_SUPABASE_URL and
 *     SUPABASE_SERVICE_ROLE_KEY set.
 *   - The target Supabase project must be non-production. The script
 *     aborts if NODE_ENV === 'production' or if NEXT_PUBLIC_APP_URL
 *     contains a production-looking domain.
 *
 * WHAT IT DOES
 *   1. Wipes any rows previously written by this script (idempotency).
 *      Auth accounts are identified by email prefix `demo-`. Super-app
 *      vertical rows are identified by `provider = 'demo-seed'` (or
 *      `fingerprint LIKE 'demo-seed:%'` for products).
 *   2. Creates 3 consumer accounts, 16 provider accounts (one per
 *      super-app category), and 1 admin account via the Supabase Admin
 *      API. Passwords are set so Bridget can log in live.
 *   3. Seeds MVP bookable businesses (6 categories × 2 businesses each =
 *      12 businesses, 48 services, 12 staff members, 60 availability
 *      rules).
 *   4. Seeds super-app vertical content for the other 10 categories:
 *      delivery_merchants (restaurants, delivery, grocery), products +
 *      product_offers (ecommerce), rideshare_quotes, trips + trip_items
 *      (travel, hotel-direct, experiences), tickets_events +
 *      tickets_listings.
 *   5. Seeds ~60 bookings across 3 consumers and 12 businesses (mix of
 *      past-completed, upcoming-confirmed, pending, cancelled).
 *   6. Seeds ~20 reviews attached to past-completed bookings and refreshes
 *      each business's denormalized avg_rating + total_reviews.
 *   7. Seeds ~12 favorites.
 *
 * WHAT IT DOES NOT DO
 *   - Does not create payment intents or call Stripe. Past-completed and
 *     upcoming-confirmed bookings use payment_status='captured' as a
 *     stand-in for "would have been paid" — the free-MVP strategy is
 *     unchanged, this is just seed data that reads cleanly in the
 *     business dashboard.
 *   - Does not write to auth.users in any environment where the URL
 *     looks production-like.
 */
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Env loading
// -----------------------------------------------------------------------------
// Load .env.local from apps/web (the script runs with cwd = apps/web when
// invoked via `npm run seed:demo`, but we also support invocation from the
// repo root by resolving relative to this file).

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env.local');
loadEnv({ path: envPath });

// -----------------------------------------------------------------------------
// Safety guards
// -----------------------------------------------------------------------------

function assertSafeToSeed(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'seed:demo refuses to run with NODE_ENV=production. ' +
        'This script writes test data and should only run against dev/staging.',
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const looksProduction =
    /orvo\.(app|com)/i.test(appUrl) || /vercel\.app/i.test(appUrl);
  if (looksProduction && !appUrl.includes('localhost')) {
    throw new Error(
      `seed:demo refuses to run against what looks like a production URL: ${appUrl}. ` +
        'Set NEXT_PUBLIC_APP_URL to a localhost or staging URL in .env.local.',
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  }
}

// -----------------------------------------------------------------------------
// Admin client
// -----------------------------------------------------------------------------

function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

// -----------------------------------------------------------------------------
// Demo user specs
// -----------------------------------------------------------------------------
//
// All demo accounts use the same password (`OrvoDemo2026!`) for easy live
// login. The email prefix `demo-` is how we identify rows to wipe on re-run.

const DEMO_PASSWORD = 'OrvoDemo2026!';
const DEMO_EMAIL_PREFIX = 'demo-';
const DEMO_PROVIDER = 'demo-seed';
const DEMO_FINGERPRINT_PREFIX = 'demo-seed:';
const DEMO_CURRENCY = 'USD';

// -----------------------------------------------------------------------------
// Geo helpers — business map pins
// -----------------------------------------------------------------------------
//
// The mobile map tile reads `address.lat` / `address.lng` (JSONB fields on
// `public.businesses`) and renders each approved business as a marker. The
// bookable fixture data assigns each business to one of two host cities —
// Seattle, WA and Asheville, NC — so we start from real downtown coordinates
// and spread businesses around that center via a deterministic per-slug
// offset. The offset is ~0.005° in both axes, which is roughly 500m and
// keeps the markers visually distinct without scattering them into
// neighboring ZIP codes.
//
// We also populate the PostGIS `location` column via a WKT string so any
// server-side distance/proximity queries (`ST_DWithin` etc.) continue to
// work. PostgREST accepts `SRID=4326;POINT(lng lat)` for GEOGRAPHY columns.

interface CityCoord {
  lat: number;
  lng: number;
}

const CITY_COORDS: Record<string, CityCoord> = {
  'Seattle,WA': { lat: 47.6062, lng: -122.3321 },
  'Asheville,NC': { lat: 35.5951, lng: -82.5515 },
};

/**
 * Deterministic per-slug coordinate offset. Hashes the slug into a small
 * 2D jitter so re-running the seed script doesn't rotate map pins. Output
 * lies in `[-0.0075, +0.0075]` on each axis — ~800m in both directions.
 */
function jitterCoordsForSlug(
  base: CityCoord,
  slug: string,
): { lat: number; lng: number } {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const fracA = ((h >>> 0) % 10000) / 10000; // [0,1)
  const fracB = (((h * 31) >>> 0) % 10000) / 10000; // [0,1)
  const latOffset = (fracA - 0.5) * 0.015; // [-0.0075, +0.0075]
  const lngOffset = (fracB - 0.5) * 0.015;
  return {
    lat: +(base.lat + latOffset).toFixed(6),
    lng: +(base.lng + lngOffset).toFixed(6),
  };
}

/**
 * Build the address JSONB payload for a bookable business, including the
 * lat/lng fields that the mobile map tile reads. `city` + `state` must
 * match a key in `CITY_COORDS`; unknown cities fall back to Seattle so
 * the seed never crashes mid-run because a new fixture was added without
 * a matching entry here.
 *
 * Field name note: we use `line1` (not `street`) to match the mobile
 * `Business.address` type in `apps/mobile/lib/types.ts`. Older seed
 * revisions wrote `street` — if you're looking at a stale DB, re-run
 * `npm run seed:demo` to pick up the rename.
 */
function buildAddress(
  city: string,
  state: string,
  slug: string,
): Record<string, unknown> & { lat: number; lng: number } {
  const key = `${city},${state}`;
  const base = CITY_COORDS[key] ?? CITY_COORDS['Seattle,WA'];
  const { lat, lng } = jitterCoordsForSlug(base, slug);
  return {
    line1: '100 Main St',
    city,
    state,
    postal_code: state === 'WA' ? '98101' : '28801',
    country: 'USA',
    lat,
    lng,
  };
}

/**
 * Build the PostGIS WKT string for a business given its jittered coords.
 * Matches the format used by `rideshare_quotes` (see line ~1200).
 */
function buildLocationWkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

type DemoUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: 'consumer' | 'provider' | 'admin';
  /** Category key this user owns (provider accounts only). */
  categoryKey?: CategoryKey;
};

/**
 * The 16 super-app categories, in tour order. This is the authoritative
 * list used for provider user creation and (in Batch 2) fixture mapping.
 */
export const CATEGORY_KEYS = [
  'beauty-wellness',
  'medspa',
  'fitness',
  'general-booking',
  'home-services',
  'pet-care',
  'restaurants',
  'delivery',
  'grocery',
  'ecommerce',
  'shopify-booking',
  'rideshare',
  'travel',
  'hotel-direct',
  'tickets',
  'experiences',
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/**
 * Human-readable label for each category. Used in display names so the
 * admin panel shows "Demo Provider — Beauty & Wellness" rather than the
 * adapter slug.
 */
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  'beauty-wellness': 'Beauty & Wellness',
  medspa: 'Medspa',
  fitness: 'Fitness',
  'general-booking': 'General Booking',
  'home-services': 'Home Services',
  'pet-care': 'Pet Care',
  restaurants: 'Restaurants',
  delivery: 'Delivery',
  grocery: 'Grocery',
  ecommerce: 'Ecommerce',
  'shopify-booking': 'Shopify Booking',
  rideshare: 'Rideshare',
  travel: 'Travel',
  'hotel-direct': 'Hotel Direct',
  tickets: 'Tickets',
  experiences: 'Experiences',
};

function buildUserSpecs(): DemoUser[] {
  const consumers: DemoUser[] = [
    {
      email: `${DEMO_EMAIL_PREFIX}consumer-1@orvo.app`,
      firstName: 'Riley',
      lastName: 'Nakamura',
      role: 'consumer',
    },
    {
      email: `${DEMO_EMAIL_PREFIX}consumer-2@orvo.app`,
      firstName: 'Jordan',
      lastName: 'Patel',
      role: 'consumer',
    },
    {
      email: `${DEMO_EMAIL_PREFIX}consumer-3@orvo.app`,
      firstName: 'Sam',
      lastName: 'Okafor',
      role: 'consumer',
    },
  ];

  const providers: DemoUser[] = CATEGORY_KEYS.map((key) => ({
    email: `${DEMO_EMAIL_PREFIX}provider-${key}@orvo.app`,
    firstName: 'Demo',
    lastName: CATEGORY_LABELS[key],
    role: 'provider',
    categoryKey: key,
  }));

  const admin: DemoUser = {
    email: `${DEMO_EMAIL_PREFIX}admin@orvo.app`,
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
  };

  return [...consumers, ...providers, admin];
}

// -----------------------------------------------------------------------------
// Idempotency — wipe anything previously seeded
// -----------------------------------------------------------------------------
//
// Two buckets of data to clean:
//
// 1. Auth-user-scoped data (businesses, services, bookings, reviews, trips,
//    delivery_orders, etc.). Identified by email prefix `demo-` on
//    auth.users. Deleting an auth user cascades through most child tables;
//    bookings are ON DELETE RESTRICT so we wipe those manually first.
//
// 2. Super-app vertical reference data (delivery_merchants, products,
//    rideshare_quotes, tickets_events). These are NOT scoped to a user —
//    they're catalog rows. Identified by `provider = 'demo-seed'` (or
//    `fingerprint LIKE 'demo-seed:%'` for products).

async function wipeExistingDemo(supabase: SupabaseClient): Promise<{
  authUsersDeleted: number;
  bookingsDeleted: number;
  superAppRowsDeleted: number;
}> {
  // -------- Super-app catalog data (provider-tagged) --------
  // Delete these FIRST so we don't leave orphans if a later step fails.
  // Child tables cascade from their parents (delivery_items from merchants,
  // tickets_listings from events, product_variants/product_offers from
  // products).
  let superAppRowsDeleted = 0;

  const catalogTables = [
    { table: 'delivery_merchants', filter: 'provider' },
    { table: 'rideshare_quotes', filter: 'provider' },
    { table: 'tickets_events', filter: 'provider' },
  ] as const;

  for (const { table, filter } of catalogTables) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .eq(filter, DEMO_PROVIDER);
    if (error) throw new Error(`wipe ${table}: ${error.message}`);
    superAppRowsDeleted += count ?? 0;
  }

  // product_offers is where the demo provider lives for ecommerce. Deleting
  // by provider leaves the products themselves orphaned (products has no
  // provider column), so we delete products by fingerprint prefix which
  // cascades to offers + variants.
  {
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .like('fingerprint', `${DEMO_FINGERPRINT_PREFIX}%`);
    if (error) throw new Error(`wipe products: ${error.message}`);
    superAppRowsDeleted += count ?? 0;
  }

  // -------- Auth-user-scoped data --------
  const { data: listData, error: listErr } =
    await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;

  const demoUsers = listData.users.filter((u) =>
    (u.email ?? '').startsWith(DEMO_EMAIL_PREFIX),
  );

  if (demoUsers.length === 0) {
    return { authUsersDeleted: 0, bookingsDeleted: 0, superAppRowsDeleted };
  }

  const demoUserIds = demoUsers.map((u) => u.id);

  // Delete bookings tied to these users first (consumer_id or
  // business_id on a demo-owned business). ON DELETE RESTRICT means
  // we can't let the user cascade do this.
  const { data: ownedBusinesses } = await supabase
    .from('businesses')
    .select('id')
    .in('owner_id', demoUserIds);

  const businessIds = (ownedBusinesses ?? []).map((b) => b.id);

  let bookingsDeleted = 0;
  if (businessIds.length > 0) {
    const { error: bizBookingErr, count } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .in('business_id', businessIds);
    if (bizBookingErr) throw bizBookingErr;
    bookingsDeleted += count ?? 0;
  }
  {
    const { error: consBookingErr, count } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .in('consumer_id', demoUserIds);
    if (consBookingErr) throw consBookingErr;
    bookingsDeleted += count ?? 0;
  }

  // Delete the auth users. Cascades handle the rest (profiles, businesses,
  // services, staff, availability_rules, favorites, trips, delivery_orders,
  // rideshare_bookings, ticket_orders, marketplace_listings).
  for (const user of demoUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;
  }

  return {
    authUsersDeleted: demoUsers.length,
    bookingsDeleted,
    superAppRowsDeleted,
  };
}

// -----------------------------------------------------------------------------
// User creation
// -----------------------------------------------------------------------------
//
// The `handle_new_user` trigger inserts a row in `public.profiles` from
// auth.users metadata. We pass first_name, last_name, and role via the
// metadata so the trigger creates the profile with the right role.

async function createAuthUsers(
  supabase: SupabaseClient,
  specs: DemoUser[],
): Promise<Record<string, string>> {
  const emailToId: Record<string, string> = {};

  for (const spec of specs) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: spec.firstName,
        last_name: spec.lastName,
        role: spec.role,
      },
    });
    if (error) {
      throw new Error(
        `Failed to create user ${spec.email}: ${error.message}`,
      );
    }
    if (!data.user) {
      throw new Error(`Supabase returned no user for ${spec.email}`);
    }
    emailToId[spec.email] = data.user.id;
  }

  return emailToId;
}

// -----------------------------------------------------------------------------
// Bookable-business fixtures (MVP-native categories)
// -----------------------------------------------------------------------------
//
// Six of the 16 super-app categories map cleanly to bookable Orvo-native
// businesses: beauty-wellness, medspa, fitness, general-booking,
// home-services, pet-care. Each has 2 businesses, each business has 4
// services, 1 staff member, and standard M–F 9–5 availability.
//
// `mvpCategorySlug` links to a row in public.categories (seeded by
// migration 001). The business's `category_id` is resolved at seed time.
//
// `image` keys feed stock-photo URLs via picsum.photos — deterministic
// and real-looking for the demo, even if not themed to the business.

type BookableService = {
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
};

type BookableBusiness = {
  name: string;
  slug: string;
  description: string;
  city: string;
  state: string;
  services: BookableService[];
  staffName: string;
  staffBio: string;
};

type BookableFixture = {
  categoryKey: CategoryKey;
  mvpCategorySlug: string;
  businesses: BookableBusiness[];
};

const BOOKABLE_FIXTURES: BookableFixture[] = [
  {
    categoryKey: 'beauty-wellness',
    mvpCategorySlug: 'hair-salon',
    businesses: [
      {
        name: 'The Rooted Salon',
        slug: 'demo-the-rooted-salon',
        description:
          'Full-service hair salon focused on natural color and sustainable products. Walk-ins welcome on Saturdays.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Maya Chen',
        staffBio: 'Master stylist. 12 years experience in balayage and color correction.',
        services: [
          { name: "Women's Haircut", description: 'Cut, wash, and style', durationMin: 60, priceCents: 8500 },
          { name: 'Color & Highlights', description: 'Full color with highlights', durationMin: 120, priceCents: 18500 },
          { name: 'Balayage', description: 'Hand-painted highlights', durationMin: 150, priceCents: 22500 },
          { name: 'Blowout & Style', description: 'Wash, blowdry, and style', durationMin: 45, priceCents: 5500 },
        ],
      },
      {
        name: 'Copper & Co. Barbershop',
        slug: 'demo-copper-and-co-barbershop',
        description:
          'Classic barbershop in Capitol Hill. Hot towel shaves, fades, and beard care.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Diego Ramirez',
        staffBio: 'Owner and lead barber. Specializes in classic cuts and straight-razor shaves.',
        services: [
          { name: "Men's Haircut", description: 'Classic cut with hot towel finish', durationMin: 45, priceCents: 4500 },
          { name: 'Beard Trim', description: 'Shape and line-up', durationMin: 30, priceCents: 3000 },
          { name: 'Hot Towel Shave', description: 'Traditional straight-razor shave', durationMin: 45, priceCents: 5500 },
          { name: 'Fade & Beard Combo', description: 'Full cut + beard', durationMin: 60, priceCents: 6500 },
        ],
      },
    ],
  },
  {
    categoryKey: 'medspa',
    mvpCategorySlug: 'facial-skincare',
    businesses: [
      {
        name: 'Glow Aesthetics Clinic',
        slug: 'demo-glow-aesthetics-clinic',
        description:
          'Medical spa offering injectables, laser treatments, and medical-grade facials. Nurse-led.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Dr. Priya Shah, RN',
        staffBio: 'Registered nurse injector with a decade in aesthetic medicine.',
        services: [
          { name: 'Signature HydraFacial', description: '60-min deep cleanse and hydration', durationMin: 60, priceCents: 20000 },
          { name: 'Botox (per unit)', description: 'Wrinkle relaxer injection', durationMin: 30, priceCents: 1500 },
          { name: 'Chemical Peel', description: 'Medium-depth glycolic peel', durationMin: 45, priceCents: 15000 },
          { name: 'Microneedling', description: 'Collagen induction therapy', durationMin: 75, priceCents: 35000 },
        ],
      },
      {
        name: 'Pure Skin Medspa',
        slug: 'demo-pure-skin-medspa',
        description:
          'Medical-grade skincare and body contouring in downtown Asheville.',
        city: 'Asheville',
        state: 'NC',
        staffName: 'Jenna Kowalski, PA-C',
        staffBio: 'Physician assistant specialized in aesthetic medicine and dermatology.',
        services: [
          { name: 'Dermaplane Facial', description: 'Exfoliation + facial', durationMin: 60, priceCents: 12500 },
          { name: 'Laser Hair Removal', description: 'Single area, per session', durationMin: 45, priceCents: 9500 },
          { name: 'Lip Filler', description: '0.5ml hyaluronic acid', durationMin: 45, priceCents: 42500 },
          { name: 'IPL Photofacial', description: 'Intense pulsed light for pigment', durationMin: 45, priceCents: 27500 },
        ],
      },
    ],
  },
  {
    categoryKey: 'fitness',
    mvpCategorySlug: 'fitness-personal-training',
    businesses: [
      {
        name: 'Northwest Strength Studio',
        slug: 'demo-northwest-strength-studio',
        description:
          'Private-session strength training. Olympic lifting, powerlifting, and mobility.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Marcus Brown',
        staffBio: 'CSCS-certified coach. Former collegiate strength athlete.',
        services: [
          { name: '1-on-1 Personal Training', description: '60-min private session', durationMin: 60, priceCents: 9500 },
          { name: 'Movement Assessment', description: 'Initial evaluation + plan', durationMin: 90, priceCents: 12500 },
          { name: 'Small-Group Strength', description: '2-3 person session', durationMin: 60, priceCents: 5500 },
          { name: 'Mobility & Recovery', description: 'Stretch and foam-roll session', durationMin: 45, priceCents: 6500 },
        ],
      },
      {
        name: 'Mountain Peak Fitness',
        slug: 'demo-mountain-peak-fitness',
        description:
          'Outdoor-focused fitness coaching — hiking prep, trail running, and endurance training.',
        city: 'Asheville',
        state: 'NC',
        staffName: 'Hannah Nguyen',
        staffBio: 'NASM-CPT and ultra-marathon runner.',
        services: [
          { name: 'Trail Running Clinic', description: 'Group trail-run technique session', durationMin: 90, priceCents: 4500 },
          { name: 'Hiking Prep Program', description: 'Assessment + 4-week plan kickoff', durationMin: 60, priceCents: 8500 },
          { name: 'Personal Training', description: '1-hour outdoor session', durationMin: 60, priceCents: 8000 },
          { name: 'Endurance Consulting', description: 'Race strategy session', durationMin: 60, priceCents: 7500 },
        ],
      },
    ],
  },
  {
    categoryKey: 'general-booking',
    mvpCategorySlug: 'coaching',
    businesses: [
      {
        name: 'Clarity Coaching Co.',
        slug: 'demo-clarity-coaching-co',
        description:
          'Executive and leadership coaching for founders, directors, and career changers.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Sarah Lindqvist',
        staffBio: 'ICF-credentialed executive coach. Former VP of Product at a Fortune 500.',
        services: [
          { name: 'Intro Clarity Session', description: '30-min discovery call', durationMin: 30, priceCents: 0 },
          { name: 'Leadership Coaching', description: '60-min deep session', durationMin: 60, priceCents: 22500 },
          { name: 'Career Pivot Workshop', description: '90-min structured pivot session', durationMin: 90, priceCents: 32500 },
          { name: 'Quarterly Review', description: '60-min accountability session', durationMin: 60, priceCents: 22500 },
        ],
      },
      {
        name: 'Thrive Counseling',
        slug: 'demo-thrive-counseling',
        description:
          'Licensed therapy — anxiety, burnout, relationships. In-person and virtual.',
        city: 'Asheville',
        state: 'NC',
        staffName: 'Dr. Omar Haddad, LCMHC',
        staffBio: 'Licensed clinical mental health counselor, 15 years in private practice.',
        services: [
          { name: 'Intake Session', description: '75-min initial assessment', durationMin: 75, priceCents: 18500 },
          { name: 'Individual Therapy', description: '50-min ongoing session', durationMin: 50, priceCents: 15500 },
          { name: 'Couples Counseling', description: '60-min couples session', durationMin: 60, priceCents: 19500 },
          { name: 'Burnout Recovery Program', description: '6-session package kickoff', durationMin: 60, priceCents: 85000 },
        ],
      },
    ],
  },
  {
    categoryKey: 'home-services',
    mvpCategorySlug: 'house-cleaning',
    businesses: [
      {
        name: 'Sparkle Home Services',
        slug: 'demo-sparkle-home-services',
        description:
          'Eco-friendly house cleaning. Licensed, bonded, and insured. Serving greater Seattle.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Elena Popescu',
        staffBio: 'Owner and lead cleaner. 8 years in residential cleaning.',
        services: [
          { name: 'Standard Clean', description: '2-3 bedroom home standard clean', durationMin: 120, priceCents: 14500 },
          { name: 'Deep Clean', description: 'Full top-to-bottom deep clean', durationMin: 240, priceCents: 28500 },
          { name: 'Move-Out Clean', description: 'Empty-home move-out clean', durationMin: 240, priceCents: 32500 },
          { name: 'Post-Construction', description: 'Dust and debris cleanup', durationMin: 300, priceCents: 39500 },
        ],
      },
      {
        name: 'Appalachian Home Care',
        slug: 'demo-appalachian-home-care',
        description:
          'Handyman, repair, and small-project services across Western NC.',
        city: 'Asheville',
        state: 'NC',
        staffName: 'Tyler Whitfield',
        staffBio: 'Licensed handyman. 20 years in home repair and remodeling.',
        services: [
          { name: 'Handyman Hour', description: 'Hourly home repair service', durationMin: 60, priceCents: 8500 },
          { name: 'Furniture Assembly', description: 'Flat-pack assembly service', durationMin: 90, priceCents: 9500 },
          { name: 'Gutter Cleaning', description: 'Single-story gutter cleaning', durationMin: 120, priceCents: 12500 },
          { name: 'Pressure Washing', description: 'Driveway / deck / siding', durationMin: 180, priceCents: 18500 },
        ],
      },
    ],
  },
  {
    categoryKey: 'pet-care',
    mvpCategorySlug: 'pet-grooming',
    businesses: [
      {
        name: 'Happy Paws Grooming',
        slug: 'demo-happy-paws-grooming',
        description:
          'Full-service dog and cat grooming. Low-stress environment, experienced with anxious pets.',
        city: 'Seattle',
        state: 'WA',
        staffName: 'Kris Ito',
        staffBio: 'Certified professional groomer. Specializes in large breeds and doubles as a pet-first-aid instructor.',
        services: [
          { name: 'Small Dog Full Groom', description: 'Bath, cut, nails, ears', durationMin: 90, priceCents: 7500 },
          { name: 'Large Dog Full Groom', description: 'Full groom for 50lb+ dogs', durationMin: 120, priceCents: 11500 },
          { name: 'Cat Bath & Brush', description: 'Gentle bath and deshed', durationMin: 60, priceCents: 8500 },
          { name: 'Nail Trim Drop-In', description: 'Nails only, no appointment', durationMin: 15, priceCents: 2500 },
        ],
      },
      {
        name: 'Mountain Pet Spa',
        slug: 'demo-mountain-pet-spa',
        description:
          'Boutique pet grooming and day-spa experience in West Asheville.',
        city: 'Asheville',
        state: 'NC',
        staffName: 'Brielle Carter',
        staffBio: '10 years grooming experience, AKC-certified.',
        services: [
          { name: 'Puppy First Groom', description: 'Gentle intro groom for puppies', durationMin: 60, priceCents: 5500 },
          { name: 'Doodle Deluxe', description: 'Doodle-specific full groom', durationMin: 150, priceCents: 13500 },
          { name: 'De-Shed Treatment', description: 'Heavy shedding treatment', durationMin: 90, priceCents: 9500 },
          { name: 'Teeth Brushing Add-On', description: 'Dental care add-on', durationMin: 15, priceCents: 1500 },
        ],
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Super-app vertical fixtures
// -----------------------------------------------------------------------------
//
// For the 10 non-bookable categories we populate the per-vertical tables
// directly (delivery_merchants, products, rideshare_quotes, trips,
// tickets_events). Everything tagged with provider='demo-seed' so wipe
// cleanup works.

const DELIVERY_MERCHANTS: Array<{
  externalId: string;
  name: string;
  category: 'restaurant' | 'grocery' | 'convenience' | 'retail';
  rating: number;
  avgPrepMinutes: number;
  items: Array<{ name: string; description: string; priceCents: number }>;
}> = [
  {
    externalId: 'demo-rest-momo-house',
    name: 'Momo House',
    category: 'restaurant',
    rating: 4.7,
    avgPrepMinutes: 25,
    items: [
      { name: 'Steamed Momo (8 pc)', description: 'Chicken momos with house chutney', priceCents: 1400 },
      { name: 'Veg Thukpa', description: 'Himalayan noodle soup', priceCents: 1250 },
      { name: 'Butter Chicken', description: 'Served with basmati and naan', priceCents: 1700 },
      { name: 'Mango Lassi', description: 'House-blended yogurt drink', priceCents: 550 },
    ],
  },
  {
    externalId: 'demo-rest-lola-tacos',
    name: "Lola's Tacos",
    category: 'restaurant',
    rating: 4.8,
    avgPrepMinutes: 20,
    items: [
      { name: 'Al Pastor Tacos (3)', description: 'Pineapple, cilantro, onion', priceCents: 1200 },
      { name: 'Carne Asada Burrito', description: 'Grilled steak, beans, rice', priceCents: 1400 },
      { name: 'Chips & Guac', description: 'Fresh-made guacamole', priceCents: 850 },
      { name: 'Horchata', description: 'Cinnamon rice milk', priceCents: 450 },
    ],
  },
  {
    externalId: 'demo-rest-the-green-bowl',
    name: 'The Green Bowl',
    category: 'restaurant',
    rating: 4.5,
    avgPrepMinutes: 15,
    items: [
      { name: 'Harvest Grain Bowl', description: 'Quinoa, kale, roasted veg, tahini', priceCents: 1350 },
      { name: 'Southwest Salad', description: 'Black beans, corn, cilantro-lime', priceCents: 1250 },
      { name: 'Green Smoothie', description: 'Spinach, banana, peanut butter', priceCents: 850 },
      { name: 'Avocado Toast', description: 'Sourdough, avocado, chili flakes', priceCents: 950 },
    ],
  },
  {
    externalId: 'demo-rest-shinobu-ramen',
    name: 'Shinobu Ramen',
    category: 'restaurant',
    rating: 4.9,
    avgPrepMinutes: 25,
    items: [
      { name: 'Tonkotsu Ramen', description: '24-hour pork broth', priceCents: 1650 },
      { name: 'Spicy Miso Ramen', description: 'Miso broth with chili oil', priceCents: 1650 },
      { name: 'Gyoza (6 pc)', description: 'Pork and cabbage dumplings', priceCents: 850 },
      { name: 'Edamame', description: 'Steamed and salted', priceCents: 550 },
    ],
  },
  {
    externalId: 'demo-groc-harvest-market',
    name: 'Harvest Market Co-op',
    category: 'grocery',
    rating: 4.6,
    avgPrepMinutes: 35,
    items: [
      { name: 'Organic Bananas (1 lb)', description: 'Fair-trade organic', priceCents: 199 },
      { name: 'Fresh Sourdough Loaf', description: 'Baked daily in-house', priceCents: 650 },
      { name: 'Local Free-Range Eggs (dozen)', description: 'From Willow Creek Farm', priceCents: 825 },
      { name: 'Cold-Pressed Green Juice', description: '16oz, daily special', priceCents: 899 },
    ],
  },
  {
    externalId: 'demo-groc-neighborhood-market',
    name: 'Neighborhood Market',
    category: 'grocery',
    rating: 4.4,
    avgPrepMinutes: 30,
    items: [
      { name: 'Whole Milk (1 gal)', description: 'Local dairy', priceCents: 525 },
      { name: 'Pasture-Raised Chicken', description: 'Boneless thighs, 1 lb', priceCents: 925 },
      { name: 'Heirloom Tomatoes (1 lb)', description: 'Farmer-direct', priceCents: 425 },
      { name: 'Organic Cold Brew', description: '32oz bottle', priceCents: 725 },
    ],
  },
  {
    externalId: 'demo-conv-24-corner-store',
    name: '24/7 Corner Store',
    category: 'convenience',
    rating: 4.1,
    avgPrepMinutes: 15,
    items: [
      { name: 'Cold Brew Coffee', description: '16oz can', priceCents: 450 },
      { name: 'Protein Bar', description: 'Chocolate peanut butter', priceCents: 325 },
      { name: 'Sparkling Water (4-pack)', description: 'Grapefruit flavor', priceCents: 625 },
      { name: 'Trail Mix', description: '6oz bag', priceCents: 550 },
    ],
  },
  {
    externalId: 'demo-conv-downtown-deli',
    name: 'Downtown Deli & Market',
    category: 'convenience',
    rating: 4.3,
    avgPrepMinutes: 20,
    items: [
      { name: 'Turkey & Avocado Sandwich', description: 'On sourdough', priceCents: 1150 },
      { name: 'Caesar Salad', description: 'Classic with anchovy dressing', priceCents: 1050 },
      { name: 'Bag of Chips', description: 'Salt & vinegar kettle-cooked', priceCents: 325 },
      { name: 'Iced Tea', description: 'Unsweetened, 20oz', priceCents: 375 },
    ],
  },
];

const PRODUCTS: Array<{
  fingerprint: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  priceCents: number;
  imageSeed: string;
}> = [
  {
    fingerprint: 'sonos-era-100',
    title: 'Era 100 Smart Speaker',
    brand: 'Sonos',
    description: 'Next-gen compact smart speaker with stereo sound and voice control.',
    category: 'Electronics / Audio',
    priceCents: 24900,
    imageSeed: 'sonos-era',
  },
  {
    fingerprint: 'nike-pegasus-40',
    title: 'Pegasus 40 Road Running Shoes',
    brand: 'Nike',
    description: 'Responsive everyday trainer with React foam cushioning.',
    category: 'Footwear / Running',
    priceCents: 13000,
    imageSeed: 'nike-peg',
  },
  {
    fingerprint: 'patagonia-nano-puff',
    title: 'Nano Puff Insulated Jacket',
    brand: 'Patagonia',
    description: 'Lightweight, packable, recycled-content synthetic insulation.',
    category: 'Apparel / Outerwear',
    priceCents: 24900,
    imageSeed: 'pata-nano',
  },
  {
    fingerprint: 'yeti-rambler-20',
    title: 'Rambler 20oz Tumbler',
    brand: 'YETI',
    description: 'Double-wall vacuum insulation. Keeps hot hot and cold cold.',
    category: 'Outdoors / Drinkware',
    priceCents: 3500,
    imageSeed: 'yeti-ram',
  },
  {
    fingerprint: 'apple-magic-mouse-2',
    title: 'Magic Mouse',
    brand: 'Apple',
    description: 'Rechargeable wireless multi-touch mouse.',
    category: 'Electronics / Accessories',
    priceCents: 9900,
    imageSeed: 'apple-mouse',
  },
  {
    fingerprint: 'osprey-atmos-ag-65',
    title: 'Atmos AG 65 Backpack',
    brand: 'Osprey',
    description: 'Anti-gravity suspension backpack for multi-day hikes.',
    category: 'Outdoors / Packs',
    priceCents: 29000,
    imageSeed: 'osprey-atmos',
  },
];

const RIDESHARE_QUOTES: Array<{
  productType: 'standard' | 'xl' | 'lux' | 'pool' | 'carshare' | 'taxi';
  etaSeconds: number;
  priceCents: number;
  surgeMultiplier: number | null;
  capacity: number;
}> = [
  { productType: 'standard', etaSeconds: 240, priceCents: 1675, surgeMultiplier: 1.0, capacity: 4 },
  { productType: 'xl', etaSeconds: 360, priceCents: 2850, surgeMultiplier: 1.0, capacity: 6 },
  { productType: 'lux', etaSeconds: 420, priceCents: 3925, surgeMultiplier: null, capacity: 4 },
  { productType: 'pool', etaSeconds: 540, priceCents: 975, surgeMultiplier: 1.0, capacity: 2 },
];

const TICKET_EVENTS: Array<{
  externalId: string;
  title: string;
  kind: 'concert' | 'sports' | 'theater' | 'comedy' | 'festival';
  venue: string;
  daysFromNow: number;
  listings: Array<{
    externalId: string;
    section: string;
    row: string;
    priceCents: number;
    quantity: number;
    source: 'primary' | 'resale';
  }>;
}> = [
  {
    externalId: 'demo-evt-phoebe-bridgers',
    title: 'Phoebe Bridgers — Reunion Tour',
    kind: 'concert',
    venue: 'Climate Pledge Arena',
    daysFromNow: 21,
    listings: [
      { externalId: 'demo-list-pb-gafloor', section: 'GA Floor', row: 'GA', priceCents: 9500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-pb-sec-201', section: '201', row: 'F', priceCents: 7250, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-pb-sec-312', section: '312', row: 'L', priceCents: 4850, quantity: 4, source: 'resale' },
    ],
  },
  {
    externalId: 'demo-evt-sounders-vs-lafc',
    title: 'Seattle Sounders vs LAFC',
    kind: 'sports',
    venue: 'Lumen Field',
    daysFromNow: 12,
    listings: [
      { externalId: 'demo-list-sounders-sec-121', section: '121', row: '12', priceCents: 8500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-sounders-sec-247', section: '247', row: '4', priceCents: 5500, quantity: 4, source: 'primary' },
      { externalId: 'demo-list-sounders-gga', section: 'GGA', row: 'Standing', priceCents: 4200, quantity: 2, source: 'resale' },
    ],
  },
  {
    externalId: 'demo-evt-hamilton-asheville',
    title: 'Hamilton',
    kind: 'theater',
    venue: 'Thomas Wolfe Auditorium',
    daysFromNow: 45,
    listings: [
      { externalId: 'demo-list-ham-orch-c', section: 'Orchestra Center', row: 'C', priceCents: 18500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-ham-mezz-g', section: 'Mezzanine', row: 'G', priceCents: 12500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-ham-bal-m', section: 'Balcony', row: 'M', priceCents: 7500, quantity: 4, source: 'primary' },
    ],
  },
  {
    externalId: 'demo-evt-comedy-nate-bargatze',
    title: 'Nate Bargatze Live',
    kind: 'comedy',
    venue: 'Paramount Theatre',
    daysFromNow: 7,
    listings: [
      { externalId: 'demo-list-nb-orch-e', section: 'Orchestra', row: 'E', priceCents: 11500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-nb-mezz-c', section: 'Mezzanine', row: 'C', priceCents: 8500, quantity: 2, source: 'primary' },
      { externalId: 'demo-list-nb-bal-j', section: 'Balcony', row: 'J', priceCents: 5500, quantity: 4, source: 'primary' },
    ],
  },
];

// -----------------------------------------------------------------------------
// Category resolution
// -----------------------------------------------------------------------------

async function getCategoryIdsBySlug(
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug');
  if (error) throw new Error(`fetch categories: ${error.message}`);
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    out[row.slug] = row.id;
  }
  return out;
}

// -----------------------------------------------------------------------------
// Seed bookable businesses (MVP-native path)
// -----------------------------------------------------------------------------
//
// For each bookable fixture category: insert 2 businesses, each with 4
// services, 1 staff member, staff_services links, and a M–F 9AM–5PM
// availability rule set (5 rules per staff).

type SeededBusiness = {
  id: string;
  name: string;
  categoryKey: CategoryKey;
  ownerId: string;
  staffId: string;
  services: Array<{ id: string; name: string; durationMin: number; priceCents: number }>;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function picsumUrl(seed: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${slugify(seed)}/${w}/${h}`;
}

async function seedBookableBusinesses(
  supabase: SupabaseClient,
  userIds: Record<string, string>,
  categoryIds: Record<string, string>,
): Promise<SeededBusiness[]> {
  const seeded: SeededBusiness[] = [];

  for (const fixture of BOOKABLE_FIXTURES) {
    const providerEmail = `${DEMO_EMAIL_PREFIX}provider-${fixture.categoryKey}@orvo.app`;
    const ownerId = userIds[providerEmail];
    if (!ownerId) {
      throw new Error(`Missing provider user for ${fixture.categoryKey}`);
    }
    const categoryId = categoryIds[fixture.mvpCategorySlug];
    if (!categoryId) {
      throw new Error(
        `Missing MVP category slug "${fixture.mvpCategorySlug}" for ${fixture.categoryKey}`,
      );
    }

    for (const biz of fixture.businesses) {
      // 1. Insert the business row.
      const address = buildAddress(biz.city, biz.state, biz.slug);
      const { data: bizRow, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name: biz.name,
          slug: biz.slug,
          category_id: categoryId,
          description: biz.description,
          address,
          // Populate the PostGIS `location` column too. Mobile reads
          // lat/lng from `address` (JSON-safe over PostgREST), but any
          // future server-side proximity queries benefit from the real
          // geography value + GIST index.
          location: buildLocationWkt(address.lat, address.lng),
          phone: '+12065551234',
          email: `hello@${biz.slug.replace(/^demo-/, '')}.com`,
          website: `https://${biz.slug.replace(/^demo-/, '')}.com`,
          logo_url: picsumUrl(`${biz.slug}-logo`, 200, 200),
          cover_image_url: picsumUrl(`${biz.slug}-cover`, 1200, 600),
          approval_status: 'approved',
          subscription_tier: 'pro',
          stripe_account_id: `acct_demo_${biz.slug.replace(/-/g, '_')}`,
        })
        .select('id')
        .single();
      if (bizErr) throw new Error(`insert business ${biz.name}: ${bizErr.message}`);

      // 2. Business photos (3 per business).
      for (let i = 0; i < 3; i++) {
        await supabase.from('business_photos').insert({
          business_id: bizRow.id,
          photo_url: picsumUrl(`${biz.slug}-photo-${i}`, 1200, 800),
          caption: null,
          display_order: i,
        });
      }

      // 3. Staff member.
      const { data: staffRow, error: staffErr } = await supabase
        .from('staff')
        .insert({
          business_id: bizRow.id,
          name: biz.staffName,
          email: `${slugify(biz.staffName)}@${biz.slug.replace(/^demo-/, '')}.com`,
          bio: biz.staffBio,
          avatar_url: picsumUrl(`${biz.slug}-staff`, 300, 300),
          is_active: true,
        })
        .select('id')
        .single();
      if (staffErr) throw new Error(`insert staff for ${biz.name}: ${staffErr.message}`);

      // 4. Services.
      const seededServices: SeededBusiness['services'] = [];
      for (let i = 0; i < biz.services.length; i++) {
        const svc = biz.services[i];
        const { data: svcRow, error: svcErr } = await supabase
          .from('services')
          .insert({
            business_id: bizRow.id,
            name: svc.name,
            description: svc.description,
            price_cents: svc.priceCents,
            price_type: 'fixed',
            duration_minutes: svc.durationMin,
            is_active: true,
            display_order: i,
          })
          .select('id')
          .single();
        if (svcErr) throw new Error(`insert service ${svc.name}: ${svcErr.message}`);
        seededServices.push({
          id: svcRow.id,
          name: svc.name,
          durationMin: svc.durationMin,
          priceCents: svc.priceCents,
        });

        // Staff can perform every service.
        await supabase
          .from('staff_services')
          .insert({ staff_id: staffRow.id, service_id: svcRow.id });
      }

      // 5. Availability rules: M–F 9AM–5PM (days 1..5).
      for (let day = 1; day <= 5; day++) {
        await supabase.from('availability_rules').insert({
          staff_id: staffRow.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        });
      }

      seeded.push({
        id: bizRow.id,
        name: biz.name,
        categoryKey: fixture.categoryKey,
        ownerId,
        staffId: staffRow.id,
        services: seededServices,
      });
    }
  }

  return seeded;
}

// -----------------------------------------------------------------------------
// Seed super-app vertical content
// -----------------------------------------------------------------------------

async function seedSuperAppContent(
  supabase: SupabaseClient,
  consumerIds: string[],
): Promise<{
  merchants: number;
  products: number;
  quotes: number;
  events: number;
  trips: number;
}> {
  // -------- delivery_merchants + delivery_items --------
  let mCount = 0;
  for (const m of DELIVERY_MERCHANTS) {
    const { data: merchantRow, error: mErr } = await supabase
      .from('delivery_merchants')
      .insert({
        provider: DEMO_PROVIDER,
        external_id: m.externalId,
        name: m.name,
        category: m.category,
        rating: m.rating,
        avg_prep_minutes: m.avgPrepMinutes,
        raw: { demo: true },
      })
      .select('id')
      .single();
    if (mErr) throw new Error(`insert delivery merchant ${m.name}: ${mErr.message}`);
    mCount++;

    for (const item of m.items) {
      await supabase.from('delivery_items').insert({
        merchant_id: merchantRow.id,
        name: item.name,
        description: item.description,
        price_amount: item.priceCents,
        currency: DEMO_CURRENCY,
        media: [],
        category: m.category,
      });
    }
  }

  // -------- products + product_offers --------
  //
  // Each product gets four competing offers so the super-app `/compare`
  // tile demonstrates real price comparison. Prices are spread around
  // the product's MSRP (`prod.priceCents`) — one offer per "retailer"
  // at 100/96/102/99 percent, so the cheapest slot rotates across
  // retailers and the card renders as "Best of 4 retailers".
  //
  // Offer rows don't need `provider = DEMO_PROVIDER` for wipe safety:
  // re-seed deletes products by fingerprint prefix, which cascades to
  // product_offers via the FK. See the wipe block above.
  const COMPARE_RETAILERS = [
    { provider: 'Amazon', pct: 100, shipDays: 2 },
    { provider: 'Walmart', pct: 96, shipDays: 3 },
    { provider: 'Target', pct: 102, shipDays: 4 },
    { provider: 'Best Buy', pct: 99, shipDays: 5 },
  ] as const;

  let pCount = 0;
  for (const prod of PRODUCTS) {
    const { data: prodRow, error: prodErr } = await supabase
      .from('products')
      .insert({
        title: prod.title,
        brand: prod.brand,
        description: prod.description,
        category: prod.category,
        fingerprint: `${DEMO_FINGERPRINT_PREFIX}${prod.fingerprint}`,
        media: [{ url: picsumUrl(prod.imageSeed, 1000, 1000) }],
      })
      .select('id')
      .single();
    if (prodErr) throw new Error(`insert product ${prod.title}: ${prodErr.message}`);

    for (const retailer of COMPARE_RETAILERS) {
      const offerAmount = Math.round((prod.priceCents * retailer.pct) / 100);
      const slug = retailer.provider.toLowerCase().replace(/\s+/g, '-');
      await supabase.from('product_offers').insert({
        product_id: prodRow.id,
        provider: retailer.provider,
        external_id: `${slug}-${prod.fingerprint}`,
        price_amount: offerAmount,
        currency: DEMO_CURRENCY,
        url: `https://${slug}.example.com/products/${prod.fingerprint}`,
        in_stock: true,
        shipping_eta_days: retailer.shipDays,
      });
    }
    pCount++;
  }

  // -------- rideshare_quotes --------
  // geography fields are required on this table. We use a fixed pickup
  // (downtown Seattle) and dropoff (SeaTac airport). WKT is the portable
  // way to set a geography column via the REST API.
  const pickup = 'SRID=4326;POINT(-122.3321 47.6062)';
  const dropoff = 'SRID=4326;POINT(-122.3088 47.4502)';
  let qCount = 0;
  for (const q of RIDESHARE_QUOTES) {
    const { error } = await supabase.from('rideshare_quotes').insert({
      provider: DEMO_PROVIDER,
      product_type: q.productType,
      pickup,
      dropoff,
      eta_seconds: q.etaSeconds,
      price_amount: q.priceCents,
      currency: DEMO_CURRENCY,
      surge_multiplier: q.surgeMultiplier,
      capacity: q.capacity,
    });
    if (error) throw new Error(`insert rideshare quote: ${error.message}`);
    qCount++;
  }

  // -------- tickets_events + tickets_listings --------
  let eCount = 0;
  for (const evt of TICKET_EVENTS) {
    const startsAt = new Date(
      Date.now() + evt.daysFromNow * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: eventRow, error: eErr } = await supabase
      .from('tickets_events')
      .insert({
        provider: DEMO_PROVIDER,
        external_id: evt.externalId,
        title: evt.title,
        kind: evt.kind,
        venue: evt.venue,
        starts_at: startsAt,
        media: [{ url: picsumUrl(evt.externalId, 1200, 600) }],
      })
      .select('id')
      .single();
    if (eErr) throw new Error(`insert ticket event ${evt.title}: ${eErr.message}`);
    eCount++;

    for (const listing of evt.listings) {
      await supabase.from('tickets_listings').insert({
        event_id: eventRow.id,
        provider: DEMO_PROVIDER,
        external_id: listing.externalId,
        section: listing.section,
        row: listing.row,
        seat: null,
        quantity: listing.quantity,
        price_amount: listing.priceCents,
        currency: DEMO_CURRENCY,
        source: listing.source,
      });
    }
  }

  // -------- trips + trip_items (travel, hotel-direct, experiences) --------
  // Assign trips to the first two consumers. Each trip has 3 items
  // (hotel, activity, restaurant).
  const tripSpecs = [
    {
      consumerId: consumerIds[0],
      title: 'Asheville Weekend Getaway',
      startDaysFromNow: 14,
      endDaysFromNow: 17,
      items: [
        { kind: 'hotel' as const, title: 'The Omni Grove Park Inn', daysOffset: 0, priceCents: 38900 },
        { kind: 'experience' as const, title: 'Blue Ridge Parkway Hike', daysOffset: 1, priceCents: 0 },
        { kind: 'restaurant' as const, title: 'Dinner at Cúrate', daysOffset: 1, priceCents: 12500 },
      ],
    },
    {
      consumerId: consumerIds[1],
      title: 'Seattle Food & Music Trip',
      startDaysFromNow: 30,
      endDaysFromNow: 34,
      items: [
        { kind: 'hotel' as const, title: 'Kimpton Hotel Monaco Seattle', daysOffset: 0, priceCents: 22900 },
        { kind: 'experience' as const, title: 'Pike Place Market Food Tour', daysOffset: 1, priceCents: 6500 },
        { kind: 'experience' as const, title: 'Chihuly Garden & Glass', daysOffset: 2, priceCents: 3800 },
      ],
    },
  ];

  let tCount = 0;
  for (const trip of tripSpecs) {
    if (!trip.consumerId) continue;
    const startDate = new Date(
      Date.now() + trip.startDaysFromNow * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    const endDate = new Date(
      Date.now() + trip.endDaysFromNow * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    const { data: tripRow, error: tErr } = await supabase
      .from('trips')
      .insert({
        user_id: trip.consumerId,
        title: trip.title,
        start_date: startDate,
        end_date: endDate,
        cover_media: { url: picsumUrl(trip.title, 1200, 600) },
      })
      .select('id')
      .single();
    if (tErr) throw new Error(`insert trip ${trip.title}: ${tErr.message}`);
    tCount++;

    for (const item of trip.items) {
      const startsAt = new Date(
        Date.now() +
          (trip.startDaysFromNow + item.daysOffset) * 24 * 60 * 60 * 1000,
      ).toISOString();
      await supabase.from('trip_items').insert({
        trip_id: tripRow.id,
        kind: item.kind,
        provider: DEMO_PROVIDER,
        external_id: `${DEMO_PROVIDER}-${slugify(item.title)}`,
        title: item.title,
        starts_at: startsAt,
        price_amount: item.priceCents > 0 ? item.priceCents : null,
        currency: item.priceCents > 0 ? DEMO_CURRENCY : null,
      });
    }
  }

  return {
    merchants: mCount,
    products: pCount,
    quotes: qCount,
    events: eCount,
    trips: tCount,
  };
}

// -----------------------------------------------------------------------------
// Seed bookings
// -----------------------------------------------------------------------------
//
// Creates ~60 bookings across 3 consumers and 12 businesses:
//   20 past-completed (payment_status='captured', status='completed')
//   25 upcoming confirmed (payment_status='captured', status='confirmed')
//   10 pending (payment_status='pending', status='pending')
//    5 cancelled (payment_status='refunded', status='cancelled')
//
// Returns the subset of completed bookings so the caller can attach reviews.

type SeededBooking = {
  id: string;
  consumerId: string;
  businessId: string;
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function seedBookings(
  supabase: SupabaseClient,
  consumerIds: string[],
  businesses: SeededBusiness[],
): Promise<{ completed: SeededBooking[]; totalCreated: number }> {
  const completed: SeededBooking[] = [];
  let total = 0;

  type Spec = {
    count: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    paymentStatus: 'pending' | 'captured' | 'refunded';
    startOffsetDaysRange: [number, number]; // negative = past
  };

  const specs: Spec[] = [
    { count: 20, status: 'completed', paymentStatus: 'captured', startOffsetDaysRange: [-90, -1] },
    { count: 25, status: 'confirmed', paymentStatus: 'captured', startOffsetDaysRange: [1, 14] },
    { count: 10, status: 'pending', paymentStatus: 'pending', startOffsetDaysRange: [3, 21] },
    { count: 5, status: 'cancelled', paymentStatus: 'refunded', startOffsetDaysRange: [-5, 7] },
  ];

  let idx = 0;
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i++) {
      const consumer = pick(consumerIds, idx);
      const biz = pick(businesses, idx);
      const service = pick(biz.services, idx);

      const [minDays, maxDays] = spec.startOffsetDaysRange;
      const spanDays = minDays + ((idx * 3) % (maxDays - minDays + 1));
      // Anchor start time to a clean 10am/1pm/3pm slot for readability.
      const hourSlots = [10, 13, 15];
      const hour = hourSlots[idx % hourSlots.length];
      const start = new Date(Date.now() + spanDays * 24 * 60 * 60 * 1000);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + service.durationMin * 60 * 1000);

      const row: Record<string, unknown> = {
        consumer_id: consumer,
        business_id: biz.id,
        service_id: service.id,
        staff_id: biz.staffId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: spec.status,
        total_cents: service.priceCents,
        deposit_cents: 0,
        payment_status: spec.paymentStatus,
      };

      if (spec.status === 'completed') {
        row.completed_at = end.toISOString();
      }
      if (spec.status === 'cancelled') {
        row.cancelled_at = new Date(
          Date.now() - (i + 1) * 24 * 60 * 60 * 1000,
        ).toISOString();
        row.cancellation_reason = 'Schedule conflict';
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(row)
        .select('id')
        .single();
      if (error) throw new Error(`insert booking: ${error.message}`);
      total++;

      if (spec.status === 'completed') {
        completed.push({
          id: data.id,
          consumerId: consumer,
          businessId: biz.id,
        });
      }
      idx++;
    }
  }

  return { completed, totalCreated: total };
}

// -----------------------------------------------------------------------------
// Seed reviews + refresh denormalized rating
// -----------------------------------------------------------------------------

async function seedReviews(
  supabase: SupabaseClient,
  completedBookings: SeededBooking[],
): Promise<number> {
  // Take the first 20 completed bookings and attach reviews.
  const reviewable = completedBookings.slice(0, 20);

  const ratingsPool = [5, 5, 5, 5, 4, 4, 4, 3];
  const commentsPool = [
    'Incredible experience. Will absolutely book again.',
    'Professional, friendly, and on time. 10/10.',
    'Loved every minute of it — thank you!',
    'Great service, fair price. Highly recommend.',
    'Solid experience overall. A few small things to polish.',
    'Exactly what I needed. Thank you!',
    'Top notch.',
    'Easy to book and the quality was excellent.',
  ];

  for (let i = 0; i < reviewable.length; i++) {
    const b = reviewable[i];
    const rating = ratingsPool[i % ratingsPool.length];
    const comment = commentsPool[i % commentsPool.length];
    const { error } = await supabase.from('reviews').insert({
      booking_id: b.id,
      business_id: b.businessId,
      consumer_id: b.consumerId,
      rating,
      comment,
    });
    if (error) throw new Error(`insert review: ${error.message}`);
  }

  // Refresh denormalized avg_rating + total_reviews on each business that
  // received reviews. Supabase JS doesn't expose window aggregates cleanly
  // through the REST layer, so we do it with a pair of queries per business.
  const affectedBusinessIds = Array.from(
    new Set(reviewable.map((r) => r.businessId)),
  );

  for (const bizId of affectedBusinessIds) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', bizId)
      .eq('is_removed', false);
    const ratings = (reviews ?? []).map((r: { rating: number }) => r.rating);
    if (ratings.length === 0) continue;
    const avg =
      Math.round(
        (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100,
      ) / 100;
    await supabase
      .from('businesses')
      .update({ avg_rating: avg, total_reviews: ratings.length })
      .eq('id', bizId);
  }

  return reviewable.length;
}

// -----------------------------------------------------------------------------
// Seed favorites
// -----------------------------------------------------------------------------

async function seedFavorites(
  supabase: SupabaseClient,
  consumerIds: string[],
  businesses: SeededBusiness[],
): Promise<number> {
  let count = 0;
  for (let c = 0; c < consumerIds.length; c++) {
    // Each consumer favorites 4 distinct businesses, staggered.
    for (let i = 0; i < 4; i++) {
      const biz = businesses[(c * 4 + i) % businesses.length];
      const { error } = await supabase
        .from('favorites')
        .insert({ consumer_id: consumerIds[c], business_id: biz.id });
      if (error && !error.message.includes('duplicate')) {
        throw new Error(`insert favorite: ${error.message}`);
      }
      if (!error) count++;
    }
  }
  return count;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Orvo demo seed — starting');
  assertSafeToSeed();

  const supabase = adminClient();

  console.log('\n[1/8] Wiping existing demo data...');
  const wipe = await wipeExistingDemo(supabase);
  console.log(
    `      deleted ${wipe.authUsersDeleted} auth users, ${wipe.bookingsDeleted} bookings, ${wipe.superAppRowsDeleted} super-app rows`,
  );

  console.log('\n[2/8] Creating demo auth users...');
  const specs = buildUserSpecs();
  const userIds = await createAuthUsers(supabase, specs);
  const consumerCount = specs.filter((s) => s.role === 'consumer').length;
  const providerCount = specs.filter((s) => s.role === 'provider').length;
  const adminCount = specs.filter((s) => s.role === 'admin').length;
  console.log(
    `      created ${Object.keys(userIds).length} users (${consumerCount} consumers, ${providerCount} providers, ${adminCount} admin)`,
  );

  // Derive the list of consumer IDs in insertion order — consumers 1-3.
  const consumerIds = specs
    .filter((s) => s.role === 'consumer')
    .map((s) => userIds[s.email]);

  console.log('\n[3/8] Resolving MVP category IDs...');
  const categoryIds = await getCategoryIdsBySlug(supabase);
  console.log(`      resolved ${Object.keys(categoryIds).length} categories`);

  console.log('\n[4/8] Seeding bookable businesses, services, staff, availability...');
  const seededBusinesses = await seedBookableBusinesses(
    supabase,
    userIds,
    categoryIds,
  );
  const totalServices = seededBusinesses.reduce(
    (acc, b) => acc + b.services.length,
    0,
  );
  console.log(
    `      seeded ${seededBusinesses.length} businesses, ${totalServices} services`,
  );

  console.log('\n[5/8] Seeding super-app vertical content...');
  const superApp = await seedSuperAppContent(supabase, consumerIds);
  console.log(
    `      seeded ${superApp.merchants} merchants, ${superApp.products} products, ${superApp.quotes} rideshare quotes, ${superApp.events} events, ${superApp.trips} trips`,
  );

  console.log('\n[6/8] Seeding bookings...');
  const bookings = await seedBookings(supabase, consumerIds, seededBusinesses);
  console.log(
    `      seeded ${bookings.totalCreated} bookings (${bookings.completed.length} completed)`,
  );

  console.log('\n[7/8] Seeding reviews...');
  const reviewCount = await seedReviews(supabase, bookings.completed);
  console.log(`      seeded ${reviewCount} reviews`);

  console.log('\n[8/8] Seeding favorites...');
  const favCount = await seedFavorites(supabase, consumerIds, seededBusinesses);
  console.log(`      seeded ${favCount} favorites`);

  console.log('\nDone.');
  console.log('\nDemo logins (password for all: ' + DEMO_PASSWORD + '):');
  console.log(`  Consumer: ${DEMO_EMAIL_PREFIX}consumer-1@orvo.app`);
  console.log(`  Provider: ${DEMO_EMAIL_PREFIX}provider-beauty-wellness@orvo.app`);
  console.log(`  Admin:    ${DEMO_EMAIL_PREFIX}admin@orvo.app`);
  console.log('');
  console.log('Summary:');
  console.log(`  Users:       ${Object.keys(userIds).length}`);
  console.log(`  Businesses:  ${seededBusinesses.length}`);
  console.log(`  Services:    ${totalServices}`);
  console.log(`  Bookings:    ${bookings.totalCreated}`);
  console.log(`  Reviews:     ${reviewCount}`);
  console.log(`  Favorites:   ${favCount}`);
  console.log(`  Merchants:   ${superApp.merchants}`);
  console.log(`  Products:    ${superApp.products}`);
  console.log(`  Quotes:      ${superApp.quotes}`);
  console.log(`  Events:      ${superApp.events}`);
  console.log(`  Trips:       ${superApp.trips}`);
}

main().catch((err) => {
  console.error('\nseed:demo failed:');
  console.error(err);
  process.exit(1);
});
