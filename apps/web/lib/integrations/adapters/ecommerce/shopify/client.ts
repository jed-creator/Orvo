/**
 * Mock Shopify Storefront client. Returns fixture data with no HTTP.
 *
 * Real Shopify integration will instantiate this client against
 * `https://{shop}.myshopify.com/api/2024-07/graphql.json` with the
 * `X-Shopify-Storefront-Access-Token` header. Both clients share the
 * same method shape so the adapter index doesn't care which one it
 * has — swap is a one-line change.
 */
import { SHOPIFY_PRODUCTS, type ShopifyProductFixture } from './fixtures';

export class MockShopifyClient {
  async searchProducts(query: string): Promise<ShopifyProductFixture[]> {
    const needle = query.trim().toLowerCase();
    if (!needle) return [...SHOPIFY_PRODUCTS];
    return SHOPIFY_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.vendor.toLowerCase().includes(needle)
    );
  }

  async getProduct(id: string): Promise<ShopifyProductFixture> {
    const row = SHOPIFY_PRODUCTS.find((p) => p.id === id);
    if (!row) {
      throw new Error(`Shopify: unknown product ${id}`);
    }
    return row;
  }
}
