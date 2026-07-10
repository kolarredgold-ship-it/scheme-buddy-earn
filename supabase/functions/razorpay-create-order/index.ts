import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Server-side price table (INR rupees). Client-supplied amounts are ignored;
// the amount is derived from payment_type to prevent price tampering.
const PRICE_TABLE: Record<string, number> = {
  subscription: 999,
  topup: 499,
  ai_topup: 499,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1) Require an authenticated caller.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { payment_type = 'subscription', currency = 'INR', receipt } = await req.json();
    const price = PRICE_TABLE[payment_type];
    if (!price) {
      return new Response(JSON.stringify({ error: 'Invalid payment_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const amount = price * 100; // paise

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const auth = btoa(`${keyId}:${keySecret}`);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount, currency,
        receipt: receipt ?? `rcpt_${Date.now()}`,
        notes: { payment_type, user_id: userData.user.id },
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
