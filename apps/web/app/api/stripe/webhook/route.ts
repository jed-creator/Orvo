/**
 * Stripe webhook handler.
 *
 * Endpoint:  POST /api/stripe/webhook
 *
 * Stripe posts events here. Each event is verified with the webhook
 * signing secret before processing. We handle a minimal set for MVP:
 *
 *   account.updated           — Stripe Connect account status changes
 *   payment_intent.succeeded  — payment captured (flip booking to paid)
 *   payment_intent.payment_failed — payment failed (flip booking to failed)
 *   charge.refunded           — refund issued (update payment + refund rows)
 *
 * For local development, use `stripe listen --forward-to
 * localhost:3333/api/stripe/webhook` to get a temporary signing secret
 * and forward live test events to this endpoint.
 */
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 },
    );
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'account.updated': {
        // No DB mutation needed — /dashboard/stripe reads status live from
        // Stripe. We just ack the event. If we wanted to cache status in
        // our DB for faster reads, we'd upsert here.
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata?.serva_booking_id;
        if (bookingId) {
          await supabase
            .from('payments')
            .update({
              status: 'captured',
              stripe_charge_id: pi.latest_charge?.toString() ?? null,
            })
            .eq('stripe_payment_intent_id', pi.id);

          await supabase
            .from('bookings')
            .update({ payment_status: 'captured' })
            .eq('id', bookingId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata?.serva_booking_id;
        if (bookingId) {
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              error_message:
                pi.last_payment_error?.message ?? 'Payment failed',
            })
            .eq('stripe_payment_intent_id', pi.id);

          await supabase
            .from('bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_charge_id', charge.id)
          .maybeSingle();

        if (payment) {
          // charge.amount_refunded is the total amount refunded so far
          await supabase.from('refunds').insert({
            payment_id: payment.id,
            stripe_refund_id: charge.refunds?.data?.[0]?.id ?? null,
            amount_cents: charge.amount_refunded,
            status: 'succeeded',
          });

          if (charge.refunded) {
            await supabase
              .from('payments')
              .update({ status: 'refunded' })
              .eq('id', payment.id);
          }
        }
        break;
      }

      default:
        // Unhandled events are fine — just log for visibility
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}
