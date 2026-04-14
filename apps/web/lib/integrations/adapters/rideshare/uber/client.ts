/**
 * Mock Uber client. Returns the product catalogue with prices computed
 * from the fixture multipliers. No HTTP.
 *
 * The real Uber Rides API takes pickup + dropoff coords and returns an
 * array of products with surge-adjusted fares. This mock ignores
 * pickup/dropoff and uses a flat base fare — fine for the Explore hub
 * and the booking smoke test, not a substitute for real pricing when
 * we ship.
 */
import type { Slot } from '../../../core';
import {
  UBER_PRODUCTS,
  BASE_FARE_CENTS,
  type UberProductFixture,
} from './fixtures';

export type UberProductWithFare = UberProductFixture & { fareCents: number };

let rideCounter = 0;

export class MockUberClient {
  async listProducts(): Promise<UberProductWithFare[]> {
    return UBER_PRODUCTS.map((p) => ({
      ...p,
      fareCents: Math.round(BASE_FARE_CENTS * p.priceMultiplier),
    }));
  }

  async getProduct(externalId: string): Promise<UberProductWithFare> {
    const products = await this.listProducts();
    const row = products.find((p) => p.externalId === externalId);
    if (!row) {
      throw new Error(`Uber: unknown product ${externalId}`);
    }
    return row;
  }

  /**
   * Returns a handful of ETA "slots" so the UI can show pickup options.
   * Each slot represents an available pickup window starting N minutes
   * from now. Dates are anchored to the query date at midnight UTC so
   * the mock is deterministic across test runs.
   */
  async getEtas(externalId: string, date: string): Promise<Slot[]> {
    await this.getProduct(externalId);
    const etaMinutes = [3, 6, 10];
    return etaMinutes.map((m, i) => ({
      externalSlotId: `eta-${m}m`,
      startsAt: `${date}T00:${String(m).padStart(2, '0')}:00.000Z`,
      endsAt: `${date}T00:${String(m + 1).padStart(2, '0')}:00.000Z`,
    }));
  }

  async requestRide(
    externalId: string,
    slotId: string,
    _userId: string
  ): Promise<{ externalBookingId: string; status: string }> {
    await this.getProduct(externalId);
    rideCounter += 1;
    return {
      externalBookingId: `uber-ride-${rideCounter}-${slotId}`,
      status: 'accepted',
    };
  }

  async cancelRide(externalBookingId: string): Promise<{ status: string }> {
    if (!externalBookingId.startsWith('uber-ride-')) {
      throw new Error(`Uber: invalid ride id ${externalBookingId}`);
    }
    return { status: 'cancelled' };
  }
}
