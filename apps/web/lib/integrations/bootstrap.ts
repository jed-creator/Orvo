/**
 * Integration adapter bootstrap.
 *
 * GENERATED FILE — do not edit by hand. Run
 * `node apps/web/tools/scripts/gen-bootstrap.ts` to regenerate after
 * adding/removing an adapter from `tools/scripts/manifest.ts` or the
 * reference adapter list.
 *
 * The web server calls `bootstrap(integrationRegistry)` exactly once
 * at boot. It registers every adapter — both the 5 reference adapters
 * implemented by hand and the 83 stubs generated from the
 * manifest — with the shared registry so API routes and server
 * actions can resolve providers by key.
 *
 * Count: 89 adapters (5 reference + 84 stubs).
 */
import type { IntegrationAdapter, IntegrationRegistry } from './core';
import { integrationRegistry } from './core';

// -------------------- Reference adapters --------------------
import { openTableAdapter } from './adapters/restaurants/opentable';
import { uberAdapter } from './adapters/rideshare/uber';
import { shopifyAdapter } from './adapters/ecommerce/shopify';
import { ticketmasterAdapter } from './adapters/tickets/ticketmaster';
import { expediaAdapter } from './adapters/travel/expedia';

// -------------------- Stub adapters --------------------
import { resyAdapter } from './adapters/restaurants/resy';
import { tockAdapter } from './adapters/restaurants/tock';
import { sevenroomsAdapter } from './adapters/restaurants/sevenrooms';
import { yelpGuestManagerAdapter } from './adapters/restaurants/yelp_guest_manager';
import { eatAppAdapter } from './adapters/restaurants/eat_app';
import { toastTablesAdapter } from './adapters/restaurants/toast_tables';
import { touchbistroAdapter } from './adapters/restaurants/touchbistro';
import { uberEatsAdapter } from './adapters/delivery/uber_eats';
import { doordashAdapter } from './adapters/delivery/doordash';
import { grubhubAdapter } from './adapters/delivery/grubhub';
import { skipAdapter } from './adapters/delivery/skip';
import { justEatAdapter } from './adapters/delivery/just_eat';
import { toastOrderingAdapter } from './adapters/delivery/toast_ordering';
import { squareOnlineOrderingAdapter } from './adapters/delivery/square_online_ordering';
import { freshaAdapter } from './adapters/beauty-wellness/fresha';
import { vagaroAdapter } from './adapters/beauty-wellness/vagaro';
import { glossgeniusAdapter } from './adapters/beauty-wellness/glossgenius';
import { boulevardAdapter } from './adapters/beauty-wellness/boulevard';
import { phorestAdapter } from './adapters/beauty-wellness/phorest';
import { booksyAdapter } from './adapters/beauty-wellness/booksy';
import { zenotiAdapter } from './adapters/beauty-wellness/zenoti';
import { pabauAdapter } from './adapters/medspa/pabau';
import { mangomintAdapter } from './adapters/medspa/mangomint';
import { janeAdapter } from './adapters/medspa/jane';
import { mindbodyAdapter } from './adapters/fitness/mindbody';
import { classpassAdapter } from './adapters/fitness/classpass';
import { squareAppointmentsAdapter } from './adapters/general-booking/square_appointments';
import { acuityAdapter } from './adapters/general-booking/acuity';
import { calendlyAdapter } from './adapters/general-booking/calendly';
import { setmoreAdapter } from './adapters/general-booking/setmore';
import { simplybookAdapter } from './adapters/general-booking/simplybook';
import { bookeoAdapter } from './adapters/general-booking/bookeo';
import { appointyAdapter } from './adapters/general-booking/appointy';
import { wixBookingsAdapter } from './adapters/general-booking/wix_bookings';
import { zohoBookingsAdapter } from './adapters/general-booking/zoho_bookings';
import { cowlendarAdapter } from './adapters/shopify-booking/cowlendar';
import { meetyAdapter } from './adapters/shopify-booking/meety';
import { bookxAdapter } from './adapters/shopify-booking/bookx';
import { appointoAdapter } from './adapters/shopify-booking/appointo';
import { btaAdapter } from './adapters/shopify-booking/bta';
import { easyAppointmentAdapter } from './adapters/shopify-booking/easy_appointment';
import { bookingComAdapter } from './adapters/travel/booking_com';
import { hotelsComAdapter } from './adapters/travel/hotels_com';
import { kayakAdapter } from './adapters/travel/kayak';
import { skyscannerAdapter } from './adapters/travel/skyscanner';
import { tripComAdapter } from './adapters/travel/trip_com';
import { airbnbAdapter } from './adapters/travel/airbnb';
import { vrboAdapter } from './adapters/travel/vrbo';
import { turoAdapter } from './adapters/travel/turo';
import { siteminderAdapter } from './adapters/hotel-direct/siteminder';
import { cloudbedsAdapter } from './adapters/hotel-direct/cloudbeds';
import { littleHotelierAdapter } from './adapters/hotel-direct/little_hotelier';
import { resnexusAdapter } from './adapters/hotel-direct/resnexus';
import { viatorAdapter } from './adapters/experiences/viator';
import { getyourguideAdapter } from './adapters/experiences/getyourguide';
import { klookAdapter } from './adapters/experiences/klook';
import { tripadvisorAdapter } from './adapters/experiences/tripadvisor';
import { airbnbExperiencesAdapter } from './adapters/experiences/airbnb_experiences';
import { bookingAttractionsAdapter } from './adapters/experiences/booking_attractions';
import { lyftAdapter } from './adapters/rideshare/lyft';
import { didiAdapter } from './adapters/rideshare/didi';
import { grabAdapter } from './adapters/rideshare/grab';
import { boltAdapter } from './adapters/rideshare/bolt';
import { instacartAdapter } from './adapters/grocery/instacart';
import { uberEatsGroceryAdapter } from './adapters/grocery/uber_eats_grocery';
import { doordashGroceryAdapter } from './adapters/grocery/doordash_grocery';
import { skipGroceryAdapter } from './adapters/grocery/skip_grocery';
import { justEatGroceryAdapter } from './adapters/grocery/just_eat_grocery';
import { grabmartAdapter } from './adapters/grocery/grabmart';
import { eventbriteAdapter } from './adapters/tickets/eventbrite';
import { stubhubAdapter } from './adapters/tickets/stubhub';
import { axsAdapter } from './adapters/tickets/axs';
import { thumbtackAdapter } from './adapters/home-services/thumbtack';
import { taskrabbitAdapter } from './adapters/home-services/taskrabbit';
import { angiAdapter } from './adapters/home-services/angi';
import { barkAdapter } from './adapters/home-services/bark';
import { roverAdapter } from './adapters/pet-care/rover';
import { wagAdapter } from './adapters/pet-care/wag';
import { woocommerceAdapter } from './adapters/ecommerce/woocommerce';
import { bigcommerceAdapter } from './adapters/ecommerce/bigcommerce';
import { adobeCommerceAdapter } from './adapters/ecommerce/adobe_commerce';
import { squarespaceAdapter } from './adapters/ecommerce/squarespace';
import { squareOnlineAdapter } from './adapters/ecommerce/square_online';
import { ecwidAdapter } from './adapters/ecommerce/ecwid';

/**
 * Every adapter in registration order. Keeping a flat array makes it
 * trivial to iterate for registration and for audit tooling.
 */
export const ALL_ADAPTERS: IntegrationAdapter[] = [
  // Reference adapters
  openTableAdapter,
  uberAdapter,
  shopifyAdapter,
  ticketmasterAdapter,
  expediaAdapter,

  // Stub adapters (generated from manifest)
  resyAdapter,
  tockAdapter,
  sevenroomsAdapter,
  yelpGuestManagerAdapter,
  eatAppAdapter,
  toastTablesAdapter,
  touchbistroAdapter,
  uberEatsAdapter,
  doordashAdapter,
  grubhubAdapter,
  skipAdapter,
  justEatAdapter,
  toastOrderingAdapter,
  squareOnlineOrderingAdapter,
  freshaAdapter,
  vagaroAdapter,
  glossgeniusAdapter,
  boulevardAdapter,
  phorestAdapter,
  booksyAdapter,
  zenotiAdapter,
  pabauAdapter,
  mangomintAdapter,
  janeAdapter,
  mindbodyAdapter,
  classpassAdapter,
  squareAppointmentsAdapter,
  acuityAdapter,
  calendlyAdapter,
  setmoreAdapter,
  simplybookAdapter,
  bookeoAdapter,
  appointyAdapter,
  wixBookingsAdapter,
  zohoBookingsAdapter,
  cowlendarAdapter,
  meetyAdapter,
  bookxAdapter,
  appointoAdapter,
  btaAdapter,
  easyAppointmentAdapter,
  bookingComAdapter,
  hotelsComAdapter,
  kayakAdapter,
  skyscannerAdapter,
  tripComAdapter,
  airbnbAdapter,
  vrboAdapter,
  turoAdapter,
  siteminderAdapter,
  cloudbedsAdapter,
  littleHotelierAdapter,
  resnexusAdapter,
  viatorAdapter,
  getyourguideAdapter,
  klookAdapter,
  tripadvisorAdapter,
  airbnbExperiencesAdapter,
  bookingAttractionsAdapter,
  lyftAdapter,
  didiAdapter,
  grabAdapter,
  boltAdapter,
  instacartAdapter,
  uberEatsGroceryAdapter,
  doordashGroceryAdapter,
  skipGroceryAdapter,
  justEatGroceryAdapter,
  grabmartAdapter,
  eventbriteAdapter,
  stubhubAdapter,
  axsAdapter,
  thumbtackAdapter,
  taskrabbitAdapter,
  angiAdapter,
  barkAdapter,
  roverAdapter,
  wagAdapter,
  woocommerceAdapter,
  bigcommerceAdapter,
  adobeCommerceAdapter,
  squarespaceAdapter,
  squareOnlineAdapter,
  ecwidAdapter,
];

/**
 * Registers every adapter with the given registry. Called once at
 * server boot. Passing the registry in (rather than using the
 * singleton) keeps the function unit-testable against a fresh
 * registry instance.
 *
 * Not idempotent on a single registry — the core `IntegrationRegistry`
 * rejects duplicate keys, which is the intended safety net against
 * accidental double-registration.
 */
export function bootstrap(registry: IntegrationRegistry): void {
  for (const adapter of ALL_ADAPTERS) {
    registry.register(adapter);
  }
}

// Populate the shared singleton on first import so route handlers can
// just `import '@/lib/integrations/bootstrap'` and resolve adapters
// without wiring a boot hook. Guarded on the registry being empty so
// subsequent imports (HMR, other route modules) are no-ops. Tests that
// need an isolated registry instantiate `new IntegrationRegistry()`
// and call `bootstrap()` directly, which is unaffected by this block.
if (integrationRegistry.list().length === 0) {
  bootstrap(integrationRegistry);
}
