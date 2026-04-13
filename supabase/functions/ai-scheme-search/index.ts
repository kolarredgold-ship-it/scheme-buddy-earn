import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Query too short" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use DeepSeek or Lovable AI to understand intent
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    const aiConfig = deepseekKey
      ? { url: "https://api.deepseek.com/chat/completions", key: deepseekKey, model: "deepseek-chat" }
      : lovableKey
        ? { url: "https://ai-gateway.lovable.dev/chat/completions", key: lovableKey, model: "google/gemini-2.5-flash" }
        : null;

    let searchState: string | null = null;
    let searchCategory: string | null = null;
    let searchKeywords: string[] = [];

    if (aiConfig) {
      try {
        const aiResponse = await fetch(aiConfig.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${aiConfig.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              {
                role: "system",
                content: `You parse Indian government scheme search queries. Extract:
- state: Indian state name in snake_case (e.g., "tamil_nadu", "karnataka") or null
- category: one of [scholarships, farmers, sc_st, minority, housing, health, education, business, govt_jobs] or null
- keywords: array of relevant search terms

Return ONLY valid JSON: {"state": "...", "category": "...", "keywords": ["...", "..."]}`
              },
              { role: "user", content: query }
            ],
            temperature: 0.1,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              searchState = parsed.state;
              searchCategory = parsed.category;
              searchKeywords = parsed.keywords || [];
            }
          } catch { /* fallback to text search */ }
        }
      } catch (e) {
        console.error("AI parse error:", e);
      }
    }

    // Build query
    let dbQuery = supabase
      .from("schemes")
      .select("id, title, category, description, state, image_url, eligibility, tags, beneficiary_type")
      .eq("is_active", true);

    if (searchState) {
      dbQuery = dbQuery.eq("state", searchState);
    }
    if (searchCategory) {
      dbQuery = dbQuery.eq("category", searchCategory);
    }

    // Text search using ilike for keywords
    const searchTerms = searchKeywords.length > 0
      ? searchKeywords
      : query.split(/\s+/).filter((w: string) => w.length > 2);

    if (searchTerms.length > 0) {
      const orConditions = searchTerms
        .map((term: string) => `title.ilike.%${term}%,description.ilike.%${term}%,eligibility.ilike.%${term}%`)
        .join(",");
      dbQuery = dbQuery.or(orConditions);
    }

    const { data: schemes, error } = await dbQuery.limit(20);

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Generate AI summary if we have results
    let aiSummary = "";
    if (aiConfig && schemes && schemes.length > 0) {
      try {
        const summaryResponse = await fetch(aiConfig.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${aiConfig.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: "system", content: "Summarize search results in 1-2 sentences. Be helpful and concise." },
              { role: "user", content: `User searched: "${query}". Found ${schemes.length} schemes. Top results: ${schemes.slice(0, 3).map((s: any) => s.title).join(", ")}` }
            ],
            temperature: 0.5,
          }),
        });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          aiSummary = summaryData.choices?.[0]?.message?.content || "";
        }
      } catch { /* skip summary */ }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schemes: schemes || [],
        total: schemes?.length || 0,
        ai_summary: aiSummary,
        parsed: { state: searchState, category: searchCategory, keywords: searchKeywords },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
