import { describe, it, expect } from 'vitest';
import {
  TicketEventSchema,
  TicketListingSchema,
  TicketOrderSchema,
  TicketEventKindSchema,
  TicketListingSourceSchema,
  TicketOrderStatusSchema,
} from './tickets';

describe('tickets schemas', () => {
  it('accepts all event kinds', () => {
    for (const k of ['concert', 'sports', 'theater', 'comedy', 'festival'] as const) {
      expect(TicketEventKindSchema.parse(k)).toBe(k);
    }
  });

  it('parses a ticket event', () => {
    const e = TicketEventSchema.parse({
      id: 'e_1',
      provider: 'ticketmaster',
      externalId: 'ext_e_1',
      title: 'The National @ MSG',
      kind: 'concert',
      venue: 'Madison Square Garden',
      location: { lat: 40.75, lng: -73.99 },
      startsAt: '2026-09-12T20:00:00Z',
      media: [],
    });
    expect(e.kind).toBe('concert');
  });

  it('rejects a ticket event with a bad startsAt', () => {
    expect(() =>
      TicketEventSchema.parse({
        id: 'e_1',
        provider: 'ticketmaster',
        externalId: 'ext_e_1',
        title: 'The National @ MSG',
        kind: 'concert',
        venue: 'Madison Square Garden',
        location: { lat: 40.75, lng: -73.99 },
        startsAt: 'some time in September',
        media: [],
      })
    ).toThrow();
  });

  it('parses a primary-source listing with full seat details', () => {
    const l = TicketListingSchema.parse({
      id: 'l_1',
      eventId: 'e_1',
      provider: 'ticketmaster',
      externalId: 'ext_l_1',
      section: '116',
      row: 'G',
      seat: '12',
      quantity: 2,
      price: { amount: 14500, currency: 'USD' },
      source: 'primary',
    });
    expect(l.source).toBe('primary');
    expect(l.section).toBe('116');
  });

  it('parses a resale general-admission listing', () => {
    const l = TicketListingSchema.parse({
      id: 'l_1',
      eventId: 'e_1',
      provider: 'stubhub',
      externalId: 'ext_l_2',
      quantity: 4,
      price: { amount: 9900, currency: 'USD' },
      source: 'resale',
    });
    expect(l.source).toBe('resale');
    expect(l.section).toBeUndefined();
  });

  it('accepts both listing sources', () => {
    for (const s of ['primary', 'resale'] as const) {
      expect(TicketListingSourceSchema.parse(s)).toBe(s);
    }
  });

  it('rejects a listing with zero quantity', () => {
    expect(() =>
      TicketListingSchema.parse({
        id: 'l_1',
        eventId: 'e_1',
        provider: 'ticketmaster',
        externalId: 'ext_l_1',
        quantity: 0,
        price: { amount: 14500, currency: 'USD' },
        source: 'primary',
      })
    ).toThrow();
  });

  it('accepts all order statuses', () => {
    for (const s of [
      'pending',
      'paid',
      'fulfilled',
      'cancelled',
      'refunded',
    ] as const) {
      expect(TicketOrderStatusSchema.parse(s)).toBe(s);
    }
  });

  it('parses a ticket order', () => {
    const o = TicketOrderSchema.parse({
      id: 'o_1',
      userId: 'u_1',
      eventId: 'e_1',
      listingIds: ['l_1', 'l_2'],
      total: { amount: 29000, currency: 'USD' },
      status: 'paid',
      confirmationCode: 'TM-XYZ-42',
    });
    expect(o.listingIds).toHaveLength(2);
    expect(o.confirmationCode).toBe('TM-XYZ-42');
  });
});
