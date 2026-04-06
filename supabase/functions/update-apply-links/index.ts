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

  try {
    const { offset = 0, limit = 10 } = await req.json();

    // Fetch batch of schemes
    const { data: schemes, error: fetchError } = await supabase
      .from("schemes")
      .select("id, title")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;
    if (!schemes || schemes.length === 0) {
      return new Response(JSON.stringify({ done: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for batch
    const schemeList = schemes.map((s, i) => `${i + 1}. ${s.title}`).join("\n");

    const prompt = `For each Indian government scheme below, provide the OFFICIAL application/department website URL where citizens can apply. NOT myscheme.gov.in links. Give the actual ministry or department portal URL.

If the scheme has a dedicated portal, give that URL. If not, give the parent ministry/department URL. If you are unsure, give the most relevant official .gov.in or .nic.in URL.

Schemes:
${schemeList}

Respond ONLY with a JSON array of objects with "index" (1-based) and "url" fields. No explanation. Example:
[{"index":1,"url":"https://scholarships.gov.in"},{"index":2,"url":"https://pmkisan.gov.in"}]`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert on Indian government schemes. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek error:", response.status, errText);
      return new Response(JSON.stringify({ error: `DeepSeek API error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const links = JSON.parse(jsonMatch[0]);
    let updated = 0;

    for (const item of links) {
      const scheme = schemes[item.index - 1];
      if (scheme && item.url && item.url.startsWith("http")) {
        const { error: updateError } = await supabase
          .from("schemes")
          .update({ apply_link: item.url })
          .eq("id", scheme.id);
        if (!updateError) updated++;
        else console.error(`Failed to update ${scheme.id}:`, updateError);
      }
    }

    return new Response(JSON.stringify({
      done: false,
      processed: schemes.length,
      updated,
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
