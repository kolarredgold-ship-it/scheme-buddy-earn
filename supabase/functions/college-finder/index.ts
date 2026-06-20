import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { location, type = "both" } = await req.json();
    if (!location || String(location).trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: "Location required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const aiConfig = deepseekKey
      ? { url: "https://api.deepseek.com/chat/completions", key: deepseekKey, model: "deepseek-chat" }
      : lovableKey
        ? { url: "https://ai.gateway.lovable.dev/v1/chat/completions", key: lovableKey, model: "google/gemini-2.5-flash" }
        : null;

    if (!aiConfig) {
      return new Response(JSON.stringify({ success: false, error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabel = type === "school" ? "schools" : type === "college" ? "colleges" : "colleges and schools";
    const prompt = `List ${typeLabel} located in or near "${location}" in India. Return up to 12 entries. Do not rank, prioritize, or label any as "top". Just list them as a neutral directory.

Return ONLY valid JSON in this exact shape, no commentary:
{"items":[{"name":"...","type":"college|school","city":"...","state":"...","category":"...","website":"https://..."}]}

Rules:
- "type" must be either "college" or "school"
- "category" is a short tag like "Engineering", "Arts & Science", "Medical", "CBSE School", "State Board", etc.
- "website" should be the official site if known; otherwise empty string
- Do not include words like "top", "best", "leading", "premier" anywhere`;

    const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (aiConfig.url.includes("lovable.dev")) aiHeaders["Lovable-API-Key"] = aiConfig.key;
    else aiHeaders["Authorization"] = `Bearer ${aiConfig.key}`;

    const aiRes = await fetch(aiConfig.url, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: "You return only valid JSON. No markdown, no commentary." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ success: false, error: `AI error: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    return new Response(JSON.stringify({ success: true, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
