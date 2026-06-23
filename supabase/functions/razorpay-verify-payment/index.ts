import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const log = async (row: Record<string, unknown>) => {
    try { await admin.from('payment_logs').insert(row); } catch (_) { /* swallow */ }
  };

  try {
    const body = await req.json();
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
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await log({
        event: 'verify.missing_fields', status: 'failed',
        razorpay_order_id, razorpay_payment_id, user_id, amount, payment_type,
        error_message: 'Missing fields', raw_payload: body,
      });
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await log({
        event: 'verify.invalid_signature', status: 'failed',
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        user_id, amount, payment_type,
        error_message: 'Signature mismatch', raw_payload: body,
      });
      return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user_id) {
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
        await log({
          event: 'verify.insert_failed', status: 'failed',
          razorpay_order_id, razorpay_payment_id, user_id, amount, payment_type,
          error_message: insErr.message, raw_payload: body,
        });
        return new Response(JSON.stringify({
          success: false, error: `Payment record failed: ${insErr.message}`,
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { error: updErr } = await admin
        .from('payments')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', inserted.id);

      if (updErr) {
        await log({
          event: 'verify.activation_failed', status: 'failed',
          razorpay_order_id, razorpay_payment_id, user_id, amount, payment_type,
          error_message: updErr.message, raw_payload: body,
        });
        return new Response(JSON.stringify({
          success: false, error: `Activation failed: ${updErr.message}`,
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    await log({
      event: 'verify.success', status: 'success',
      razorpay_order_id, razorpay_payment_id, user_id, amount, payment_type,
    });

    return new Response(JSON.stringify({
      success: true, razorpay_payment_id, razorpay_order_id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = (e as Error).message;
    await log({ event: 'verify.exception', status: 'failed', error_message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
