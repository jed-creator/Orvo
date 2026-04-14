/**
 * Orvo super-app — shared type namespace barrel.
 *
 * Re-exports every super-app domain module so consumers can pull everything
 * from `@orvo/shared/super-app`, while still permitting targeted subpath
 * imports like `@orvo/shared/super-app/shopping`.
 */
export * from './common';
export * from './shopping';
export * from './delivery';
