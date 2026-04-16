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

    // Get AI config
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    const aiConfig = deepseekKey
      ? { url: "https://api.deepseek.com/chat/completions", key: deepseekKey, model: "deepseek-chat" }
      : lovableKey
        ? { url: "https://ai-gateway.lovable.dev/chat/completions", key: lovableKey, model: "google/gemini-2.5-flash" }
        : null;

    // Step 1: Parse user intent locally (no AI call — saves time)
    const stateMap: Record<string, string> = {
      "andhra pradesh": "andhra_pradesh", "arunachal pradesh": "arunachal_pradesh",
      "assam": "assam", "bihar": "bihar", "chhattisgarh": "chhattisgarh",
      "goa": "goa", "gujarat": "gujarat", "haryana": "haryana",
      "himachal pradesh": "himachal_pradesh", "jharkhand": "jharkhand",
      "karnataka": "karnataka", "kerala": "kerala", "madhya pradesh": "madhya_pradesh",
      "maharashtra": "maharashtra", "manipur": "manipur", "meghalaya": "meghalaya",
      "mizoram": "mizoram", "nagaland": "nagaland", "odisha": "odisha",
      "punjab": "punjab", "rajasthan": "rajasthan", "sikkim": "sikkim",
      "tamil nadu": "tamil_nadu", "telangana": "telangana", "tripura": "tripura",
      "uttar pradesh": "uttar_pradesh", "uttarakhand": "uttarakhand",
      "west bengal": "west_bengal", "delhi": "delhi",
    };
    const queryLowerFull = query.toLowerCase();
    let searchState: string | null = null;
    for (const [name, code] of Object.entries(stateMap)) {
      if (queryLowerFull.includes(name)) {
        searchState = code;
        break;
      }
    }
    const searchKeywords = query.split(/\s+/).filter((w: string) => w.length > 2);

    // Step 2: Search local database first
    let dbQuery = supabase
      .from("schemes")
      .select("id, title, category, description, state, image_url, eligibility, tags, beneficiary_type, slug, apply_link, source_website");

    if (searchState) {
      dbQuery = dbQuery.eq("state", searchState);
    }

    const searchTerms = searchKeywords.length > 0
      ? searchKeywords
      : query.split(/\s+/).filter((w: string) => w.length > 2);

    if (searchTerms.length > 0) {
      const orConditions = searchTerms.slice(0, 3).map((term: string) =>
        `title.ilike.%${term}%,description.ilike.%${term}%,eligibility.ilike.%${term}%`
      ).join(",");
      dbQuery = dbQuery.or(orConditions);
    }

    const { data: localSchemes, error } = await dbQuery.limit(20);

    if (error) {
      console.error("DB query error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Step 3: Check if local results are relevant (title must closely match query keywords)
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
    const relevantLocal = (localSchemes || []).filter((s: any) => {
      const titleLower = (s.title || "").toLowerCase();
      // A result is relevant if at least half the query words appear in title
      const matchCount = queryWords.filter((w: string) => titleLower.includes(w)).length;
      return matchCount >= Math.ceil(queryWords.length / 2);
    });

    if (relevantLocal.length >= 3) {
      const aiSummary = await generateSummary(aiConfig, query, relevantLocal);
      return new Response(
        JSON.stringify({
          success: true,
          schemes: relevantLocal,
          total: relevantLocal.length,
          ai_summary: aiSummary,
          source: "database",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Not enough local results — use AI to research and find schemes
    if (!aiConfig) {
      // No AI available, return whatever we have
      return new Response(
        JSON.stringify({
          success: true,
          schemes: localSchemes || [],
          total: localSchemes?.length || 0,
          ai_summary: "",
          source: "database",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Only ${relevantLocal.length} relevant (${localSchemes?.length || 0} total) results for "${query}", fetching from AI...`);

    let aiSchemes: any[] = [];
    try {
      const researchResponse = await fetch(aiConfig.url, {
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
              content: `You are an expert on Indian government schemes and welfare programs. 
Given a user query, find real Indian government schemes that match.

For each scheme, provide:
- title: Official scheme name
- description: 2-3 sentence description
- eligibility: Who can apply
- category: One of [scholarships, farmers, sc_st, minority, housing, health, education, business, govt_jobs]
- state: Indian state in snake_case or "central" for central govt schemes
- apply_link: The OFFICIAL government website URL where users can apply. This is MANDATORY. Use the actual .gov.in or .nic.in portal URL. If you're not 100% sure of the exact apply URL, provide the department's official website URL instead.
- department_website: The official department/ministry website URL (e.g., https://pmkisan.gov.in, https://scholarships.gov.in)
- documents: Required documents to apply (comma separated)
- beneficiary_type: Who benefits (e.g., "students", "farmers", "women", "senior citizens")

Return ONLY valid JSON array with 3-8 schemes:
[{"title": "...", "description": "...", "eligibility": "...", "category": "...", "state": "...", "apply_link": "...", "department_website": "...", "documents": "...", "beneficiary_type": "..."}]

IMPORTANT: Only include REAL government schemes. Do not make up fictional schemes. The apply_link MUST be a real government URL.`
            },
            { role: "user", content: `Find Indian government schemes for: "${query}"` }
          ],
          temperature: 0.2,
        }),
      });

      if (researchResponse.ok) {
        const researchData = await researchResponse.json();
        const content = researchData.choices?.[0]?.message?.content || "";
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiSchemes = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Failed to parse AI schemes:", e);
        }
      }
    } catch (e) {
      console.error("AI research error:", e);
    }

    // Step 5: Store AI-discovered schemes in database
    const storedSchemes: any[] = [];
    for (const scheme of aiSchemes) {
      if (!scheme.title || !scheme.description || !scheme.category) continue;

      // Check if scheme already exists by title
      const { data: existing } = await supabase
        .from("schemes")
        .select("id, slug, apply_link, source_website")
        .ilike("title", scheme.title)
        .limit(1);

      if (existing && existing.length > 0) {
        // Already exists, use existing data
        storedSchemes.push({
          ...existing[0],
          title: scheme.title,
          description: scheme.description,
          category: scheme.category,
          state: scheme.state || "central",
          eligibility: scheme.eligibility,
          apply_link: existing[0].apply_link || scheme.apply_link || null,
          source_website: existing[0].source_website || scheme.department_website || null,
        });
        continue;
      }

      // Insert new scheme — apply_link is mandatory, fallback to department_website
      const applyLink = scheme.apply_link || scheme.department_website || null;
      const sourceWebsite = scheme.department_website || scheme.apply_link || null;

      const { data: inserted, error: insertError } = await supabase
        .from("schemes")
        .insert({
          title: scheme.title,
          description: scheme.description,
          eligibility: scheme.eligibility || null,
          category: scheme.category,
          state: scheme.state || "central",
          apply_link: applyLink,
          source_website: sourceWebsite,
          documents: scheme.documents || null,
          beneficiary_type: scheme.beneficiary_type || null,
          tags: searchKeywords.length > 0 ? searchKeywords : [],
          slug: "", // trigger will generate
        })
        .select("id, title, category, description, state, image_url, eligibility, slug, apply_link, source_website")
        .single();

      if (insertError) {
        console.error("Insert error for scheme:", scheme.title, insertError);
      } else if (inserted) {
        storedSchemes.push(inserted);
      }
    }

    // Combine local + AI results, deduplicate
    const allSchemes = [...(localSchemes || [])];
    const existingIds = new Set(allSchemes.map(s => s.id));
    for (const s of storedSchemes) {
      if (!existingIds.has(s.id)) {
        allSchemes.push(s);
        existingIds.add(s.id);
      }
    }

    // Skip summary for AI-enriched to avoid timeout (already 1 AI call used)
    const aiSummary = storedSchemes.length > 0
      ? `Found ${allSchemes.length} schemes matching "${query}", including ${storedSchemes.length} newly discovered.`
      : await generateSummary(aiConfig, query, allSchemes);

    return new Response(
      JSON.stringify({
        success: true,
        schemes: allSchemes,
        total: allSchemes.length,
        ai_summary: aiSummary,
        source: storedSchemes.length > 0 ? "ai_enriched" : "database",
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

async function generateSummary(aiConfig: any, query: string, schemes: any[]): Promise<string> {
  if (!aiConfig || !schemes || schemes.length === 0) return "";
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
      return summaryData.choices?.[0]?.message?.content || "";
    }
  } catch { /* skip summary */ }
  return "";
}
