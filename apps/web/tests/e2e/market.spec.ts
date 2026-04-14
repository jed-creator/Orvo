import { test, expect } from '@playwright/test';

/**
 * Marketplace module smoke — landing + "new listing" pages must
 * render with a "Marketplace" heading so the route group is
 * reachable. Listing creation flow is wired in the follow-up task.
 */
test('marketplace landing page renders', async ({ page }) => {
  await page.goto('/market');
  await expect(
    page.getByRole('heading', { name: /Marketplace/i }),
  ).toBeVisible();
});

test('new-listing page renders', async ({ page }) => {
  await page.goto('/market/new');
  await expect(
    page.getByRole('heading', { name: /Create a listing/i }),
  ).toBeVisible();
});
