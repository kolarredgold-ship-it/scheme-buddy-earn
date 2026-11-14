import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// No AI image models are used. Report figures come from a royalty-free stock source.
async function stockImage(keyword: string, index: number) {
  const seed = `${keyword}-${index}`;
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
  const resp = await fetch(url, { redirect: "follow" });
  if (!resp.ok) return null;
  const arrayBuffer = await resp.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Authentication required" });
    }
    const token = authHeader.slice("Bearer ".length);
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json(401, { error: "Invalid or expired token" });
    }

    // ========== INPUT VALIDATION ==========
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(400, { error: "Invalid request body" });
    }
    const keyword = typeof body.keyword === "string" ? body.keyword.trim().slice(0, 300) : "";
    const index = Number.isFinite(Number(body.index)) ? Math.trunc(Number(body.index)) : 0;
    if (!keyword) {
      return json(400, { error: "keyword is required" });
    }

    const image = await stockImage(keyword, index);
    if (image) {
      return json(200, { image, source: "stock" });
    }

    return json(500, { error: "No image available" });
  } catch (error) {
    console.error("Image error:", error);
    return json(500, { error: "Unexpected error, please try again" });
  }
});
