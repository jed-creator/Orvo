/**
 * Hard-coded Shopify product fixtures for mock mode.
 *
 * These mirror the shape of a real Shopify Storefront GraphQL
 * `Product` node just enough that the mapper has real fields to work
 * with. External IDs use Shopify's `gid://shopify/Product/<id>` format
 * so the adapter contract isn't silently bending to the mock.
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

export const SHOPIFY_PRODUCTS: ShopifyProductFixture[] = [
  {
    id: 'gid://shopify/Product/1001',
    title: 'Orvo Logo Hoodie',
    description: 'Heavyweight fleece hoodie with embroidered logo.',
    vendor: 'Orvo Apparel',
    handle: 'orvo-logo-hoodie',
    priceCents: 6500,
    imageUrl: 'https://example.com/media/orvo-hoodie.jpg',
    rating: 4.6,
  },
  {
    id: 'gid://shopify/Product/1002',
    title: 'Classic Hoodie — Charcoal',
    description: 'Midweight hoodie, pre-shrunk cotton blend.',
    vendor: 'Orvo Apparel',
    handle: 'classic-hoodie-charcoal',
    priceCents: 4500,
    imageUrl: 'https://example.com/media/classic-hoodie.jpg',
    rating: 4.3,
  },
  {
    id: 'gid://shopify/Product/1003',
    title: 'Enamel Pin Set',
    description: 'Five-piece enamel pin set in a card pack.',
    vendor: 'Orvo Apparel',
    handle: 'enamel-pin-set',
    priceCents: 1500,
    imageUrl: 'https://example.com/media/pin-set.jpg',
    rating: 4.8,
  },
  {
    id: 'gid://shopify/Product/1004',
    title: 'Canvas Tote',
    description: '12oz natural canvas tote, screen printed.',
    vendor: 'Orvo Apparel',
    handle: 'canvas-tote',
    priceCents: 2200,
    imageUrl: 'https://example.com/media/tote.jpg',
    rating: 4.5,
  },
];
