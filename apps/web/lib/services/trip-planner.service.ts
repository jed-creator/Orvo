/**
 * Trip planner service — scaffold stub.
 *
 * The real service will persist trips to the `trips` table, attach
 * itinerary items across providers, and produce `TripItinerary`
 * structures. Today it just validates input shape and returns a stub
 * trip envelope so the route handler and client can be wired end to
 * end against a stable contract while the persistence layer is
 * designed.
 */
import type { Trip } from '@orvo/shared/super-app';

export interface CreateTripInput {
  title: string;
  startDate: string;
  endDate: string;
}

export interface CreateTripResult {
  ok: true;
  trip: Pick<Trip, 'id' | 'title' | 'startDate' | 'endDate'>;
}

export type CreateTripValidationError =
  | { ok: false; reason: 'missing-title' }
  | { ok: false; reason: 'missing-dates' }
  | { ok: false; reason: 'end-before-start' };

export function validateCreateTrip(
  input: Partial<CreateTripInput>,
): CreateTripValidationError | { ok: true } {
  if (!input.title || input.title.trim() === '') {
    return { ok: false, reason: 'missing-title' };
  }
  if (!input.startDate || !input.endDate) {
    return { ok: false, reason: 'missing-dates' };
  }
  if (input.startDate > input.endDate) {
    return { ok: false, reason: 'end-before-start' };
  }
  return { ok: true };
}

/**
 * Stub trip creation. Returns a deterministic-looking id so callers
 * can round-trip the handler without a database yet. The id shape is
 * `stub-<timestamp>` — the real implementation will return a UUID.
 */
export function createStubTrip(input: CreateTripInput): CreateTripResult {
  return {
    ok: true,
    trip: {
      id: `stub-${Date.now()}`,
      title: input.title.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

export function listStubTrips(): [] {
  return [];
}
