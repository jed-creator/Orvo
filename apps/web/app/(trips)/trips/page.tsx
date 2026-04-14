import Link from 'next/link';

export const metadata = { title: 'Trips' };

export default function TripsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
        Trips
      </h1>
      <p className="mt-2 text-zinc-600">
        Plan every piece of your trip — flights, hotels, restaurants,
        activities — from one shared itinerary.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        Trips module scaffold — itinerary editor is coming next.
      </p>
      <Link
        href="/trips/new"
        className="mt-6 inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
      >
        Plan a new trip
      </Link>
    </div>
  );
}
