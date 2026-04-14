/**
 * Provider manifest — the source of truth for `gen-stub-adapter.ts`.
 *
 * This list mirrors `db/seeds/20260414_integration_providers.sql` minus
 * the five reference adapters (OpenTable, Uber, Shopify, Ticketmaster,
 * Expedia) that are implemented by hand. Keep the two in sync when
 * adding providers: a row must appear in both the SQL seed and this
 * manifest.
 *
 * Keys use the same snake_case form as the SQL seed so the registry
 * `key` lookup matches across server boot and generated adapter output.
 */
import type { StubSpec } from './gen-stub-adapter';

export const MANIFEST: StubSpec[] = [
  // Restaurants (7) — opentable is a reference adapter
  { key: 'resy', category: 'restaurants', displayName: 'Resy' },
  { key: 'tock', category: 'restaurants', displayName: 'Tock' },
  { key: 'sevenrooms', category: 'restaurants', displayName: 'SevenRooms' },
  { key: 'yelp_guest_manager', category: 'restaurants', displayName: 'Yelp Guest Manager' },
  { key: 'eat_app', category: 'restaurants', displayName: 'Eat App' },
  { key: 'toast_tables', category: 'restaurants', displayName: 'Toast Tables' },
  { key: 'touchbistro', category: 'restaurants', displayName: 'TouchBistro' },

  // Delivery (7)
  { key: 'uber_eats', category: 'delivery', displayName: 'Uber Eats' },
  { key: 'doordash', category: 'delivery', displayName: 'DoorDash' },
  { key: 'grubhub', category: 'delivery', displayName: 'Grubhub' },
  { key: 'skip', category: 'delivery', displayName: 'SkipTheDishes' },
  { key: 'just_eat', category: 'delivery', displayName: 'Just Eat' },
  { key: 'toast_ordering', category: 'delivery', displayName: 'Toast Ordering' },
  { key: 'square_online_ordering', category: 'delivery', displayName: 'Square Online Ordering' },

  // Beauty & Wellness (7)
  { key: 'fresha', category: 'beauty-wellness', displayName: 'Fresha' },
  { key: 'vagaro', category: 'beauty-wellness', displayName: 'Vagaro' },
  { key: 'glossgenius', category: 'beauty-wellness', displayName: 'GlossGenius' },
  { key: 'boulevard', category: 'beauty-wellness', displayName: 'Boulevard' },
  { key: 'phorest', category: 'beauty-wellness', displayName: 'Phorest' },
  { key: 'booksy', category: 'beauty-wellness', displayName: 'Booksy' },
  { key: 'zenoti', category: 'beauty-wellness', displayName: 'Zenoti' },

  // Medspa (3)
  { key: 'pabau', category: 'medspa', displayName: 'Pabau' },
  { key: 'mangomint', category: 'medspa', displayName: 'Mangomint' },
  { key: 'jane', category: 'medspa', displayName: 'Jane' },

  // Fitness (2)
  { key: 'mindbody', category: 'fitness', displayName: 'Mindbody' },
  { key: 'classpass', category: 'fitness', displayName: 'ClassPass' },

  // General booking (9)
  { key: 'square_appointments', category: 'general-booking', displayName: 'Square Appointments' },
  { key: 'acuity', category: 'general-booking', displayName: 'Acuity Scheduling' },
  { key: 'calendly', category: 'general-booking', displayName: 'Calendly' },
  { key: 'setmore', category: 'general-booking', displayName: 'Setmore' },
  { key: 'simplybook', category: 'general-booking', displayName: 'SimplyBook.me' },
  { key: 'bookeo', category: 'general-booking', displayName: 'Bookeo' },
  { key: 'appointy', category: 'general-booking', displayName: 'Appointy' },
  { key: 'wix_bookings', category: 'general-booking', displayName: 'Wix Bookings' },
  { key: 'zoho_bookings', category: 'general-booking', displayName: 'Zoho Bookings' },

  // Shopify booking apps (6)
  { key: 'cowlendar', category: 'shopify-booking', displayName: 'Cowlendar' },
  { key: 'meety', category: 'shopify-booking', displayName: 'Meety' },
  { key: 'bookx', category: 'shopify-booking', displayName: 'BookX' },
  { key: 'appointo', category: 'shopify-booking', displayName: 'Appointo' },
  { key: 'bta', category: 'shopify-booking', displayName: 'Book That App (BTA)' },
  { key: 'easy_appointment', category: 'shopify-booking', displayName: 'Easy Appointment' },

  // Travel (8) — expedia is a reference adapter
  { key: 'booking_com', category: 'travel', displayName: 'Booking.com' },
  { key: 'hotels_com', category: 'travel', displayName: 'Hotels.com' },
  { key: 'kayak', category: 'travel', displayName: 'KAYAK' },
  { key: 'skyscanner', category: 'travel', displayName: 'Skyscanner' },
  { key: 'trip_com', category: 'travel', displayName: 'Trip.com' },
  { key: 'airbnb', category: 'travel', displayName: 'Airbnb' },
  { key: 'vrbo', category: 'travel', displayName: 'Vrbo' },
  { key: 'turo', category: 'travel', displayName: 'Turo' },

  // Hotel direct (4)
  { key: 'siteminder', category: 'hotel-direct', displayName: 'SiteMinder' },
  { key: 'cloudbeds', category: 'hotel-direct', displayName: 'Cloudbeds' },
  { key: 'little_hotelier', category: 'hotel-direct', displayName: 'Little Hotelier' },
  { key: 'resnexus', category: 'hotel-direct', displayName: 'ResNexus' },

  // Experiences (6)
  { key: 'viator', category: 'experiences', displayName: 'Viator' },
  { key: 'getyourguide', category: 'experiences', displayName: 'GetYourGuide' },
  { key: 'klook', category: 'experiences', displayName: 'Klook' },
  { key: 'tripadvisor', category: 'experiences', displayName: 'Tripadvisor' },
  { key: 'airbnb_experiences', category: 'experiences', displayName: 'Airbnb Experiences' },
  { key: 'booking_attractions', category: 'experiences', displayName: 'Booking.com Attractions' },

  // Rideshare (4) — uber is a reference adapter
  { key: 'lyft', category: 'rideshare', displayName: 'Lyft' },
  { key: 'didi', category: 'rideshare', displayName: 'DiDi' },
  { key: 'grab', category: 'rideshare', displayName: 'Grab' },
  { key: 'bolt', category: 'rideshare', displayName: 'Bolt' },

  // Grocery (6)
  { key: 'instacart', category: 'grocery', displayName: 'Instacart' },
  { key: 'uber_eats_grocery', category: 'grocery', displayName: 'Uber Eats Grocery' },
  { key: 'doordash_grocery', category: 'grocery', displayName: 'DoorDash Grocery' },
  { key: 'skip_grocery', category: 'grocery', displayName: 'Skip Grocery' },
  { key: 'just_eat_grocery', category: 'grocery', displayName: 'Just Eat Grocery' },
  { key: 'grabmart', category: 'grocery', displayName: 'GrabMart' },

  // Tickets (3) — ticketmaster is a reference adapter
  { key: 'eventbrite', category: 'tickets', displayName: 'Eventbrite' },
  { key: 'stubhub', category: 'tickets', displayName: 'StubHub' },
  { key: 'axs', category: 'tickets', displayName: 'AXS' },

  // Home services (4)
  { key: 'thumbtack', category: 'home-services', displayName: 'Thumbtack' },
  { key: 'taskrabbit', category: 'home-services', displayName: 'TaskRabbit' },
  { key: 'angi', category: 'home-services', displayName: 'Angi' },
  { key: 'bark', category: 'home-services', displayName: 'Bark' },

  // Pet care (2)
  { key: 'rover', category: 'pet-care', displayName: 'Rover' },
  { key: 'wag', category: 'pet-care', displayName: 'Wag' },

  // Ecommerce (6) — shopify is a reference adapter
  { key: 'woocommerce', category: 'ecommerce', displayName: 'WooCommerce' },
  { key: 'bigcommerce', category: 'ecommerce', displayName: 'BigCommerce' },
  { key: 'adobe_commerce', category: 'ecommerce', displayName: 'Adobe Commerce' },
  { key: 'squarespace', category: 'ecommerce', displayName: 'Squarespace' },
  { key: 'square_online', category: 'ecommerce', displayName: 'Square Online' },
  { key: 'ecwid', category: 'ecommerce', displayName: 'Ecwid' },
];
