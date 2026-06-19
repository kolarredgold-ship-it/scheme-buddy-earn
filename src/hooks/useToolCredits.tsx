import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Unified AI tool credit logic for Techrola.
 *
 * - Free user: 1 generation per tool (one-time)
 * - Pro user: 3 generations per tool (one-time)
 * - Topup ₹499: adds +3 generations to a global pool (ai_credits)
 *   that can be used in any tool after free limits are exhausted.
 *
 * Per-tool usage is counted from public.report_generations
 * (existing table) using `report_type` as the tool key.
 */
export function useToolCredits(toolKey: string) {
  const { user, profile, refreshProfile } = useAuth();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const isPro = profile?.subscription_status === "active";
  const freeLimit = isPro ? 3 : 1;
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

  /**
   * Returns true if the generation should proceed.
   * Records the usage and decrements ai_credits if free was exhausted.
   * The DB trigger blocks ai_credits writes by non-admins for free users,
   * so we call an edge function for the decrement.
   */
  const consume = async (meta: Record<string, any> = {}): Promise<boolean> => {
    if (!user) return false;
    if (!canGenerate) return false;

    // Record the generation (free OR paid).
    await supabase.from("report_generations").insert({
      user_id: user.id,
      report_type: toolKey,
      form_data: meta as any,
    });

    // If the user was beyond free limit, debit one ai_credit via edge function
    // (DB trigger forbids client-side writes to ai_credits).
    if (remainingFree === 0 && aiCredits > 0) {
      await supabase.functions.invoke("consume-ai-credit", {
        body: { user_id: user.id, tool_key: toolKey },
      });
      await refreshProfile();
    }

    await refresh();
    return true;
  };

  return {
    used,
    freeLimit,
    remainingFree,
    aiCredits,
    canGenerate,
    isPro,
    loading,
    consume,
    refresh,
  };
}
