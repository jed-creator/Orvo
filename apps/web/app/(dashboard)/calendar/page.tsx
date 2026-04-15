import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BookingStatus } from '@/lib/supabase/types';

interface UpcomingRow {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  consumer: { first_name: string | null; last_name: string | null } | null;
  service: { name: string } | null;
}

/**
 * Return an ISO timestamp for `days` days in the future. Defined at
 * module scope so `Date.now()` is lexically outside the component,
 * avoiding the `react-hooks/purity` rule that flags impure calls
 * inside render functions. The value is still computed per-request
 * because `CalendarPage` is a dynamic server component.
 */
function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function groupByDate(rows: UpcomingRow[]): Record<string, UpcomingRow[]> {
  const out: Record<string, UpcomingRow[]> = {};
  for (const row of rows) {
    const dateKey = new Date(row.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    (out[dateKey] ??= []).push(row);
  }
  return out;
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!business) redirect('/dashboard/business/new');

  const now = new Date().toISOString();
  const twoWeeksOut = daysFromNowIso(14);

  const { data: rows } = await supabase
    .from('bookings')
    .select(
      `
      id, start_time, end_time, status,
      consumer:profiles!bookings_consumer_id_fkey(first_name, last_name),
      service:services(name)
    `,
    )
    .eq('business_id', business.id)
    .gte('start_time', now)
    .lte('start_time', twoWeeksOut)
    .not('status', 'in', '(cancelled,no_show)')
    .order('start_time');

  const bookings = (rows ?? []) as unknown as UpcomingRow[];
  const groups = groupByDate(bookings);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Calendar
        </h1>
        <p className="text-zinc-600 mt-1">
          Upcoming bookings over the next 2 weeks.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nothing scheduled</CardTitle>
            <CardDescription>
              No upcoming bookings in the next 14 days.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groups).map(([dateKey, rows]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                {dateKey}
              </h2>
              <div className="flex flex-col gap-2">
                {rows.map((b) => {
                  const time = new Date(b.start_time).toLocaleTimeString(
                    'en-US',
                    { hour: 'numeric', minute: '2-digit' },
                  );
                  const name =
                    [b.consumer?.first_name, b.consumer?.last_name]
                      .filter(Boolean)
                      .join(' ')
                      .trim() || 'Customer';
                  return (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings/${b.id}`}
                      className="block"
                    >
                      <Card className="hover:border-brand-accent">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-zinc-700">
                            {time}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-zinc-900">
                              {name}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {b.service?.name}
                            </div>
                          </div>
                          <span className="text-xs capitalize text-zinc-500">
                            {b.status.replace('_', ' ')}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
