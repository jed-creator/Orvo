/**
 * Bootstrap generator.
 *
 * Reads the provider manifest and the hard-coded reference-adapter
 * list, then writes `apps/web/lib/integrations/bootstrap.ts` — the
 * file that imports every adapter and exposes a `bootstrap(registry)`
 * function for the web server to call at boot.
 *
 * Why a generator? Hand-maintaining 89 imports in one file is an
 * error-prone chore whenever a provider is added. Generating from the
 * same `manifest.ts` that drives stub creation keeps the two in sync
 * by construction.
 *
 * Reference adapters have hand-picked export names (`openTableAdapter`,
 * not the `toExportName` default of `opentableAdapter`), so they're
 * declared here as an explicit list rather than derived from the
 * manifest.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { toExportName, type StubSpec } from './gen-stub-adapter.ts';
import { MANIFEST } from './manifest.ts';

type ReferenceSpec = StubSpec & { exportName: string };

/**
 * Reference adapters implemented by hand in Phase 3.2. The export
 * name is pinned per-adapter because hand-written files use natural
 * casing (e.g., `openTableAdapter`) that `toExportName` wouldn't
 * produce from the snake-case key.
 */
const REFERENCE_ADAPTERS: ReferenceSpec[] = [
  {
    key: 'opentable',
    category: 'restaurants',
    displayName: 'OpenTable',
    exportName: 'openTableAdapter',
  },
  {
    key: 'uber',
    category: 'rideshare',
    displayName: 'Uber',
    exportName: 'uberAdapter',
  },
  {
    key: 'shopify',
    category: 'ecommerce',
    displayName: 'Shopify',
    exportName: 'shopifyAdapter',
  },
  {
    key: 'ticketmaster',
    category: 'tickets',
    displayName: 'Ticketmaster',
    exportName: 'ticketmasterAdapter',
  },
  {
    key: 'expedia',
    category: 'travel',
    displayName: 'Expedia',
    exportName: 'expediaAdapter',
  },
];

type RenderInput = {
  references: ReferenceSpec[];
  stubs: StubSpec[];
};

export function renderBootstrap({ references, stubs }: RenderInput): string {
  const refImports = references
    .map(
      (r) =>
        `import { ${r.exportName} } from './adapters/${r.category}/${r.key}';`
    )
    .join('\n');

  const stubImports = stubs
    .map((s) => {
      const name = toExportName(s.key);
      return `import { ${name} } from './adapters/${s.category}/${s.key}';`;
    })
    .join('\n');

  const refEntries = references.map((r) => `  ${r.exportName},`).join('\n');
  const stubEntries = stubs.map((s) => `  ${toExportName(s.key)},`).join('\n');

  return `/**
 * Integration adapter bootstrap.
 *
 * GENERATED FILE — do not edit by hand. Run
 * \`node apps/web/tools/scripts/gen-bootstrap.ts\` to regenerate after
 * adding/removing an adapter from \`tools/scripts/manifest.ts\` or the
 * reference adapter list.
 *
 * The web server calls \`bootstrap(integrationRegistry)\` exactly once
 * at boot. It registers every adapter — both the 5 reference adapters
 * implemented by hand and the ${stubs.length} stubs generated from the
 * manifest — with the shared registry so API routes and server
 * actions can resolve providers by key.
 *
 * Count: ${references.length + stubs.length} adapters (${references.length} reference + ${stubs.length} stubs).
 */
import type { IntegrationAdapter, IntegrationRegistry } from './core';
import { integrationRegistry } from './core';

// -------------------- Reference adapters --------------------
${refImports}

// -------------------- Stub adapters --------------------
${stubImports}

/**
 * Every adapter in registration order. Keeping a flat array makes it
 * trivial to iterate for registration and for audit tooling.
 */
export const ALL_ADAPTERS: IntegrationAdapter[] = [
  // Reference adapters
${refEntries}

  // Stub adapters (generated from manifest)
${stubEntries}
];

/**
 * Registers every adapter with the given registry. Called once at
 * server boot. Passing the registry in (rather than using the
 * singleton) keeps the function unit-testable against a fresh
 * registry instance.
 *
 * Not idempotent on a single registry — the core \`IntegrationRegistry\`
 * rejects duplicate keys, which is the intended safety net against
 * accidental double-registration.
 */
export function bootstrap(registry: IntegrationRegistry): void {
  for (const adapter of ALL_ADAPTERS) {
    registry.register(adapter);
  }
}

// Populate the shared singleton on first import so route handlers can
// just \`import '@/lib/integrations/bootstrap'\` and resolve adapters
// without wiring a boot hook. Guarded on the registry being empty so
// subsequent imports (HMR, other route modules) are no-ops. Tests that
// need an isolated registry instantiate \`new IntegrationRegistry()\`
// and call \`bootstrap()\` directly, which is unaffected by this block.
if (integrationRegistry.list().length === 0) {
  bootstrap(integrationRegistry);
}
`;
}

// -----------------------------------------------------------------------
// CLI entry — writes bootstrap.ts when this file is invoked directly.
// -----------------------------------------------------------------------

function isDirectInvocation(): boolean {
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  try {
    return process.argv[1] === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  const here = dirname(fileURLToPath(import.meta.url));
  const bootstrapPath = join(
    here,
    '..',
    '..',
    'lib',
    'integrations',
    'bootstrap.ts'
  );
  mkdirSync(dirname(bootstrapPath), { recursive: true });
  const contents = renderBootstrap({
    references: REFERENCE_ADAPTERS,
    stubs: MANIFEST,
  });
  writeFileSync(bootstrapPath, contents);
  console.log(
    `Wrote ${bootstrapPath}\n  ${REFERENCE_ADAPTERS.length} reference + ${MANIFEST.length} stubs = ${REFERENCE_ADAPTERS.length + MANIFEST.length} adapters.`
  );
}
