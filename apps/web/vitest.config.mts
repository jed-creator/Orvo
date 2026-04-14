import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @orvo/web.
 *
 * Scope: unit tests for server-side utilities, API route handlers, and
 * integration adapters. React component tests will be added in Phase 4
 * once jsdom + @testing-library deps land.
 *
 * Playwright e2e tests (tests/e2e/**) are deliberately excluded — those
 * run via `npm run test:e2e`.
 *
 * The `@/*` alias mirrors apps/web/tsconfig.json so route-handler tests
 * can use the same import paths as production code.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'tests/e2e/**',
      'test-results/**',
    ],
    // Explicit globals=false so each file imports describe/it/expect directly.
    globals: false,
  },
});
