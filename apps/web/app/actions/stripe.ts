'use server';

/**
 * Stripe Connect server actions.
 *
 * Flow:
 *   1. Business owner clicks "Connect with Stripe"
 *   2. createStripeAccountLink creates (if needed) a Stripe Express account
 *      on behalf of the business, saves the account id to businesses.stripe_account_id,
 *      generates an Account Link URL, and redirects the owner there.
 *   3. Stripe hosts the onboarding flow (KYC, bank details, terms)
 *   4. When the owner returns to Serva, /dashboard/stripe fetches the
 *      account status and displays it. On success they can accept payments.
 */
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';
}

export async function createStripeAccountLinkAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, email, stripe_account_id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) redirect('/dashboard/business/new');

  let stripeAccountId = business.stripe_account_id;

  // Create a new Stripe Express account if this business doesn't have one yet
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: business.email ?? user.email ?? undefined,
      business_type: 'individual',
      business_profile: {
        name: business.name,
        url: `${getAppUrl()}/business/${business.id}`,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        serva_business_id: business.id,
        serva_owner_id: user.id,
      },
    });

    stripeAccountId = account.id;

    const { error } = await supabase
      .from('businesses')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', business.id);
    if (error) throw new Error(`Could not save Stripe account: ${error.message}`);
  }

  // Generate an Account Link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${getAppUrl()}/dashboard/stripe?refresh=1`,
    return_url: `${getAppUrl()}/dashboard/stripe?done=1`,
    type: 'account_onboarding',
  });

  redirect(accountLink.url);
}

export async function refreshStripeStatusAction() {
  'use server';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business?.stripe_account_id) {
    revalidatePath('/dashboard/stripe');
    return;
  }

  // Fetch account from Stripe (no DB mutation needed — the status page
  // reads directly from Stripe). Just invalidate cache.
  revalidatePath('/dashboard/stripe');
}
