import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const appUrl = Deno.env.get("APP_URL") || "https://scheme-buddy-earn.lovable.app";

  try {
    let responseData: Record<string, string> = {};

    if (req.method === "POST") {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        responseData[key] = value.toString();
      });
    } else {
      const url = new URL(req.url);
      url.searchParams.forEach((value, key) => {
        responseData[key] = value;
      });
    }

    const transactionStatus = responseData.transaction_status || responseData.TRANSACTIONSTATUS;
    const orderId = responseData.orderid || responseData.ORDERID;
    const apTransactionId = responseData.ap_transactionid || responseData.APTRANSACTIONID;
    const amount = responseData.amount || responseData.AMOUNT;
    const statusMessage = responseData.message || responseData.MESSAGE;
    const providedChecksum = (responseData.checksum || responseData.CHECKSUM || "").toLowerCase();

    // === SIGNATURE VERIFICATION ===
    const secret = Deno.env.get("AIRPAY_SECRET");
    const username = Deno.env.get("AIRPAY_USERNAME");
    const password = Deno.env.get("AIRPAY_PASSWORD");

    if (!secret || !username || !password) {
      console.error("Airpay credentials not configured for signature verification");
      return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
    }

    if (!providedChecksum) {
      console.warn("Airpay callback rejected: missing checksum", { orderId });
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    // Build expected checksum: sort keys (excluding checksum), concat values, append privatekey hash, SHA-256
    // Standard Airpay response checksum = SHA256(sortedConcatenatedValues + privateKey)
    const privateKey = await sha256Hex(`${secret}@${username}:|:${password}`);

    const keysForChecksum = Object.keys(responseData)
      .filter(k => k.toLowerCase() !== "checksum")
      .sort();
    const concat = keysForChecksum.map(k => responseData[k]).join("") + privateKey;
    const expectedChecksum = await sha256Hex(concat);

    if (!timingSafeEqual(providedChecksum, expectedChecksum)) {
      console.warn("Airpay callback rejected: signature mismatch", { orderId, apTransactionId });
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const isSuccess = transactionStatus === "200" || responseData.transaction_payment_status === "SUCCESS";

    if (isSuccess && orderId && apTransactionId) {
      // === REPLAY PROTECTION ===
      // Try inserting into processed_payments; unique constraint blocks duplicates.
      const { error: dupErr } = await supabaseClient
        .from("processed_payments")
        .insert({
          ap_transaction_id: apTransactionId,
          order_id: orderId,
          amount: parseFloat(amount) || 0,
        });

      if (dupErr) {
        // 23505 = unique_violation -> already processed, return success without re-processing
        if ((dupErr as any).code === "23505") {
          console.log("Airpay callback: duplicate transaction ignored", { apTransactionId });
          const redirectUrl = `${appUrl}/payment-status?status=success&orderId=${orderId}&transactionId=${apTransactionId}&message=${encodeURIComponent("Already processed")}`;
          return new Response(null, { status: 302, headers: { ...corsHeaders, Location: redirectUrl } });
        }
        console.error("processed_payments insert error", dupErr);
        return new Response("Internal error", { status: 500, headers: corsHeaders });
      }

      // Extract user_id from orderId (format: SUB_{userId}_{timestamp})
      const parts = orderId.split("_");
      if (parts.length >= 2) {
        const userId = parts[1];

        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("user_id", userId);

        await supabaseClient.from("transactions").insert({
          user_id: userId,
          amount: parseFloat(amount) || 999,
          type: "credit",
          source: `Airpay|${orderId}|${apTransactionId}|success|${parseFloat(amount) || 999}`,
        });

        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("referred_by")
          .eq("user_id", userId)
          .single();

        if (profile?.referred_by) {
          const { data: referrer } = await supabaseClient
            .from("profiles")
            .select("user_id, referred_by")
            .eq("referral_code", profile.referred_by)
            .single();

          if (referrer) {
            const { data: referrerProfile } = await supabaseClient
              .from("profiles")
              .select("wallet_balance")
              .eq("user_id", referrer.user_id)
              .single();

            await supabaseClient.from("transactions").insert({
              user_id: referrer.user_id,
              amount: 400,
              type: "credit",
              source: `Level 1 referral - ${orderId}`,
            });
            await supabaseClient
              .from("profiles")
              .update({ wallet_balance: Number(referrerProfile?.wallet_balance || 0) + 400 })
              .eq("user_id", referrer.user_id);

            if (referrer.referred_by) {
              const { data: level2 } = await supabaseClient
                .from("profiles")
                .select("user_id, referred_by, wallet_balance")
                .eq("referral_code", referrer.referred_by)
                .single();

              if (level2) {
                await supabaseClient.from("transactions").insert({
                  user_id: level2.user_id,
                  amount: 100,
                  type: "credit",
                  source: `Level 2 referral - ${orderId}`,
                });
                await supabaseClient
                  .from("profiles")
                  .update({ wallet_balance: Number(level2.wallet_balance || 0) + 100 })
                  .eq("user_id", level2.user_id);

                if (level2.referred_by) {
                  const { data: level3 } = await supabaseClient
                    .from("profiles")
                    .select("user_id, wallet_balance")
                    .eq("referral_code", level2.referred_by)
                    .single();

                  if (level3) {
                    await supabaseClient.from("transactions").insert({
                      user_id: level3.user_id,
                      amount: 50,
                      type: "credit",
                      source: `Level 3 referral - ${orderId}`,
                    });
                    await supabaseClient
                      .from("profiles")
                      .update({ wallet_balance: Number(level3.wallet_balance || 0) + 50 })
                      .eq("user_id", level3.user_id);
                  }
                }
              }
            }
          }
        }
      }
    }

    const redirectUrl = `${appUrl}/payment-status?status=${isSuccess ? "success" : "failed"}&orderId=${orderId || ""}&transactionId=${apTransactionId || ""}&message=${encodeURIComponent(statusMessage || "")}`;

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: redirectUrl },
    });
  } catch (error) {
    console.error("Airpay callback error:", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/payment-status?status=error&message=${encodeURIComponent("Payment processing error")}`,
      },
    });
  }
});
