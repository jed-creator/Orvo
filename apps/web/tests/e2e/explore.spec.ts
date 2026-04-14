import { test, expect } from '@playwright/test';

/**
 * Explore hub smoke — /explore must render the category grid with
 * all 8 seeded tiles (shop, eat, ride, trips, tickets, market, book,
 * compare). The page falls back to a compiled-in seed when Supabase
 * is unreachable, so this test is deterministic in CI.
 */
test('explore hub renders all 8 category tiles', async ({ page }) => {
  await page.goto('/explore');
  await expect(
    page.getByRole('heading', { name: /Explore/i }),
  ).toBeVisible();
  const tiles = page.getByTestId('category-tile');
  await expect(tiles).toHaveCount(8);
});
