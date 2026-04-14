export const metadata = { title: 'Book' };

export default function BookPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
        Book
      </h1>
      <p className="mt-2 text-zinc-600">
        Salons, spas, trainers, therapists, and every other bookable
        service — all in one search.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        Book module scaffold — provider grid and filters are coming
        next.
      </p>
    </div>
  );
}
