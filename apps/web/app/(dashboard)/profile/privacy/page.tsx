import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  buildExportPayload,
  listUserRequests,
  requestDeletion,
  requestExport,
  type PrivacyRequest,
} from '@/lib/services/privacy.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Privacy' };

const STATUS_LABELS: Record<PrivacyRequest['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

async function requestExportAction() {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  try {
    await requestExport(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(`/profile/privacy?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/profile/privacy');
  redirect('/profile/privacy?queued=export');
}

async function requestDeletionAction() {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  try {
    await requestDeletion(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(`/profile/privacy?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/profile/privacy');
  redirect('/profile/privacy?queued=delete');
}

/**
 * /profile/privacy — GDPR-style export + delete request UI plus a live
 * preview of the export payload. The actual export ZIP is built by a
 * background worker (out of scope for Phase 8); this page just queues
 * the request and shows what would be in it.
 */
export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; queued?: string }>;
}) {
  const { error, queued } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [requests, payloadPreview] = await Promise.all([
    listUserRequests(user.id),
    buildExportPayload(user.id).catch(() => null),
  ]);

  const previewCounts = payloadPreview
    ? [
        { label: 'Bookings', count: payloadPreview.bookings.length },
        { label: 'Reviews', count: payloadPreview.reviews.length },
        { label: 'Points entries', count: payloadPreview.orvo_points.length },
        {
          label: 'Wallet entries',
          count: payloadPreview.wallet_ledger.length,
        },
        {
          label: 'Notification overrides',
          count: payloadPreview.notification_preferences.length,
        },
        {
          label: 'Households owned',
          count: payloadPreview.households_owned.length,
        },
        {
          label: 'Household memberships',
          count: payloadPreview.household_memberships.length,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {error ? (
        <p
          data-testid="privacy-error"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {decodeURIComponent(error)}
        </p>
      ) : null}
      {queued === 'export' ? (
        <p
          data-testid="privacy-queued-export"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          Your data export has been queued. We&apos;ll email you when
          it&apos;s ready.
        </p>
      ) : null}
      {queued === 'delete' ? (
        <p
          data-testid="privacy-queued-delete"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          Your account deletion request has been queued. You&apos;ll
          receive a confirmation email before anything is removed.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Download your data</CardTitle>
          <CardDescription>
            Get a copy of every Orvo row tied to your account — profile,
            bookings, reviews, loyalty, wallet, preferences, and
            household memberships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewCounts.length > 0 ? (
            <div data-testid="privacy-preview" className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                What&apos;s included
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-700 sm:grid-cols-3">
                {previewCounts.map((row) => (
                  <li key={row.label}>
                    <span className="font-semibold text-zinc-900">
                      {row.count}
                    </span>{' '}
                    {row.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <form action={requestExportAction}>
            <Button type="submit" data-testid="privacy-request-export">
              Request export
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete your account</CardTitle>
          <CardDescription>
            Queue an account deletion. We&apos;ll email you to confirm
            before any data is removed — nothing is deleted instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={requestDeletionAction}>
            <Button
              type="submit"
              variant="destructive"
              data-testid="privacy-request-delete"
            >
              Request account deletion
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your privacy requests</CardTitle>
          <CardDescription>
            Every export and deletion request you&apos;ve made and its
            current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p
              data-testid="privacy-empty"
              className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
            >
              You haven&apos;t made any privacy requests yet.
            </p>
          ) : (
            <ul data-testid="privacy-requests" className="divide-y divide-zinc-200">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {req.kind === 'export'
                        ? 'Data export'
                        : 'Account deletion'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Requested{' '}
                      {new Date(req.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {STATUS_LABELS[req.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
