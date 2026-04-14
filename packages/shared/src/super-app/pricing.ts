/**
 * Orvo super-app — price comparison.
 *
 * PriceSnapshot is a point-in-time capture of a provider's price for a
 * given product fingerprint. PriceComparisonResult is the ranking output:
 * the best price (lowest), the full offer set, and the spread (best vs
 * worst). The UI uses the spread to decide whether to render a "save X"
 * badge vs just the best price.
 *
 * Historical snapshots live in the `price_snapshots` table so the UI can
 * show price history charts and the pricing engine can detect stale
 * data.
 */
import { z } from 'zod';
import { MoneySchema } from './common';

export const PriceSnapshotSchema = z.object({
  id: z.string(),
  fingerprint: z.string(),
  provider: z.string(),
  price: MoneySchema,
  url: z.url(),
  capturedAt: z.iso.datetime(),
});
export type PriceSnapshot = z.infer<typeof PriceSnapshotSchema>;

export const PriceComparisonResultSchema = z.object({
  fingerprint: z.string(),
  best: PriceSnapshotSchema,
  offers: z.array(PriceSnapshotSchema),
  spread: MoneySchema,
  capturedAt: z.iso.datetime(),
});
export type PriceComparisonResult = z.infer<typeof PriceComparisonResultSchema>;
