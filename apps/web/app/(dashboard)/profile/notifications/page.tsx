import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  getPreferences,
  setPreference,
  type NotificationCategory,
  type NotificationChannel,
} from '@/lib/services/notification-preferences.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = { title: 'Notifications' };

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  eat: 'Eat',
  ride: 'Ride',
  book: 'Book',
  trips: 'Trips',
  tickets: 'Tickets',
  shop: 'Shop',
  market: 'Market',
  compare: 'Compare',
  promos: 'Promos & offers',
  system: 'System (transactional)',
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
};

async function togglePreferenceAction(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const category = formData.get('category') as NotificationCategory | null;
  const channel = formData.get('channel') as NotificationChannel | null;
  const enabled = formData.get('enabled') === 'true';

  if (!category || !channel) {
    redirect('/profile/notifications?error=missing_field');
  }

  try {
    await setPreference(user.id, category!, channel!, enabled);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    redirect(
      `/profile/notifications?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath('/profile/notifications');
  redirect('/profile/notifications');
}

/**
 * /profile/notifications — 10 categories × 3 channels matrix. Each
 * cell is a tiny form posting to the toggle action above. The
 * `system` category is shown but every cell is disabled because
 * transactional sends are mandatory.
 *
 * We deliberately use one form-per-cell rather than a bulk submit so
 * each toggle is a single round-trip and there's no "save changes"
 * step the user can forget.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const matrix = await getPreferences(user.id);
  const lookup = new Map<string, boolean>();
  for (const row of matrix) {
    lookup.set(`${row.category}:${row.channel}`, row.enabled);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which channels Orvo can use to reach you for each kind
          of update. Transactional system messages always go through.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p
            data-testid="notifications-error"
            className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Couldn&apos;t update your preferences ({decodeURIComponent(error)}).
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table
            data-testid="notifications-matrix"
            className="w-full text-sm"
          >
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="py-2 pr-4 font-semibold text-zinc-700">
                  Category
                </th>
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <th
                    key={channel}
                    className="px-3 py-2 text-center font-semibold text-zinc-700"
                  >
                    {CHANNEL_LABELS[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const isSystem = category === 'system';
                return (
                  <tr key={category}>
                    <th
                      scope="row"
                      className="py-3 pr-4 text-left font-medium text-zinc-900"
                    >
                      {CATEGORY_LABELS[category]}
                    </th>
                    {NOTIFICATION_CHANNELS.map((channel) => {
                      const enabled =
                        lookup.get(`${category}:${channel}`) ?? true;
                      return (
                        <td
                          key={channel}
                          className="px-3 py-3 text-center"
                        >
                          <form action={togglePreferenceAction}>
                            <input
                              type="hidden"
                              name="category"
                              value={category}
                            />
                            <input
                              type="hidden"
                              name="channel"
                              value={channel}
                            />
                            <input
                              type="hidden"
                              name="enabled"
                              value={(!enabled).toString()}
                            />
                            <button
                              type="submit"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={`${CATEGORY_LABELS[category]} via ${CHANNEL_LABELS[channel]}`}
                              data-testid={`toggle-${category}-${channel}`}
                              data-enabled={enabled}
                              disabled={isSystem}
                              className={
                                'inline-flex h-6 w-11 items-center rounded-full transition-colors ' +
                                (enabled
                                  ? 'bg-brand-primary'
                                  : 'bg-zinc-300') +
                                (isSystem
                                  ? ' cursor-not-allowed opacity-60'
                                  : ' hover:opacity-90')
                              }
                            >
                              <span
                                className={
                                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                                  (enabled
                                    ? 'translate-x-5'
                                    : 'translate-x-1')
                                }
                              />
                            </button>
                          </form>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Tip: System messages (booking confirmations, receipts,
          security alerts) are always sent — that&apos;s why those
          toggles can&apos;t be turned off.
        </p>
      </CardContent>
    </Card>
  );
}
