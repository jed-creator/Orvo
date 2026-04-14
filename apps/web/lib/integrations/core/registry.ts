/**
 * IntegrationRegistry — in-memory registry of third-party adapters.
 *
 * API routes and server actions resolve adapters through this registry.
 * The registry is populated at server boot by `lib/integrations/bootstrap.ts`,
 * which imports every adapter module and calls `register` on the exported
 * `integrationRegistry` singleton. Adding a new provider is therefore a
 * two-step change: (1) create the adapter module, (2) import + register
 * it from bootstrap.
 *
 * Keys must be unique across the entire registry — re-registering throws.
 * That's a deliberate safety net against accidental double-registration
 * (e.g., if bootstrap imports a barrel file that itself imports the adapter).
 */
import type {
  IntegrationAdapter,
  IntegrationCategory,
} from './adapter.interface';

export class IntegrationRegistry {
  private readonly map = new Map<string, IntegrationAdapter>();

  register(adapter: IntegrationAdapter): void {
    if (!adapter.key || adapter.key.trim() === '') {
      throw new Error('Adapter key must be a non-empty string');
    }
    if (this.map.has(adapter.key)) {
      throw new Error(`Adapter ${adapter.key} already registered`);
    }
    this.map.set(adapter.key, adapter);
  }

  get(key: string): IntegrationAdapter | undefined {
    return this.map.get(key);
  }

  byCategory(category: IntegrationCategory): IntegrationAdapter[] {
    return [...this.map.values()].filter((a) => a.category === category);
  }

  list(): IntegrationAdapter[] {
    return [...this.map.values()];
  }
}

/**
 * Global singleton registry. Do not instantiate additional registries
 * in production code — use this one. Tests may instantiate their own
 * `new IntegrationRegistry()` to isolate fixtures.
 */
export const integrationRegistry = new IntegrationRegistry();
