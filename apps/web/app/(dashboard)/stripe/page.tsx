import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import {
  createStripeAccountLinkAction,
  refreshStripeStatusAction,
} from '@/app/actions/stripe';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function StripePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; refresh?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, stripe_account_id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!business) redirect('/dashboard/business/new');

  // If the business has a Stripe account, fetch its current status
  let account: Awaited<ReturnType<typeof stripe.accounts.retrieve>> | null = null;
  let stripeError: string | null = null;

  if (business.stripe_account_id) {
    try {
      account = await stripe.accounts.retrieve(business.stripe_account_id);
    } catch (e) {
      stripeError = e instanceof Error ? e.message : 'Unknown Stripe error';
    }
  }

  const chargesEnabled = account?.charges_enabled ?? false;
  const payoutsEnabled = account?.payouts_enabled ?? false;
  const detailsSubmitted = account?.details_submitted ?? false;
  const requirements = account?.requirements;
  const currentlyDue = requirements?.currently_due ?? [];
  const pastDue = requirements?.past_due ?? [];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Payments
        </h1>
        <p className="text-zinc-600 mt-1">
          Connect your bank account with Stripe to accept payments from
          Serva customers.
        </p>
      </div>

      {params.done === '1' && (
        <Alert variant="success">
          <AlertDescription>
            Returned from Stripe onboarding. Your account status is shown
            below.
          </AlertDescription>
        </Alert>
      )}
      {params.refresh === '1' && (
        <Alert>
          <AlertDescription>
            The Stripe onboarding link expired. Click the button below to
            restart onboarding.
          </AlertDescription>
        </Alert>
      )}
      {stripeError && (
        <Alert variant="error">
          <AlertDescription>Stripe error: {stripeError}</AlertDescription>
        </Alert>
      )}

      {!business.stripe_account_id ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect with Stripe</CardTitle>
            <CardDescription>
              You&apos;ll be redirected to Stripe to provide bank account and
              identity details. Takes about 2–3 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStripeAccountLinkAction}>
              <Button size="lg" type="submit">
                Connect with Stripe →
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
            <CardDescription>
              Stripe account ID:{' '}
              <code className="text-xs bg-zinc-100 px-1 rounded">
                {business.stripe_account_id}
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusRow label="Details submitted" value={detailsSubmitted} />
            <StatusRow label="Charges enabled" value={chargesEnabled} />
            <StatusRow label="Payouts enabled" value={payoutsEnabled} />

            {currentlyDue.length > 0 && (
              <Alert variant="warning">
                <AlertDescription>
                  Stripe needs more info:{' '}
                  <ul className="list-disc pl-5 mt-1">
                    {currentlyDue.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {pastDue.length > 0 && (
              <Alert variant="error">
                <AlertDescription>
                  Past-due requirements — payouts may be blocked:{' '}
                  <ul className="list-disc pl-5 mt-1">
                    {pastDue.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              {!chargesEnabled && (
                <form action={createStripeAccountLinkAction}>
                  <Button type="submit">
                    {detailsSubmitted ? 'Finish setup' : 'Continue onboarding'}
                  </Button>
                </form>
              )}
              <form action={refreshStripeStatusAction}>
                <Button type="submit" variant="outline">
                  Refresh status
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-700">{label}</span>
      <span
        className={`inline-flex items-center gap-1 font-medium ${
          value ? 'text-green-700' : 'text-zinc-500'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            value ? 'bg-green-600' : 'bg-zinc-400'
          }`}
        />
        {value ? 'Yes' : 'Not yet'}
      </span>
    </div>
  );
}
