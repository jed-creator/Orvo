/**
 * Re-exports the integration adapter contract from @orvo/shared.
 *
 * The canonical definition lives in the shared package so the mobile app
 * and any future consumer can depend on the same interface. This module
 * exists so apps/web code imports from a stable local path
 * (`lib/integrations/core`) instead of reaching across the monorepo.
 */
export type {
  IntegrationAdapter,
  IntegrationCategory,
  AdapterCapability,
  NormalizedSearchResult,
  AvailabilityQuery,
  Slot,
} from '@orvo/shared/super-app/integrations';

export {
  IntegrationCategorySchema,
  AdapterCapabilitySchema,
  NormalizedSearchResultSchema,
  AvailabilityQuerySchema,
  SlotSchema,
} from '@orvo/shared/super-app/integrations';
