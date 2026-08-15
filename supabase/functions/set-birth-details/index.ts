import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const eligibilityDate = (birthYear: number, birthMonth: number, age: number) => {
  // Date.UTC uses a zero-based month. Passing the member's one-based birth
  // month therefore returns the first day of the following month.
  return new Date(Date.UTC(birthYear + age, birthMonth, 1)).toISOString().slice(0, 10);
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'Authentication required' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return response({ error: 'Function is not configured' }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return response({ error: 'Invalid authentication' }, 401);

  let payload: { birthMonth?: unknown; birthYear?: unknown };
  try {
    payload = await request.json();
  } catch {
    return response({ error: 'Invalid request body' }, 400);
  }

  const birthMonth = Number(payload.birthMonth);
  const birthYear = Number(payload.birthYear);
  const today = new Date();
  const todayUtc = today.toISOString().slice(0, 10);
  const currentYear = today.getUTCFullYear();
  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    return response({ error: 'invalid_birth_month' }, 400);
  }
  if (!Number.isInteger(birthYear) || birthYear < currentYear - 120 || birthYear > currentYear) {
    return response({ error: 'invalid_birth_year' }, 400);
  }

  const serviceEligibleAt = eligibilityDate(birthYear, birthMonth, 14);
  const adultPoolEligibleAt = eligibilityDate(birthYear, birthMonth, 18);
  if (serviceEligibleAt > todayUtc) return response({ error: 'minimum_age_not_met' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const fields = 'birth_month, birth_year, service_eligible_at, adult_pool_eligible_at';
  const { data: existing, error: lookupError } = await admin
    .from('profiles')
    .select(fields)
    .eq('id', userData.user.id)
    .maybeSingle();
  if (lookupError) return response({ error: lookupError.message }, 500);
  if (!existing) return response({ error: 'profile_not_found' }, 404);

  if (existing.birth_month !== null || existing.birth_year !== null) {
    if (existing.birth_month !== birthMonth || existing.birth_year !== birthYear) {
      return response({ error: 'birth_details_locked' }, 409);
    }
    return response({
      ok: true,
      serviceEligibleAt: existing.service_eligible_at,
      adultPoolEligibleAt: existing.adult_pool_eligible_at,
      agePool: existing.adult_pool_eligible_at <= todayUtc ? 'adult' : 'minor',
    });
  }

  const { data: saved, error: saveError } = await admin
    .from('profiles')
    .update({
      birth_month: birthMonth,
      birth_year: birthYear,
      birth_declared_at: new Date().toISOString(),
      service_eligible_at: serviceEligibleAt,
      adult_pool_eligible_at: adultPoolEligibleAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userData.user.id)
    .is('birth_month', null)
    .is('birth_year', null)
    .select(fields)
    .maybeSingle();
  if (saveError) return response({ error: saveError.message }, 500);
  if (!saved) return response({ error: 'birth_details_locked' }, 409);

  return response({
    ok: true,
    serviceEligibleAt: saved.service_eligible_at,
    adultPoolEligibleAt: saved.adult_pool_eligible_at,
    agePool: saved.adult_pool_eligible_at <= todayUtc ? 'adult' : 'minor',
  });
});
