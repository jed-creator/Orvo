import { test, expect } from '@playwright/test';

/**
 * Shop module smoke — the landing page must render a "Shop" heading so
 * the route group wiring is visibly working. The search API contract is
 * covered by the vitest route handler test, not here.
 */
test('shop landing page renders', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: /Shop/i })).toBeVisible();
});
