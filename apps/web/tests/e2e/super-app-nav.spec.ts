import { test, expect } from '@playwright/test';

/**
 * SuperAppNav smoke — on the home page, the nav must expose all 8
 * super-app categories as links, and clicking one must navigate to
 * the right module page. Viewport is bumped to desktop because the
 * nav is `md:flex` (hidden on narrow screens).
 */
test.use({ viewport: { width: 1280, height: 720 } });

test('super-app nav exposes all category links on the home page', async ({
  page,
}) => {
  await page.goto('/');
  const links = page.getByTestId('super-app-nav-link');
  await expect(links).toHaveCount(8);
  // Spot-check the known scaffolded targets.
  await expect(
    page.getByTestId('super-app-nav-link').filter({ hasText: 'Shop' }),
  ).toHaveAttribute('href', '/shop');
  await expect(
    page.getByTestId('super-app-nav-link').filter({ hasText: 'Compare' }),
  ).toHaveAttribute('href', '/compare');
});

test('super-app nav click-through lands on the compare page', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByTestId('super-app-nav-link')
    .filter({ hasText: 'Compare' })
    .click();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(
    page.getByRole('heading', { name: /Compare/i }),
  ).toBeVisible();
});
