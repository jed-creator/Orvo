/**
 * Hard-coded Shopify product fixtures for mock mode.
 *
 * These mirror the shape of a real Shopify Storefront GraphQL
 * `Product` node just enough that the mapper has real fields to work
 * with. External IDs use Shopify's `gid://shopify/Product/<id>` format
 * so the adapter contract isn't silently bending to the mock.
 *
 * The products are intentionally aligned with the Compare tile's
 * seeded `public.products` catalog (Sonos / Nike / Patagonia / YETI /
 * Apple / Osprey) so the investor narrative stays consistent: the
 * same six SKUs show up in Shop (as a Shopify source) and in Compare
 * (ranked across four retailers).
 */

export type ShopifyProductFixture = {
  id: string; // gid://shopify/Product/1001
  title: string;
  description: string;
  vendor: string;
  handle: string;
  priceCents: number;
  imageUrl: string;
  rating?: number;
};

// Same picsum seeds as the super-app seed script so the image in the
// Shop tile matches the image in the Compare tile.
const picsum = (seed: string, w = 1000, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const SHOPIFY_PRODUCTS: ShopifyProductFixture[] = [
  {
    id: 'gid://shopify/Product/1001',
    title: 'Sonos Era 100 Smart Speaker',
    description:
      'Next-gen compact smart speaker with stereo sound, voice control, and Trueplay room tuning.',
    vendor: 'Sonos',
    handle: 'sonos-era-100',
    priceCents: 24900,
    imageUrl: picsum('sonos-era'),
    rating: 4.7,
  },
  {
    id: 'gid://shopify/Product/1002',
    title: 'Nike Pegasus 40 Road Running Shoes',
    description:
      'Responsive everyday trainer with React foam cushioning and a breathable mesh upper.',
    vendor: 'Nike',
    handle: 'nike-pegasus-40',
    priceCents: 13000,
    imageUrl: picsum('nike-peg'),
    rating: 4.6,
  },
  {
    id: 'gid://shopify/Product/1003',
    title: 'Patagonia Nano Puff Insulated Jacket',
    description:
      'Lightweight, packable, recycled-content synthetic insulation — a four-season layer.',
    vendor: 'Patagonia',
    handle: 'patagonia-nano-puff',
    priceCents: 24900,
    imageUrl: picsum('pata-nano'),
    rating: 4.8,
  },
  {
    id: 'gid://shopify/Product/1004',
    title: 'YETI Rambler 20oz Tumbler',
    description:
      'Double-wall vacuum insulation. Keeps drinks hot or cold for hours; dishwasher-safe.',
    vendor: 'YETI',
    handle: 'yeti-rambler-20',
    priceCents: 3500,
    imageUrl: picsum('yeti-ram'),
    rating: 4.9,
  },
  {
    id: 'gid://shopify/Product/1005',
    title: 'Apple Magic Mouse',
    description:
      'Rechargeable wireless multi-touch mouse — slim, lightweight, and pairs instantly.',
    vendor: 'Apple',
    handle: 'apple-magic-mouse-2',
    priceCents: 9900,
    imageUrl: picsum('apple-mouse'),
    rating: 4.4,
  },
  {
    id: 'gid://shopify/Product/1006',
    title: 'Osprey Atmos AG 65 Backpack',
    description:
      'Anti-gravity suspension backpack for multi-day hikes — ventilated mesh, 65L capacity.',
    vendor: 'Osprey',
    handle: 'osprey-atmos-ag-65',
    priceCents: 29000,
    imageUrl: picsum('osprey-atmos'),
    rating: 4.8,
  },
];
