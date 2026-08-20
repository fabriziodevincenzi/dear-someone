import { Resend } from 'npm:resend@6.18.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const env = (name: string) => { const value = Deno.env.get(name)?.trim(); if (!value) throw new Error(`${name} is not configured`); return value; };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return response({ error: 'Authentication required' }, 401);
    const supabaseUrl = env('SUPABASE_URL');
    const auth = createClient(supabaseUrl, env('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
    const { data: userData, error: authError } = await auth.auth.getUser(token);
    if (authError || !userData.user?.email) return response({ error: 'Invalid authentication' }, 401);
    const body = await request.json().catch(() => ({})) as { request_type?: unknown; reason?: unknown };
    const requestType = body.request_type;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!['withdrawal_14_day', 'service_issue', 'goodwill'].includes(String(requestType))) return response({ error: 'Choose a valid request type' }, 400);
    if (reason.length < 10 || reason.length > 2000) return response({ error: 'Please provide between 10 and 2000 characters' }, 400);
    const admin = createClient(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from('profiles').select('stripe_customer_id, stripe_subscription_id').eq('id', userData.user.id).single();
    if (profileError) throw profileError;
    const { data: refundRequest, error: insertError } = await admin.from('refund_requests').insert({ user_id: userData.user.id, request_type: requestType, reason, stripe_customer_id: profile.stripe_customer_id, stripe_subscription_id: profile.stripe_subscription_id }).select('id, created_at').single();
    if (insertError) throw insertError;
    try {
      const resend = new Resend(env('RESEND_API_KEY'));
      const from = Deno.env.get('SERVICE_FROM_ADDRESS')?.trim() || 'One Reader <letters@onereader.co>';
      const summary = `Type: ${requestType}\nAccount: ${userData.user.email}\nRequest: ${reason}\nRequest ID: ${refundRequest.id}`;
      await resend.emails.send({ from, to: ['customers@onereader.co'], subject: `Refund request from ${userData.user.email}`, text: summary });
      await resend.emails.send({ from, to: [userData.user.email], subject: 'Your One Reader refund request was received', text: `We received your request and will review it. No refund is automatic.\n\nRequest ID: ${refundRequest.id}\n\n${summary}` });
    } catch (notificationError) { console.error('Refund notification failed', notificationError); }
    return response({ request_id: refundRequest.id, request_status: 'requested' });
  } catch (error) {
    console.error('Refund request failed', error);
    return response({ error: error instanceof Error ? error.message : 'Refund request failed' }, 400);
  }
});
