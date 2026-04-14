/**
 * Adapter conformance check.
 *
 * Every adapter must pass `assertAdapterConforms` at registration time.
 * This enforces two things that TypeScript alone can't:
 *
 * 1. The `key`, `displayName`, `category`, and `capabilities` fields
 *    are valid at runtime (not empty strings, not unknown enum values).
 *    Stub adapters and test fixtures are easy to get wrong.
 *
 * 2. The adapter's declared capabilities match its implemented methods.
 *    If an adapter says `capabilities: ['book']` but doesn't implement
 *    `book`, callers will get an uncaught TypeError in production. Vice
 *    versa: if an adapter implements `book` without declaring it, the
 *    Explore hub won't surface the capability in the UI, and bookings
 *    that should work silently won't.
 *
 * Reference: the shared `IntegrationCategorySchema` and
 * `AdapterCapabilitySchema` are the source of truth for the enum values.
 */
import {
  IntegrationCategorySchema,
  AdapterCapabilitySchema,
  type IntegrationAdapter,
  type AdapterCapability,
} from './adapter.interface';

/**
 * Map from capability name → the adapter method that must be defined
 * when that capability is declared. `search` and `details` are always
 * required (they're non-optional on the interface itself), so the
 * conformance check only has to verify the optional methods.
 */
const CAPABILITY_METHOD: Record<
  Exclude<AdapterCapability, 'search' | 'details'>,
  keyof IntegrationAdapter
> = {
  availability: 'checkAvailability',
  book: 'book',
  cancel: 'cancel',
  webhook: 'handleWebhook',
};

export function assertAdapterConforms(adapter: IntegrationAdapter): void {
  if (typeof adapter.key !== 'string' || adapter.key.trim() === '') {
    throw new Error('Adapter key must be a non-empty string');
  }
  if (typeof adapter.displayName !== 'string' || adapter.displayName.trim() === '') {
    throw new Error(`Adapter ${adapter.key}: displayName must be a non-empty string`);
  }

  // Validates `category` is a known IntegrationCategory value — throws on
  // unknown values with a Zod-formatted message.
  IntegrationCategorySchema.parse(adapter.category);

  if (!Array.isArray(adapter.capabilities) || adapter.capabilities.length === 0) {
    throw new Error(`Adapter ${adapter.key}: capabilities must be a non-empty array`);
  }
  for (const cap of adapter.capabilities) {
    AdapterCapabilitySchema.parse(cap);
  }

  // search + details are mandatory on the type, but defensively check
  // they're present. TypeScript permits `undefined` at runtime if the
  // caller bypasses type checks (e.g., `as any` in tests or seed code).
  if (typeof adapter.search !== 'function') {
    throw new Error(`Adapter ${adapter.key}: search() must be implemented`);
  }
  if (typeof adapter.getDetails !== 'function') {
    throw new Error(`Adapter ${adapter.key}: getDetails() must be implemented`);
  }

  // Declared capability ⇒ method must exist.
  for (const cap of adapter.capabilities) {
    if (cap === 'search' || cap === 'details') continue;
    const method = CAPABILITY_METHOD[cap];
    if (typeof adapter[method] !== 'function') {
      throw new Error(
        `Adapter ${adapter.key}: declares capability "${cap}" but does not implement ${method}()`
      );
    }
  }

  // Implemented optional method ⇒ capability must be declared.
  const declared = new Set(adapter.capabilities);
  for (const [cap, method] of Object.entries(CAPABILITY_METHOD) as Array<
    [Exclude<AdapterCapability, 'search' | 'details'>, keyof IntegrationAdapter]
  >) {
    if (typeof adapter[method] === 'function' && !declared.has(cap)) {
      throw new Error(
        `Adapter ${adapter.key}: implements ${method}() but does not declare capability "${cap}"`
      );
    }
  }
}
