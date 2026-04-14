import { test, expect } from '@playwright/test';

/**
 * Compare module smoke — landing must render with a "Compare"
 * heading. Per-fingerprint comparison views are wired in the
 * pricing-engine task, not this scaffold.
 */
test('compare landing page renders', async ({ page }) => {
  await page.goto('/compare');
  await expect(
    page.getByRole('heading', { name: /Compare/i }),
  ).toBeVisible();
});
