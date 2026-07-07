// Razorpay webhook receiver — handles async payment status updates.
// Configure in Razorpay dashboard:
//   URL: https://<project>.functions.supabase.co/razorpay-webhook
//   Events: payment.captured, payment.failed, order.paid
//   Secret: set as RAZORPAY_WEBHOOK_SECRET (optional but recommended)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac, timingSafeEqual } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  // SECURITY: Fail closed when secret is unset — never accept unverified webhooks.
  if (!webhookSecret) {
    await admin.from('payment_logs').insert({
      event: 'webhook.secret_missing',
      status: 'failed',
      error_message: 'RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook',
    });
    return new Response('Webhook secret not configured', { status: 503 });
  }

  try {
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await admin.from('payment_logs').insert({
        event: 'webhook.signature.invalid',
        status: 'failed',
        error_message: 'Invalid signature',
        raw_payload: { headers: { signature } },
      });
      return new Response('Invalid signature', { status: 401 });
    }
  } catch (e) {
    return new Response('Signature check failed', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload?.event as string | undefined;
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;
  const razorpayPaymentId = paymentEntity?.id;
  const razorpayOrderId = paymentEntity?.order_id ?? orderEntity?.id;
  const amount = paymentEntity ? (paymentEntity.amount ?? 0) / 100 : null;

  await admin.from('payment_logs').insert({
    event: `webhook.${event ?? 'unknown'}`,
    status: event?.includes('failed') ? 'failed' : 'success',
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    amount,
    raw_payload: payload,
  });

  // Handle captured payment: mark existing pending payment as verified if not already.
  if (event === 'payment.captured' || event === 'order.paid') {
    if (razorpayPaymentId) {
      const { data: existing } = await admin
        .from('payments')
        .select('id, status')
        .eq('transaction_number', razorpayPaymentId)
        .maybeSingle();

      if (existing && existing.status !== 'verified') {
        await admin
          .from('payments')
          .update({ status: 'verified', verified_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    }
  }

  if (event === 'payment.failed' && razorpayPaymentId) {
    await admin
      .from('payments')
      .update({
        status: 'rejected',
        admin_note: `Razorpay failure: ${paymentEntity?.error_description ?? 'unknown'}`,
      })
      .eq('transaction_number', razorpayPaymentId)
      .neq('status', 'verified');
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
