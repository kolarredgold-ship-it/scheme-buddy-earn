import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { amount, currency = 'INR', receipt, payment_type } = await req.json();
    if (['topup', 'ai_topup', 'report_credits'].includes(payment_type) || amount === 49900) {
      const { data: profile, error } = await client.from('profiles').select('subscription_status,subscription_expires_at').eq('user_id', authData.user.id).maybeSingle();
      if (error || profile?.subscription_status !== 'active' || (profile.subscription_expires_at && Date.parse(profile.subscription_expires_at) <= Date.now())) return new Response(JSON.stringify({ error: 'Activate Pro for ₹999 before purchasing credit top-ups.', code: 'pro_required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (typeof amount !== 'number' || amount < 100) {
      return new Response(JSON.stringify({ error: 'Amount must be >= 100 paise' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) throw new Error('Payments are not configured');
    const auth = btoa(`${keyId}:${keySecret}`);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount, currency,
        receipt: receipt ?? `rcpt_${Date.now()}`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data?.error?.description || 'Razorpay error' }), {
        status: res.status === 401 ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      order_id: data.id, amount: data.amount, currency: data.currency, key_id: keyId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
