import { test, expect } from '@playwright/test';

/**
 * Trips module smoke — landing + "new trip" pages must render with a
 * "Trips" heading so the route group is reachable. Trip creation flow
 * comes after the scaffold.
 */
test('trips landing page renders', async ({ page }) => {
  await page.goto('/trips');
  await expect(page.getByRole('heading', { name: /Trips/i })).toBeVisible();
});

test('new-trip page renders', async ({ page }) => {
  await page.goto('/trips/new');
  await expect(
    page.getByRole('heading', { name: /Plan a new trip/i }),
  ).toBeVisible();
});
