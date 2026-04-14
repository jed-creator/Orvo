import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id, avg_rating, total_reviews')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!business) redirect('/dashboard/business/new');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  ).toISOString();

  const [
    totalBookings,
    bookingsThisMonth,
    bookingsLastMonth,
    completedBookings,
    revenueRows,
    popularServices,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', startOfMonth),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfMonth),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('status', 'completed'),
    supabase
      .from('bookings')
      .select('total_cents, payment_status')
      .eq('business_id', business.id)
      .eq('payment_status', 'captured'),
    supabase
      .from('bookings')
      .select('service_id, service:services(name)')
      .eq('business_id', business.id)
      .limit(100),
  ]);

  const totalRevenue = (revenueRows.data ?? []).reduce(
    (sum, r) => sum + (r.total_cents ?? 0),
    0,
  );

  // Count bookings per service
  type PopularRow = { service_id: string; service: { name: string } | null };
  const serviceCounts = new Map<string, { name: string; count: number }>();
  ((popularServices.data ?? []) as unknown as PopularRow[]).forEach((row) => {
    const key = row.service_id;
    const name = row.service?.name ?? 'Unknown';
    const existing = serviceCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      serviceCounts.set(key, { name, count: 1 });
    }
  });
  const topServices = Array.from(serviceCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Analytics
        </h1>
        <p className="text-zinc-600 mt-1">
          High-level metrics for your business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total revenue (captured)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-brand-primary">
              {formatCents(totalRevenue)}
            </div>
            <CardDescription className="mt-1">
              From completed Stripe charges
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-brand-primary">
              {totalBookings.count ?? 0}
            </div>
            <CardDescription className="mt-1">
              {completedBookings.count ?? 0} completed
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              Bookings this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-brand-primary">
              {bookingsThisMonth.count ?? 0}
            </div>
            <CardDescription className="mt-1">
              {bookingsLastMonth.count ?? 0} last month
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              Average rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-brand-primary">
              {business.total_reviews > 0
                ? `${Number(business.avg_rating).toFixed(1)} ★`
                : '—'}
            </div>
            <CardDescription className="mt-1">
              {business.total_reviews} review
              {business.total_reviews === 1 ? '' : 's'}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {topServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top services</CardTitle>
            <CardDescription>By total bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {topServices.map((s, i) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="text-zinc-500 mr-2">{i + 1}.</span>
                    {s.name}
                  </span>
                  <span className="font-medium">{s.count}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
