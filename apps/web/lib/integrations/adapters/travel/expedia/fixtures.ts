/**
 * Expedia hotel fixtures for mock mode.
 *
 * Each hotel has a small rate table — in real Expedia these vary by
 * date, occupancy, and rate-plan; the mock keeps them flat so the
 * booking flow has deterministic inputs. Nightly rates are in cents.
 */

export type HotelFixture = {
  externalId: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  guestRating: number;
  imageUrl: string;
  location: { lat: number; lng: number };
};

export type RatePlanFixture = {
  externalSlotId: string;
  label: string;
  priceCents: number;
  refundable: boolean;
};

export const HOTELS: HotelFixture[] = [
  {
    externalId: 'xp-hotel-monaco',
    name: 'Kimpton Hotel Monaco Seattle',
    city: 'Seattle',
    country: 'USA',
    starRating: 4,
    guestRating: 4.6,
    imageUrl: 'https://example.com/media/monaco.jpg',
    location: { lat: 47.6047, lng: -122.3349 },
  },
  {
    externalId: 'xp-hotel-alexis',
    name: 'The Alexis Royal Sonesta',
    city: 'Seattle',
    country: 'USA',
    starRating: 4,
    guestRating: 4.4,
    imageUrl: 'https://example.com/media/alexis.jpg',
    location: { lat: 47.6037, lng: -122.3362 },
  },
  {
    externalId: 'xp-hotel-olympic',
    name: 'Fairmont Olympic Seattle',
    city: 'Seattle',
    country: 'USA',
    starRating: 5,
    guestRating: 4.7,
    imageUrl: 'https://example.com/media/olympic.jpg',
    location: { lat: 47.6088, lng: -122.3336 },
  },
  {
    externalId: 'xp-hotel-grove',
    name: 'Grove Park Inn',
    city: 'Asheville',
    country: 'USA',
    starRating: 4,
    guestRating: 4.5,
    imageUrl: 'https://example.com/media/grove-park.jpg',
    location: { lat: 35.6155, lng: -82.5397 },
  },
];

export const RATE_PLANS: Record<string, RatePlanFixture[]> = {
  'xp-hotel-monaco': [
    { externalSlotId: 'rate-king-nonref', label: 'King Room · Non-refundable', priceCents: 18900, refundable: false },
    { externalSlotId: 'rate-king-flex', label: 'King Room · Flexible', priceCents: 22900, refundable: true },
    { externalSlotId: 'rate-suite', label: 'Deluxe Suite', priceCents: 38900, refundable: true },
  ],
  'xp-hotel-alexis': [
    { externalSlotId: 'rate-queen', label: 'Queen Room · Standard', priceCents: 16500, refundable: false },
    { externalSlotId: 'rate-queen-flex', label: 'Queen Room · Flexible', priceCents: 19900, refundable: true },
  ],
  'xp-hotel-olympic': [
    { externalSlotId: 'rate-fairmont-king', label: 'Fairmont King', priceCents: 28900, refundable: true },
    { externalSlotId: 'rate-fairmont-suite', label: 'Fairmont Suite', priceCents: 52900, refundable: true },
  ],
  'xp-hotel-grove': [
    { externalSlotId: 'rate-main-queen', label: 'Main Inn Queen', priceCents: 24900, refundable: false },
    { externalSlotId: 'rate-main-king', label: 'Main Inn King', priceCents: 27900, refundable: true },
  ],
};
