import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
const requireEnvironment = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const createAdminClient = () => createClient(requireEnvironment('SUPABASE_URL'), requireEnvironment('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const errorMessage = (error: unknown) => error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return response({ error: 'Authentication required' }, 401);
    const auth = createClient(requireEnvironment('SUPABASE_URL'), requireEnvironment('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user) return response({ error: 'Invalid authentication' }, 401);
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin.from('profiles').select('stripe_customer_id').eq('id', data.user.id).single();
    if (profileError) throw profileError;
    if (!profile.stripe_customer_id) return response({ error: 'No Stripe customer exists for this account' }, 409);
    const stripe = new Stripe(requireEnvironment('STRIPE_SECRET_KEY'), { apiVersion: '2025-03-31.basil' });
    const siteUrl = requireEnvironment('SITE_URL').replace(/\/$/, '');
    const session = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl}/member/` });
    return response({ url: session.url });
  } catch (error) {
    console.error('Stripe portal failed', error);
    return response({ error: errorMessage(error) }, 400);
  }
});
