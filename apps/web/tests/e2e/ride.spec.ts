import { test, expect } from '@playwright/test';

/**
 * Ride module smoke — landing page shows a "Ride" heading and
 * introductory copy. The quote API contract is covered by the
 * vitest route-handler test, not this smoke.
 */
test('ride landing page renders', async ({ page }) => {
  await page.goto('/ride');
  await expect(page.getByRole('heading', { name: /Ride/i })).toBeVisible();
});
