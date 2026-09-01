import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_account",
  title: "Get my Techrola account",
  description:
    "Return the signed-in user's Techrola account summary: subscription status and expiry, referral code, wallet balance and remaining AI tool credits.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [{ data: profile, error: profileError }, { data: credits, error: creditsError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, email, referral_code, subscription_status, subscription_expires_at, wallet_balance, report_credits, ai_credits")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("tool_credits").select("tool_key, credits").eq("user_id", userId),
    ]);

    if (profileError) return { content: [{ type: "text", text: profileError.message }], isError: true };
    if (creditsError) return { content: [{ type: "text", text: creditsError.message }], isError: true };
    if (!profile) return { content: [{ type: "text", text: "No Techrola profile found for this account." }], isError: true };

    const account = { ...profile, tool_credits: credits ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(account, null, 2) }],
      structuredContent: { account },
    };
  },
});
