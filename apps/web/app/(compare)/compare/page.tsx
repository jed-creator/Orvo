export const metadata = { title: 'Compare' };

/**
 * Compare landing — static scaffold. The live comparison UI pulls
 * from `/api/compare?fingerprint=...` in a follow-up task, once the
 * pricing engine is writing snapshots.
 */
export default function ComparePage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
        Compare
      </h1>
      <p className="mt-2 text-zinc-600">
        See prices side-by-side from every store we&apos;ve checked.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        Compare module scaffold — live price history and winners are
        coming next.
      </p>
    </div>
  );
}
