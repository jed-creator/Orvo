import { test, expect } from '@playwright/test';

/**
 * Phase 8 UI — profile sub-routes auth-gating.
 *
 * Every `/profile/*` page lives under `(dashboard)/`, so the parent
 * layout's auth gate redirects unauthenticated requests to `/login`.
 * If a sub-page crashed at compile time, Next.js would 500 instead of
 * 307-redirecting, so this also doubles as a smoke test that the page
 * tree builds cleanly.
 */
const PROFILE_ROUTES = [
  '/profile',
  '/profile/points',
  '/profile/wallet',
  '/profile/notifications',
  '/profile/accessibility',
  '/profile/privacy',
  '/profile/household',
];

test.describe('Profile auth-gating (Phase 8)', () => {
  for (const route of PROFILE_ROUTES) {
    test(`unauthenticated ${route} redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
