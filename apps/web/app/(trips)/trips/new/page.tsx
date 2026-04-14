export const metadata = { title: 'Plan a new trip' };

export default function NewTripPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
        Plan a new trip
      </h1>
      <p className="mt-2 text-zinc-600">
        Name your trip, pick dates, and start adding places and people.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        New-trip scaffold — the full creation form is wired in the next
        iteration.
      </p>
    </div>
  );
}
