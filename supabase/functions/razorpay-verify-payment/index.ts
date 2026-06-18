import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      amount,
      payment_type = 'subscription',
      payer_name,
      payer_email,
      payer_mobile,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Signature valid — record verified payment so DB trigger activates subscription.
    if (user_id) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Insert as pending, then update to verified so trg_payments_verified fires.
      const { data: inserted, error: insErr } = await admin
        .from('payments')
        .insert({
          user_id,
          amount: amount ?? 0,
          currency: 'INR',
          payment_type,
          status: 'pending',
          transaction_number: razorpay_payment_id,
          payer_name,
          payer_email,
          payer_mobile,
          admin_note: `Razorpay order ${razorpay_order_id}`,
        })
        .select('id')
        .single();

      if (insErr) {
        return new Response(JSON.stringify({
          success: false,
          error: `Payment record failed: ${insErr.message}`,
        }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updErr } = await admin
        .from('payments')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', inserted.id);

      if (updErr) {
        return new Response(JSON.stringify({
          success: false,
          error: `Activation failed: ${updErr.message}`,
        }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true, razorpay_payment_id, razorpay_order_id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
