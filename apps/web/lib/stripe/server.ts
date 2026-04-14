/**
 * Stripe server SDK singleton.
 *
 * Only import from server code (RSC, server actions, route handlers).
 * Never import in client components — the secret key must stay server-only.
 */
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY env var');
}

export const stripe = new Stripe(stripeSecretKey, {
  // API version pinned to match the installed SDK (22.0.1).
  // Update deliberately when upgrading Stripe.
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
  appInfo: {
    name: 'Serva',
    version: '0.1.0',
  },
});

export const STRIPE_APPLICATION_FEE_PERCENT = 2.5;

export function applicationFeeCents(totalCents: number): number {
  return Math.round((totalCents * STRIPE_APPLICATION_FEE_PERCENT) / 100);
}
