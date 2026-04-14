-- =============================================================================
-- ORVO — Integration Provider Registry Seed
-- =============================================================================
-- Seeds public.integration_providers with the full catalog of third-party
-- vertical adapters. Each row describes a provider we intend to support —
-- the actual adapter implementations live in apps/web/lib/integrations/adapters.
--
-- Five providers are marked is_reference = TRUE — these are the ones we'll
-- implement end-to-end as reference integrations (OpenTable, Uber, Shopify,
-- Ticketmaster, Expedia). The rest are stubs (search + details only) that
-- will be fleshed out once we have connector agreements.
--
-- All providers default to 'search' + 'details' capabilities (the interface
-- minimum). Reference providers declare the full capability set they actually
-- implement.
--
-- Seed is idempotent: ON CONFLICT (key) DO UPDATE overwrites mutable fields
-- (display_name, capabilities, is_reference) but never re-creates rows.
-- =============================================================================

INSERT INTO public.integration_providers (key, category, display_name, capabilities, is_reference) VALUES

-- ---------- Restaurants (booking / reservations) ----------
('opentable',            'restaurants',     'OpenTable',           ARRAY['search','details','availability','book','cancel'], TRUE),
('resy',                 'restaurants',     'Resy',                ARRAY['search','details'], FALSE),
('tock',                 'restaurants',     'Tock',                ARRAY['search','details'], FALSE),
('sevenrooms',           'restaurants',     'SevenRooms',          ARRAY['search','details'], FALSE),
('yelp_guest_manager',   'restaurants',     'Yelp Guest Manager',  ARRAY['search','details'], FALSE),
('eat_app',              'restaurants',     'Eat App',             ARRAY['search','details'], FALSE),
('toast_tables',         'restaurants',     'Toast Tables',        ARRAY['search','details'], FALSE),
('touchbistro',          'restaurants',     'TouchBistro',         ARRAY['search','details'], FALSE),

-- ---------- Delivery (food) ----------
('uber_eats',            'delivery',        'Uber Eats',           ARRAY['search','details'], FALSE),
('doordash',             'delivery',        'DoorDash',            ARRAY['search','details'], FALSE),
('grubhub',              'delivery',        'Grubhub',             ARRAY['search','details'], FALSE),
('skip',                 'delivery',        'SkipTheDishes',       ARRAY['search','details'], FALSE),
('just_eat',             'delivery',        'Just Eat',            ARRAY['search','details'], FALSE),
('toast_ordering',       'delivery',        'Toast Ordering',      ARRAY['search','details'], FALSE),
('square_online_ordering','delivery',        'Square Online Ordering', ARRAY['search','details'], FALSE),

-- ---------- Beauty & Wellness ----------
('fresha',               'beauty-wellness', 'Fresha',              ARRAY['search','details'], FALSE),
('vagaro',               'beauty-wellness', 'Vagaro',              ARRAY['search','details'], FALSE),
('glossgenius',          'beauty-wellness', 'GlossGenius',         ARRAY['search','details'], FALSE),
('boulevard',            'beauty-wellness', 'Boulevard',           ARRAY['search','details'], FALSE),
('phorest',              'beauty-wellness', 'Phorest',             ARRAY['search','details'], FALSE),
('booksy',               'beauty-wellness', 'Booksy',              ARRAY['search','details'], FALSE),
('zenoti',               'beauty-wellness', 'Zenoti',              ARRAY['search','details'], FALSE),

-- ---------- Medspa / clinical practice ----------
('pabau',                'medspa',          'Pabau',               ARRAY['search','details'], FALSE),
('mangomint',            'medspa',          'Mangomint',           ARRAY['search','details'], FALSE),
('jane',                 'medspa',          'Jane',                ARRAY['search','details'], FALSE),

-- ---------- Fitness ----------
('mindbody',             'fitness',         'Mindbody',            ARRAY['search','details'], FALSE),
('classpass',            'fitness',         'ClassPass',           ARRAY['search','details'], FALSE),

-- ---------- General booking (appointment schedulers) ----------
('square_appointments',  'general-booking', 'Square Appointments', ARRAY['search','details'], FALSE),
('acuity',               'general-booking', 'Acuity Scheduling',   ARRAY['search','details'], FALSE),
('calendly',             'general-booking', 'Calendly',            ARRAY['search','details'], FALSE),
('setmore',              'general-booking', 'Setmore',             ARRAY['search','details'], FALSE),
('simplybook',           'general-booking', 'SimplyBook.me',       ARRAY['search','details'], FALSE),
('bookeo',               'general-booking', 'Bookeo',              ARRAY['search','details'], FALSE),
('appointy',             'general-booking', 'Appointy',            ARRAY['search','details'], FALSE),
('wix_bookings',         'general-booking', 'Wix Bookings',        ARRAY['search','details'], FALSE),
('zoho_bookings',        'general-booking', 'Zoho Bookings',       ARRAY['search','details'], FALSE),

-- ---------- Shopify booking apps ----------
('cowlendar',            'shopify-booking', 'Cowlendar',           ARRAY['search','details'], FALSE),
('meety',                'shopify-booking', 'Meety',               ARRAY['search','details'], FALSE),
('bookx',                'shopify-booking', 'BookX',               ARRAY['search','details'], FALSE),
('appointo',             'shopify-booking', 'Appointo',            ARRAY['search','details'], FALSE),
('bta',                  'shopify-booking', 'Book That App (BTA)', ARRAY['search','details'], FALSE),
('easy_appointment',     'shopify-booking', 'Easy Appointment',    ARRAY['search','details'], FALSE),

-- ---------- Travel (OTAs) ----------
('booking_com',          'travel',          'Booking.com',         ARRAY['search','details'], FALSE),
('expedia',              'travel',          'Expedia',             ARRAY['search','details','availability','book','cancel'], TRUE),
('hotels_com',           'travel',          'Hotels.com',          ARRAY['search','details'], FALSE),
('kayak',                'travel',          'KAYAK',               ARRAY['search','details'], FALSE),
('skyscanner',           'travel',          'Skyscanner',          ARRAY['search','details'], FALSE),
('trip_com',             'travel',          'Trip.com',            ARRAY['search','details'], FALSE),
('airbnb',               'travel',          'Airbnb',              ARRAY['search','details'], FALSE),
('vrbo',                 'travel',          'Vrbo',                ARRAY['search','details'], FALSE),
('turo',                 'travel',          'Turo',                ARRAY['search','details'], FALSE),

-- ---------- Hotel direct (PMS / channel managers) ----------
('siteminder',           'hotel-direct',    'SiteMinder',          ARRAY['search','details'], FALSE),
('cloudbeds',            'hotel-direct',    'Cloudbeds',           ARRAY['search','details'], FALSE),
('little_hotelier',      'hotel-direct',    'Little Hotelier',     ARRAY['search','details'], FALSE),
('resnexus',             'hotel-direct',    'ResNexus',            ARRAY['search','details'], FALSE),

-- ---------- Experiences / tours ----------
('viator',               'experiences',     'Viator',              ARRAY['search','details'], FALSE),
('getyourguide',         'experiences',     'GetYourGuide',        ARRAY['search','details'], FALSE),
('klook',                'experiences',     'Klook',               ARRAY['search','details'], FALSE),
('tripadvisor',          'experiences',     'Tripadvisor',         ARRAY['search','details'], FALSE),
('airbnb_experiences',   'experiences',     'Airbnb Experiences',  ARRAY['search','details'], FALSE),
('booking_attractions',  'experiences',     'Booking.com Attractions', ARRAY['search','details'], FALSE),

-- ---------- Rideshare ----------
('uber',                 'rideshare',       'Uber',                ARRAY['search','details','availability','book','cancel','webhook'], TRUE),
('lyft',                 'rideshare',       'Lyft',                ARRAY['search','details'], FALSE),
('didi',                 'rideshare',       'DiDi',                ARRAY['search','details'], FALSE),
('grab',                 'rideshare',       'Grab',                ARRAY['search','details'], FALSE),
('bolt',                 'rideshare',       'Bolt',                ARRAY['search','details'], FALSE),

-- ---------- Grocery delivery ----------
('instacart',            'grocery',         'Instacart',           ARRAY['search','details'], FALSE),
('uber_eats_grocery',    'grocery',         'Uber Eats Grocery',   ARRAY['search','details'], FALSE),
('doordash_grocery',     'grocery',         'DoorDash Grocery',    ARRAY['search','details'], FALSE),
('skip_grocery',         'grocery',         'Skip Grocery',        ARRAY['search','details'], FALSE),
('just_eat_grocery',     'grocery',         'Just Eat Grocery',    ARRAY['search','details'], FALSE),
('grabmart',             'grocery',         'GrabMart',            ARRAY['search','details'], FALSE),

-- ---------- Event tickets ----------
('ticketmaster',         'tickets',         'Ticketmaster',        ARRAY['search','details','availability','book'], TRUE),
('eventbrite',           'tickets',         'Eventbrite',          ARRAY['search','details'], FALSE),
('stubhub',              'tickets',         'StubHub',             ARRAY['search','details'], FALSE),
('axs',                  'tickets',         'AXS',                 ARRAY['search','details'], FALSE),

-- ---------- Home services ----------
('thumbtack',            'home-services',   'Thumbtack',           ARRAY['search','details'], FALSE),
('taskrabbit',           'home-services',   'TaskRabbit',          ARRAY['search','details'], FALSE),
('angi',                 'home-services',   'Angi',                ARRAY['search','details'], FALSE),
('bark',                 'home-services',   'Bark',                ARRAY['search','details'], FALSE),

-- ---------- Pet care ----------
('rover',                'pet-care',        'Rover',               ARRAY['search','details'], FALSE),
('wag',                  'pet-care',        'Wag',                 ARRAY['search','details'], FALSE),

-- ---------- Ecommerce ----------
('shopify',              'ecommerce',       'Shopify',             ARRAY['search','details','webhook'], TRUE),
('woocommerce',          'ecommerce',       'WooCommerce',         ARRAY['search','details'], FALSE),
('bigcommerce',          'ecommerce',       'BigCommerce',         ARRAY['search','details'], FALSE),
('adobe_commerce',       'ecommerce',       'Adobe Commerce',      ARRAY['search','details'], FALSE),
('squarespace',          'ecommerce',       'Squarespace',         ARRAY['search','details'], FALSE),
('square_online',        'ecommerce',       'Square Online',       ARRAY['search','details'], FALSE),
('ecwid',                'ecommerce',       'Ecwid',               ARRAY['search','details'], FALSE)

ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  capabilities = EXCLUDED.capabilities,
  is_reference = EXCLUDED.is_reference;
