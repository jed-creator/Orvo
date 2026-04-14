/**
 * Orvo super-app — event & sports tickets.
 *
 * TicketEvent is the event metadata (venue, kind, start time). TicketListing
 * is an individual section/row/seat or GA allocation carrying a price; every
 * listing is tagged `primary` (official box office) or `resale` (StubHub/AXS).
 * TicketOrder is Orvo's wrapper around one or more listings purchased for a
 * user.
 */
import { z } from 'zod';
import { MoneySchema, GeoPointSchema, MediaAssetSchema } from './common';

export const TicketEventKindSchema = z.enum([
  'concert',
  'sports',
  'theater',
  'comedy',
  'festival',
]);
export type TicketEventKind = z.infer<typeof TicketEventKindSchema>;

export const TicketEventSchema = z.object({
  id: z.string(),
  provider: z.string(),
  externalId: z.string(),
  title: z.string().min(1),
  kind: TicketEventKindSchema,
  venue: z.string().min(1),
  location: GeoPointSchema,
  startsAt: z.iso.datetime(),
  media: z.array(MediaAssetSchema),
});
export type TicketEvent = z.infer<typeof TicketEventSchema>;

export const TicketListingSourceSchema = z.enum(['primary', 'resale']);
export type TicketListingSource = z.infer<typeof TicketListingSourceSchema>;

export const TicketListingSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  provider: z.string(),
  externalId: z.string(),
  section: z.string().optional(),
  row: z.string().optional(),
  seat: z.string().optional(),
  quantity: z.number().int().min(1),
  price: MoneySchema,
  source: TicketListingSourceSchema,
});
export type TicketListing = z.infer<typeof TicketListingSchema>;

export const TicketOrderStatusSchema = z.enum([
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
]);
export type TicketOrderStatus = z.infer<typeof TicketOrderStatusSchema>;

export const TicketOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  eventId: z.string(),
  listingIds: z.array(z.string()),
  total: MoneySchema,
  status: TicketOrderStatusSchema,
  confirmationCode: z.string().optional(),
});
export type TicketOrder = z.infer<typeof TicketOrderSchema>;
