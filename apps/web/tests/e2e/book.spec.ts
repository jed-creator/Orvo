import { test, expect } from '@playwright/test';

/**
 * Book module smoke — landing page for service-appointment booking
 * (beauty/wellness, medspa, fitness, general-booking, shopify-booking).
 * Must render a "Book" heading so the route group is reachable.
 */
test('book landing page renders', async ({ page }) => {
  await page.goto('/book');
  await expect(page.getByRole('heading', { name: /Book/i })).toBeVisible();
});
