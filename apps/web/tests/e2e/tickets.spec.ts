import { test, expect } from '@playwright/test';

/**
 * Tickets module smoke — must render a "Tickets" heading so the
 * route group is reachable. Event search contract is covered by the
 * vitest route handler test.
 */
test('tickets landing page renders', async ({ page }) => {
  await page.goto('/tickets');
  await expect(
    page.getByRole('heading', { name: /Tickets/i }),
  ).toBeVisible();
});
