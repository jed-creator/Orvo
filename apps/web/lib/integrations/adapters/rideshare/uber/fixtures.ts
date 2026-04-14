/**
 * Fixtures for the mock Uber rideshare client.
 *
 * Real Uber pricing is distance × time × surge × product-multiplier. The
 * mock uses a flat base + per-product multiplier so different products
 * show different prices in the UI, which is the behaviour downstream
 * code cares about. Distance math lives in client.ts so the mapper can
 * stay pure.
 */

export type UberProductFixture = {
  externalId: string;
  name: string;
  description: string;
  seats: number;
  /** Multiplier applied to the base fare. UberX = 1.0, XL = 1.4, etc. */
  priceMultiplier: number;
  imageUrl: string;
};

export const UBER_PRODUCTS: UberProductFixture[] = [
  {
    externalId: 'uber-x',
    name: 'UberX',
    description: 'Affordable rides, all to yourself',
    seats: 4,
    priceMultiplier: 1.0,
    imageUrl: 'https://example.com/media/uber-x.png',
  },
  {
    externalId: 'uber-xl',
    name: 'UberXL',
    description: 'Affordable rides for groups up to 6',
    seats: 6,
    priceMultiplier: 1.4,
    imageUrl: 'https://example.com/media/uber-xl.png',
  },
  {
    externalId: 'uber-comfort',
    name: 'Uber Comfort',
    description: 'Newer cars with extra legroom',
    seats: 4,
    priceMultiplier: 1.25,
    imageUrl: 'https://example.com/media/uber-comfort.png',
  },
  {
    externalId: 'uber-black',
    name: 'Uber Black',
    description: 'Premium rides in luxury cars',
    seats: 4,
    priceMultiplier: 2.1,
    imageUrl: 'https://example.com/media/uber-black.png',
  },
  {
    externalId: 'uber-green',
    name: 'Uber Green',
    description: 'Electric and hybrid rides',
    seats: 4,
    priceMultiplier: 1.05,
    imageUrl: 'https://example.com/media/uber-green.png',
  },
];

/** Base fare in cents before product multiplier. */
export const BASE_FARE_CENTS = 899;
