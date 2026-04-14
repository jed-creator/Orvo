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
import { Button } from '@/components/ui/button';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, cancellation_policy, stripe_account_id, approval_status')
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single();

  const cancellation = (business?.cancellation_policy as {
    free_cancel_hours: number;
    late_cancel_fee_cents: number;
    no_show_fee_cents: number;
  } | null) ?? null;

  const notifPrefs = profile?.notification_preferences ?? {
    email: true,
    sms: true,
    push: true,
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Settings
        </h1>
        <p className="text-zinc-600 mt-1">
          Account, notifications, and business policies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification preferences</CardTitle>
          <CardDescription>
            How Serva contacts you. Edit from the profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-1">
          <div>
            <span className="text-zinc-500">Email:</span>{' '}
            {notifPrefs.email ? 'On' : 'Off'}
          </div>
          <div>
            <span className="text-zinc-500">SMS:</span>{' '}
            {notifPrefs.sms ? 'On' : 'Off'}
          </div>
          <div>
            <span className="text-zinc-500">Push:</span>{' '}
            {notifPrefs.push ? 'On' : 'Off'}
          </div>
        </CardContent>
      </Card>

      {business && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments</CardTitle>
              <CardDescription>Stripe Connect account.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-zinc-700 space-y-2">
              <div>
                {business.stripe_account_id
                  ? 'Connected to Stripe'
                  : 'Not yet connected'}
              </div>
              <Link href="/dashboard/stripe">
                <Button variant="outline" size="sm">
                  Manage payments →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cancellation policy</CardTitle>
              <CardDescription>
                Controls free cancellation windows and late-cancel / no-show
                fees.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-zinc-700 space-y-1">
              {cancellation ? (
                <>
                  <div>
                    Free cancellation:{' '}
                    <span className="font-medium">
                      Up to {cancellation.free_cancel_hours} hours before the
                      appointment
                    </span>
                  </div>
                  <div>
                    Late-cancel fee:{' '}
                    <span className="font-medium">
                      ${(cancellation.late_cancel_fee_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    No-show fee:{' '}
                    <span className="font-medium">
                      ${(cancellation.no_show_fee_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div>Default policy in effect.</div>
              )}
              <p className="text-xs text-zinc-500 mt-2">
                Custom editor coming in Phase 5+.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-700">
              <span className="text-zinc-500">Approval:</span>{' '}
              <span className="capitalize">{business.approval_status}</span>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-2">
          <div>
            <span className="text-zinc-500">Email:</span> {user.email}
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              Edit profile →
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
