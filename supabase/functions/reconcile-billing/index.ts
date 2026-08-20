import { Resend } from 'npm:resend@6.18.1';
import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { createAdminClient, errorMessage, requireEnvironment } from '../_shared/runtime.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const stripeStatusToAccount = (status: Stripe.Subscription.Status) =>
  ['active', 'trialing'].includes(status) ? 'annual' : ['incomplete', 'past_due', 'unpaid'].includes(status) ? 'checkout_pending' : 'free';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return response({ error: 'Authentication required' }, 401);
    const supabaseUrl = requireEnvironment('SUPABASE_URL');
    const authClient = createClient(supabaseUrl, requireEnvironment('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return response({ error: 'Invalid authentication' }, 401);

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, account_status, stripe_customer_id')
      .eq('id', userData.user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.account_status === 'closed' || !profile.stripe_customer_id) {
      return response({ status: profile.account_status, reconciled: false });
    }

    const stripe = new Stripe(requireEnvironment('STRIPE_SECRET_KEY'), { apiVersion: '2025-03-31.basil' });
    const subscriptions = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 20 });
    const subscription = subscriptions.data
      .filter((item) => ['active', 'trialing', 'incomplete', 'past_due', 'unpaid'].includes(item.status))
      .sort((a, b) => b.created - a.created)[0];
    if (!subscription) return response({ status: 'free', reconciled: false });

    const accountStatus = stripeStatusToAccount(subscription.status);
    const { error: updateError } = await admin.from('profiles').update({
      account_status: accountStatus,
      plan: accountStatus === 'annual' ? 'annual' : 'free',
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
      subscription_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    }).eq('id', userData.user.id);
    if (updateError) throw updateError;
    try {
      const resend = new Resend(requireEnvironment('RESEND_API_KEY'));
      await resend.emails.send({
        from: Deno.env.get('SERVICE_FROM_ADDRESS') ?? 'One Reader <letters@onereader.co>',
        to: userData.user.email ?? '',
        subject: 'Your One Reader membership is active',
        html: '<p>Your One Reader annual membership is now active.</p><p>You can start a new letter every 24 hours. Your next billing date is shown in your account.</p>',
        text: 'Your One Reader annual membership is now active. You can start a new letter every 24 hours. Your next billing date is shown in your account.',
        headers: { 'Auto-Submitted': 'auto-generated', 'X-One-Reader-Event': 'membership_activated' },
      }, { idempotencyKey: `membership-activated/${subscription.id}` });
    } catch (notificationError) {
      console.error('Membership confirmation email failed', notificationError);
    }
    return response({ status: accountStatus, subscription_status: subscription.status, reconciled: true });
  } catch (error) {
    console.error('Billing reconciliation failed', error);
    return response({ error: errorMessage(error) }, 400);
  }
});
