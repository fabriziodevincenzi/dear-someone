import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { createAdminClient, errorMessage, jsonResponse, requireEnvironment } from '../_shared/runtime.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Authentication required' }, 401);
    const auth = createClient(requireEnvironment('SUPABASE_URL'), requireEnvironment('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user) return jsonResponse({ error: 'Invalid authentication' }, 401);
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin.from('profiles').select('stripe_customer_id').eq('id', data.user.id).single();
    if (profileError) throw profileError;
    if (!profile.stripe_customer_id) return jsonResponse({ error: 'No Stripe customer exists for this account' }, 409);
    const stripe = new Stripe(requireEnvironment('STRIPE_SECRET_KEY'), { apiVersion: '2025-03-31.basil' });
    const siteUrl = requireEnvironment('SITE_URL').replace(/\/$/, '');
    const session = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl}/member/` });
    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Stripe portal failed', error);
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});
