import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

// SECURITY: This endpoint requires an authenticated caller. user_id is derived
// from the JWT (never trusted from client body), and amount/payment_type are
// validated against the actual Razorpay order fetched with server credentials.
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
    // 1) Authenticate the caller and derive user_id from the JWT.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authUserId = userData.user.id;
    const authUserEmail = userData.user.email;

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_type: requestedType = 'subscription',
      payer_name,
      payer_email,
      payer_mobile,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await log({
        event: 'verify.missing_fields', status: 'failed',
        razorpay_order_id, razorpay_payment_id, user_id: authUserId,
        error_message: 'Missing fields', raw_payload: body,
      });
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Verify HMAC signature.
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await log({
        event: 'verify.invalid_signature', status: 'failed',
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        user_id: authUserId, payment_type: requestedType,
        error_message: 'Signature mismatch', raw_payload: body,
      });
      return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Fetch the authoritative order from Razorpay to derive the true amount.
    const rzpAuth = btoa(`${keyId}:${keySecret}`);
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${rzpAuth}` },
    });
    if (!orderRes.ok) {
      const t = await orderRes.text();
      await log({
        event: 'verify.order_fetch_failed', status: 'failed',
        razorpay_order_id, razorpay_payment_id, user_id: authUserId,
        error_message: `Order fetch ${orderRes.status}: ${t}`, raw_payload: body,
      });
      return new Response(JSON.stringify({ success: false, error: 'Order lookup failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const order = await orderRes.json();
    // Razorpay stores amount in paise; store rupees.
    const trueAmount = Number(order?.amount ?? 0) / 100;

    // 4) Constrain payment_type to known values and validate the paid amount
    // matches the expected server-side price. Prevents ₹1-order exploits.
    const PRICE_TABLE: Record<string, number> = {
      subscription: 999,
      topup: 499,
      ai_topup: 499,
    };
    const payment_type = PRICE_TABLE[requestedType] ? requestedType : 'subscription';
    const expectedAmount = PRICE_TABLE[payment_type];
    if (Math.round(trueAmount) !== expectedAmount) {
      await log({
        event: 'verify.amount_mismatch', status: 'failed',
        razorpay_order_id, razorpay_payment_id, user_id: authUserId,
        amount: trueAmount, payment_type,
        error_message: `Expected ${expectedAmount}, got ${trueAmount}`,
        raw_payload: body,
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment amount does not match expected price. Contact support.',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // 5) Insert payment record with server-derived user_id and amount.
    const { data: inserted, error: insErr } = await admin
      .from('payments')
      .insert({
        user_id: authUserId,
        amount: trueAmount,
        currency: 'INR',
        payment_type,
        status: 'pending',
        transaction_number: razorpay_payment_id,
        payer_name,
        payer_email: payer_email ?? authUserEmail,
        payer_mobile,
        admin_note: `Razorpay order ${razorpay_order_id}`,
      })
      .select('id')
      .single();

    if (insErr) {
      await log({
        event: 'verify.insert_failed', status: 'failed',
        razorpay_order_id, razorpay_payment_id, user_id: authUserId,
        amount: trueAmount, payment_type,
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
        razorpay_order_id, razorpay_payment_id, user_id: authUserId,
        amount: trueAmount, payment_type,
        error_message: updErr.message, raw_payload: body,
      });
      return new Response(JSON.stringify({
        success: false, error: `Activation failed: ${updErr.message}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await log({
      event: 'verify.success', status: 'success',
      razorpay_order_id, razorpay_payment_id, user_id: authUserId,
      amount: trueAmount, payment_type,
    });

    return new Response(JSON.stringify({
      success: true, razorpay_payment_id, razorpay_order_id, amount: trueAmount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = (e as Error).message;
    await log({ event: 'verify.exception', status: 'failed', error_message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
