/**
 * /api/trips
 *
 * GET: returns the current user's trips. Scaffold always returns an
 *      empty list — real querying wires in once the persistence
 *      decision for trips lands.
 * POST: creates a new trip from `{title, startDate, endDate}`.
 *       Validates shape and date ordering, then returns a stub
 *       envelope. Persistence is deferred to the follow-up task.
 */
import { NextResponse } from 'next/server';
import {
  createStubTrip,
  listStubTrips,
  validateCreateTrip,
  type CreateTripInput,
} from '@/lib/services/trip-planner.service';

export async function GET(_req: Request): Promise<Response> {
  return NextResponse.json({ trips: listStubTrips() });
}

export async function POST(req: Request): Promise<Response> {
  let body: Partial<CreateTripInput>;
  try {
    body = (await req.json()) as Partial<CreateTripInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const check = validateCreateTrip(body);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  const result = createStubTrip(body as CreateTripInput);
  return NextResponse.json(result, { status: 201 });
}
