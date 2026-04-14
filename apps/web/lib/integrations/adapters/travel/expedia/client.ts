/**
 * Mock Expedia Partner Solutions client. No HTTP.
 *
 * The real Expedia API takes a property/destination query plus
 * check-in/check-out and returns hotels with rate plans. The mock
 * ignores dates and returns the same rate plans regardless.
 */
import type { Slot } from '../../../core';
import {
  HOTELS,
  RATE_PLANS,
  type HotelFixture,
} from './fixtures';

let reservationCounter = 0;

export class MockExpediaClient {
  async searchHotels(destination: string): Promise<HotelFixture[]> {
    const needle = destination.trim().toLowerCase();
    if (!needle) return [...HOTELS];
    return HOTELS.filter(
      (h) =>
        h.name.toLowerCase().includes(needle) ||
        h.city.toLowerCase().includes(needle) ||
        h.country.toLowerCase().includes(needle)
    );
  }

  async getHotel(externalId: string): Promise<HotelFixture> {
    const row = HOTELS.find((h) => h.externalId === externalId);
    if (!row) {
      throw new Error(`Expedia: unknown hotel ${externalId}`);
    }
    return row;
  }

  async getRatePlans(externalId: string, date: string): Promise<Slot[]> {
    await this.getHotel(externalId);
    const plans = RATE_PLANS[externalId] ?? [];
    // Anchor the slot to the check-in date at a typical 15:00 UTC
    // check-in time. The endsAt is left undefined because multi-night
    // stays are represented by the booking itself, not the slot.
    const startsAt = `${date}T15:00:00.000Z`;
    return plans.map((plan) => ({
      externalSlotId: plan.externalSlotId,
      startsAt,
      price: {
        amount: plan.priceCents,
        currency: 'USD',
      },
    }));
  }

  async createReservation(
    externalId: string,
    slotId: string,
    _userId: string
  ): Promise<{ externalBookingId: string; status: string }> {
    await this.getHotel(externalId);
    reservationCounter += 1;
    return {
      externalBookingId: `xp-res-${reservationCounter}-${slotId}`,
      status: 'confirmed',
    };
  }

  async cancelReservation(externalBookingId: string): Promise<{ status: string }> {
    if (!externalBookingId.startsWith('xp-res-')) {
      throw new Error(`Expedia: invalid reservation id ${externalBookingId}`);
    }
    return { status: 'cancelled' };
  }
}
