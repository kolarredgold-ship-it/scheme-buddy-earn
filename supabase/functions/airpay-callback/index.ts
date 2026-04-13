import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Airpay sends response as POST form data or query params
    let responseData: Record<string, string> = {};
    
    if (req.method === "POST") {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        responseData[key] = value.toString();
      });
    } else {
      url.searchParams.forEach((value, key) => {
        responseData[key] = value;
      });
    }

    const transactionStatus = responseData.transaction_status || responseData.TRANSACTIONSTATUS;
    const orderId = responseData.orderid || responseData.ORDERID;
    const apTransactionId = responseData.ap_transactionid || responseData.APTRANSACTIONID;
    const amount = responseData.amount || responseData.AMOUNT;
    const statusMessage = responseData.message || responseData.MESSAGE;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const isSuccess = transactionStatus === "200" || responseData.transaction_payment_status === "SUCCESS";

    if (isSuccess && orderId) {
      // Extract user_id from orderId (format: SUB_{userId}_{timestamp})
      const parts = orderId.split("_");
      if (parts.length >= 2) {
        const userId = parts[1];

        // Update subscription status
        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("user_id", userId);

        // Record transaction
        await supabaseClient.from("transactions").insert({
          user_id: userId,
          amount: parseFloat(amount) || 999,
          type: "credit",
          source: `Airpay Payment - ${apTransactionId}`,
        });

        // Handle referral earnings
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("referred_by")
          .eq("user_id", userId)
          .single();

        if (profile?.referred_by) {
          // Find referrer (Level 1 - ₹400)
          const { data: referrer } = await supabaseClient
            .from("profiles")
            .select("user_id, referred_by")
            .eq("referral_code", profile.referred_by)
            .single();

          if (referrer) {
            // Get current balance first
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

            // Level 2 referrer - ₹100
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

                // Level 3 referrer - ₹50
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

    // Redirect to app with status
    const appUrl = Deno.env.get("APP_URL") || "https://scheme-buddy-earn.lovable.app";
    const redirectUrl = `${appUrl}/payment-status?status=${isSuccess ? "success" : "failed"}&orderId=${orderId || ""}&transactionId=${apTransactionId || ""}&message=${encodeURIComponent(statusMessage || "")}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("Airpay callback error:", error);
    const appUrl = Deno.env.get("APP_URL") || "https://scheme-buddy-earn.lovable.app";
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/payment-status?status=error&message=${encodeURIComponent("Payment processing error")}`,
      },
    });
  }
});
