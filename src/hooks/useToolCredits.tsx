import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Per-tool AI credit engine (Phase 1).
 *
 * - Guest → cannot generate. Caller shows the signup gate.
 * - Free user → 1 lifetime generation per tool (counted from report_generations).
 * - Premium user → 3 generations per tool, tracked in public.tool_credits.
 * - ₹499 top-up → +3 to `full` (Internship Report), +5 to every other tool.
 *
 * All limits are enforced server-side by public.consume_tool_credit(_tool_key).
 */
export type GateReason = "guest" | "upgrade" | "limit_reached" | null;

export function useToolCredits(toolKey: string) {
  const { user, profile, refreshProfile } = useAuth();
  const [freeUsed, setFreeUsed] = useState(0);
  const [proCredits, setProCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gateReason, setGateReason] = useState<GateReason>(null);

  const isPro = profile?.subscription_status === "active";

  const refresh = useCallback(async () => {
    if (!user) {
      setFreeUsed(0);
      setProCredits(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ count }, { data: creditRow }] = await Promise.all([
      supabase
        .from("report_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("report_type", toolKey),
      supabase
        .from("tool_credits")
        .select("credits")
        .eq("user_id", user.id)
        .eq("tool_key", toolKey)
        .maybeSingle(),
    ]);
    setFreeUsed(count || 0);
    // Pro users default to 3 if no row yet (will be created on first consume)
    setProCredits(creditRow ? (creditRow as any).credits : (isPro ? 3 : 0));
    setLoading(false);
  }, [user, toolKey, isPro]);

  useEffect(() => {
    refresh();
  }, [refresh, profile?.subscription_status]);

  const remainingFree = isPro ? 0 : Math.max(0, 1 - freeUsed);
  const remainingPro = isPro ? proCredits : 0;
  const remainingTotal = remainingFree + remainingPro;
  const canGenerate = !!user && remainingTotal > 0;

  /**
   * Called by pages before starting a generation. Sets `gateReason` if blocked
   * and returns false; caller can render <ToolGateDialog /> to react.
   */
  const checkAccess = (): boolean => {
    if (!user) {
      setGateReason("guest");
      return false;
    }
    if (!canGenerate) {
      setGateReason(isPro ? "limit_reached" : "upgrade");
      return false;
    }
    return true;
  };

  const dismissGate = () => setGateReason(null);

  /**
   * Server-authoritative consume. Refuses if the caller has no allowance left.
   */
  const consume = async (meta: Record<string, any> = {}): Promise<boolean> => {
    if (!user) {
      setGateReason("guest");
      return false;
    }
    const { data, error } = await supabase.rpc("consume_tool_credit", {
      _tool_key: toolKey,
      _meta: meta as any,
    });
    if (error) {
      console.warn("consume_tool_credit error:", error.message);
      return false;
    }
    const result = data as any;
    if (!result?.ok) {
      const reason = result?.reason as GateReason;
      setGateReason(reason ?? "limit_reached");
      await refresh();
      return false;
    }
    if (result.source === "pro") {
      setProCredits(result.remaining ?? 0);
      setFreeUsed((n) => n);
    } else {
      setFreeUsed((n) => n + 1);
    }
    // Keep profile fresh (subscription banner counts etc.)
    refreshProfile();
    return true;
  };

  return {
    used: freeUsed,
    freeLimit: isPro ? 0 : 1,
    remainingFree,
    proCredits: remainingPro,
    aiCredits: remainingPro, // legacy alias
    remainingTotal,
    canGenerate,
    isPro,
    loading,
    consume,
    refresh,
    // Gate helpers
    gateReason,
    checkAccess,
    dismissGate,
  };
}
