import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  const isProvider = profile?.role === 'provider';

  // For providers, pull the business (if any) + quick stats
  let business: { id: string; name: string; approval_status: string } | null =
    null;
  let serviceCount = 0;
  let bookingCount = 0;

  if (isProvider) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, approval_status')
      .eq('owner_id', user!.id)
      .maybeSingle();

    if (biz) {
      business = biz;
      const [{ count: sCount }, { count: bCount }] = await Promise.all([
        supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', biz.id),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', biz.id),
      ]);
      serviceCount = sCount ?? 0;
      bookingCount = bCount ?? 0;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}
        </h1>
        <p className="text-zinc-600 mt-1">
          {isProvider
            ? 'Manage your business, services, and bookings here.'
            : 'Find and book local services across Orvo.'}
        </p>
      </div>

      {isProvider && !business && (
        <Card>
          <CardHeader>
            <CardTitle>Create your business profile</CardTitle>
            <CardDescription>
              Set up your business to list services, manage availability, and
              accept bookings on Orvo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/business/new">
              <Button size="lg">Create business profile →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {isProvider && business && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{business.name}</CardTitle>
              <CardDescription className="capitalize">
                Status: {business.approval_status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/business">
                <Button variant="outline" size="sm">
                  Manage business →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{serviceCount} services</CardTitle>
              <CardDescription>
                {serviceCount === 0
                  ? 'No services yet — add your first one'
                  : 'Edit your service menu'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/services">
                <Button variant="outline" size="sm">
                  Manage services →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{bookingCount} bookings</CardTitle>
              <CardDescription>
                {bookingCount === 0
                  ? 'No bookings yet'
                  : 'View upcoming and past bookings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/bookings">
                <Button variant="outline" size="sm">
                  Manage bookings →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {!isProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Consumer experience coming soon
            </CardTitle>
            <CardDescription>
              Search and booking from this web app are Phase 7 features — the
              consumer-facing experience is primarily on mobile (React Native).
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
