import Stripe from 'npm:stripe@18.5.0';
import { createAdminClient, errorMessage, jsonResponse, requireEnvironment } from '../_shared/runtime.ts';

const stripeStatusToAccount = (status: Stripe.Subscription.Status) =>
  ['active', 'trialing'].includes(status) ? 'annual' : ['incomplete', 'past_due', 'unpaid'].includes(status) ? 'checkout_pending' : 'free';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  try {
    const payload = await request.text();
    const stripe = new Stripe(requireEnvironment('STRIPE_SECRET_KEY'), { apiVersion: '2025-03-31.basil' });
    const signature = request.headers.get('stripe-signature');
    if (!signature) return jsonResponse({ error: 'Missing Stripe signature' }, 401);
    const event = await stripe.webhooks.constructEventAsync(payload, signature, requireEnvironment('STRIPE_WEBHOOK_SECRET'));
    const admin = createAdminClient();
    const { error: insertError } = await admin.from('stripe_events').insert({ event_id: event.id, event_type: event.type });
    if (insertError?.code === '23505') return jsonResponse({ ok: true, duplicate: true });
    if (insertError) throw insertError;

    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id || await findUserId(admin, String(subscription.customer), stripe);
      if (userId) {
        const deleted = event.type === 'customer.subscription.deleted';
        const accountStatus = deleted ? 'free' : stripeStatusToAccount(subscription.status);
        const { error } = await admin.from('profiles').update({
          account_status: accountStatus,
          plan: accountStatus === 'annual' ? 'annual' : 'free',
          stripe_customer_id: String(subscription.customer),
          stripe_subscription_id: deleted ? null : subscription.id,
          subscription_status: deleted ? 'canceled' : subscription.status,
          subscription_current_period_end: deleted ? null : new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
          subscription_cancel_at_period_end: deleted ? false : Boolean(subscription.cancel_at_period_end),
        }).eq('id', userId);
        if (error) throw error;
      }
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id || session.client_reference_id;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        const accountStatus = stripeStatusToAccount(subscription.status);
        const { error } = await admin.from('profiles').update({
          account_status: accountStatus,
          plan: accountStatus === 'annual' ? 'annual' : 'free',
          stripe_customer_id: String(session.customer),
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
          subscription_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        }).eq('id', userId);
        if (error) throw error;
      }
    }
    await admin.from('stripe_events').update({ processed_at: new Date().toISOString() }).eq('event_id', event.id);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed', error);
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});

async function findUserId(admin: ReturnType<typeof createAdminClient>, customerId: string, stripe: Stripe) {
  const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  if (data?.id) return data.id;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return null;
  const { data: profile } = await admin.from('profiles').select('id').ilike('email_address', customer.email).maybeSingle();
  return profile?.id ?? null;
}
