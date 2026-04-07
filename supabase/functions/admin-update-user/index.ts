import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized: not admin");

    const { action, userId, password } = await req.json();

    if (action === "change_password") {
      if (!userId || !password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "make_pro") {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!profile) throw new Error("User not found");

      // Determine price based on referral
      const price = profile.referred_by ? 1000 : 2999;

      // Update subscription status and add 3 report credits
      await supabase
        .from("profiles")
        .update({ 
          subscription_status: "active",
          report_credits: (profile.report_credits || 0) + 3
        })
        .eq("user_id", userId);

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        amount: price,
        type: "credit",
        source: `Admin Pro Subscription (₹${price})`,
      });

      // Distribute referral earnings if referred
      if (profile.referred_by) {
        // Level 1: Find the referrer (who owns the referral code)
        const { data: level1 } = await supabase
          .from("profiles")
          .select("user_id, referred_by, wallet_balance")
          .eq("referral_code", profile.referred_by)
          .single();

        if (level1) {
          // Credit ₹400 to Level 1
          await supabase
            .from("profiles")
            .update({ wallet_balance: Number(level1.wallet_balance) + 400 })
            .eq("user_id", level1.user_id);
          await supabase.from("transactions").insert({
            user_id: level1.user_id,
            amount: 400,
            type: "credit",
            source: `L1 Referral: ${profile.name || profile.email || 'User'} subscribed`,
          });

          // Level 2
          if (level1.referred_by) {
            const { data: level2 } = await supabase
              .from("profiles")
              .select("user_id, referred_by, wallet_balance")
              .eq("referral_code", level1.referred_by)
              .single();

            if (level2) {
              await supabase
                .from("profiles")
                .update({ wallet_balance: Number(level2.wallet_balance) + 50 })
                .eq("user_id", level2.user_id);
              await supabase.from("transactions").insert({
                user_id: level2.user_id,
                amount: 50,
                type: "credit",
                source: `L2 Referral: ${profile.name || profile.email || 'User'} subscribed`,
              });

              // Level 3
              if (level2.referred_by) {
                const { data: level3 } = await supabase
                  .from("profiles")
                  .select("user_id, wallet_balance")
                  .eq("referral_code", level2.referred_by)
                  .single();

                if (level3) {
                  await supabase
                    .from("profiles")
                    .update({ wallet_balance: Number(level3.wallet_balance) + 50 })
                    .eq("user_id", level3.user_id);
                  await supabase.from("transactions").insert({
                    user_id: level3.user_id,
                    amount: 50,
                    type: "credit",
                    source: `L3 Referral: ${profile.name || profile.email || 'User'} subscribed`,
                  });
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true, price }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
