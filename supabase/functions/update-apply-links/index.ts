import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Require admin caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: claimsData.claims.sub, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { offset = 0, limit = 10 } = await req.json();

    // Fetch schemes that still have myscheme.gov.in links
    const { data: schemes, error: fetchError } = await supabase
      .from("schemes")
      .select("id, title")
      .like("apply_link", "%myscheme.gov.in%")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;
    if (!schemes || schemes.length === 0) {
      return new Response(JSON.stringify({ done: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const schemeList = schemes.map((s, i) => `${i + 1}. ${s.title}`).join("\n");

    const prompt = `For each Indian government scheme below, I need the OFFICIAL APPLICATION PORTAL URL — the actual website where a citizen goes to apply.

CRITICAL RULES:
- NEVER return any URL containing "myscheme.gov.in" — that is an aggregator, not the official portal
- Return the actual ministry/department/dedicated portal URL (e.g., pmkisan.gov.in, scholarships.gov.in, pmaymis.gov.in)
- If a scheme has a dedicated portal, use that (e.g., PM-KISAN → https://pmkisan.gov.in)
- If no dedicated portal exists, use the parent ministry website
- All URLs must be .gov.in or .nic.in domains

Schemes:
${schemeList}

Respond ONLY with a JSON array: [{"index":1,"url":"https://..."},...]`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert on Indian government schemes and their official portals. Never return myscheme.gov.in URLs. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `DeepSeek API error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const links = JSON.parse(jsonMatch[0]);
    let updated = 0;
    let skipped = 0;

    for (const item of links) {
      const scheme = schemes[item.index - 1];
      if (scheme && item.url && item.url.startsWith("http") && !item.url.includes("myscheme.gov.in")) {
        const { error: updateError } = await supabase
          .from("schemes")
          .update({ apply_link: item.url })
          .eq("id", scheme.id);
        if (!updateError) updated++;
      } else {
        skipped++;
      }
    }

    return new Response(JSON.stringify({
      done: false,
      processed: schemes.length,
      updated,
      skipped,
      nextOffset: offset + limit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
