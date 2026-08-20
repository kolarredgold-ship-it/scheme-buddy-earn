import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget click tracking for AI tools and the Internship Report Generator.
 * Writes to public.tool_clicks; never throws (any error is swallowed).
 */
export async function trackToolClick(
  toolKey: string,
  source: string = "home",
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("tool_clicks").insert({
      user_id: user?.id ?? null,
      tool_key: toolKey,
      source,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 255) : null,
    });
  } catch {
    /* analytics must never break UX */
  }
}

/**
 * Fire-and-forget site event tracking (signups, payments, key page views).
 * Writes to public.site_events; never throws.
 */
export async function trackEvent(eventName: string, source?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("site_events").insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      source: source ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    });
  } catch {
    /* analytics must never break UX */
  }
}
