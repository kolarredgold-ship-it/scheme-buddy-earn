import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Unified AI tool credit logic for Techrola.
 *
 * - Free user: 1 generation per tool (one-time, counted from report_generations).
 * - Pro subscriber: 3 generations TOTAL across all tools (shared pool via ai_credits;
 *   seeded to 3 when subscription is verified by handle_payment_verified trigger).
 * - Each ₹499 top-up adds +5 generations to the same shared ai_credits pool.
 */
export function useToolCredits(toolKey: string) {
  const { user, profile, refreshProfile } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const isPro = profile?.subscription_status === "active";
  const freeLimit = isPro ? 0 : 1; // Pro users use ai_credits only
  const aiCredits = profile?.ai_credits ?? 0;
  const remainingFree = Math.max(0, freeLimit - used);
  const canGenerate = remainingFree > 0 || aiCredits > 0;

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { count } = await supabase
      .from("report_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("report_type", toolKey);
    setUsed(count || 0);
    setLoading(false);
  }, [user, toolKey]);

  useEffect(() => {
    refresh();
  }, [refresh, profile?.subscription_status, profile?.ai_credits]);

  const consume = async (meta: Record<string, any> = {}): Promise<boolean> => {
    if (!user) return false;
    if (!canGenerate) return false;

    await supabase.from("report_generations").insert({
      user_id: user.id,
      report_type: toolKey,
      form_data: meta as any,
    });

    if (remainingFree === 0 && aiCredits > 0) {
      await supabase.functions.invoke("consume-ai-credit", {
        body: { user_id: user.id, tool_key: toolKey },
      });
      await refreshProfile();
    }

    await refresh();
    return true;
  };

  const remainingTotal = remainingFree + aiCredits;

  return {
    used,
    freeLimit,
    remainingFree,
    aiCredits,
    remainingTotal,
    canGenerate,
    isPro,
    loading,
    consume,
    refresh,
  };
}
