import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SchemeData {
  title: string;
  category: string;
  state: string;
  description: string;
  eligibility?: string;
  documents?: string;
  apply_link?: string;
}

// Official government portal URLs to monitor for scheme updates
const PORTAL_SOURCES: Record<string, { url: string; state: string; category: string }[]> = {
  karnataka: [
    { url: "https://sevasindhu.karnataka.gov.in", state: "karnataka", category: "govt_jobs" },
    { url: "https://ssp.postmatric.karnataka.gov.in", state: "karnataka", category: "scholarships" },
    { url: "https://socialwelfare.karnataka.gov.in", state: "karnataka", category: "sc_st" },
    { url: "https://minoritywelfare.karnataka.gov.in", state: "karnataka", category: "minority" },
    { url: "https://raitamitra.karnataka.gov.in", state: "karnataka", category: "farmers" },
    { url: "https://dwcd.karnataka.gov.in", state: "karnataka", category: "health" },
  ],
  central: [
    { url: "https://www.myscheme.gov.in", state: "central", category: "education" },
    { url: "https://scholarships.gov.in", state: "central", category: "scholarships" },
    { url: "https://pmkisan.gov.in", state: "central", category: "farmers" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let targetState = "all";
    let mode = "check"; // "check" = search for new schemes, "report" = just report stats
    
    try {
      const body = await req.json();
      targetState = body.state || "all";
      mode = body.mode || "check";
    } catch {
      // No body provided, use defaults
    }

    // Get current scheme count per state
    const { data: existingSchemes, error: fetchError } = await supabase
      .from("schemes")
      .select("title, state, category");

    if (fetchError) {
      throw new Error(`Failed to fetch existing schemes: ${fetchError.message}`);
    }

    const existingTitles = new Set(
      (existingSchemes || []).map((s: any) => `${s.title}__${s.state}`.toLowerCase())
    );

    const stateCounts: Record<string, number> = {};
    for (const s of existingSchemes || []) {
      stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
    }

    if (mode === "report") {
      return new Response(
        JSON.stringify({
          success: true,
          total_schemes: existingSchemes?.length || 0,
          by_state: stateCounts,
          last_sync: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to discover and generate new scheme data
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "AI API key not configured",
          existing_stats: { total: existingSchemes?.length, by_state: stateCounts }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Determine which states need more schemes
    const statesToSync = targetState === "all" 
      ? Object.keys(stateCounts).filter(s => (stateCounts[s] || 0) < 30)
      : [targetState];

    let totalAdded = 0;
    const results: Record<string, number> = {};

    for (const state of statesToSync.slice(0, 5)) { // Process max 5 states per run
      const stateLabel = state.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const currentCount = stateCounts[state] || 0;
      
      if (currentCount >= 30) continue; // Skip states with enough schemes

      const schemesToGenerate = Math.min(10, 30 - currentCount);

      // Get existing scheme titles for this state to avoid duplicates
      const existingForState = (existingSchemes || [])
        .filter((s: any) => s.state === state)
        .map((s: any) => s.title);

      const prompt = `Generate ${schemesToGenerate} real government schemes for ${stateLabel}, India that are NOT in this list: ${existingForState.join(", ")}.

For each scheme, provide a JSON array with objects having these fields:
- title: Official scheme name
- category: One of: scholarships, farmers, sc_st, minority, housing, health, education, business, govt_jobs
- description: 2-3 sentence description of the scheme
- eligibility: Who can apply
- documents: Required documents (comma-separated)
- apply_link: Official government portal URL

Focus on REAL, currently active government schemes. Include state-specific schemes from official departments.
Return ONLY a valid JSON array, no other text.`;

      try {
        const aiResponse = await fetch("https://ai-gateway.lovable.dev/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a government scheme research assistant. Only output valid JSON arrays. No markdown, no explanations." },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API failed for ${state}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse the AI response - extract JSON array
        let schemes: SchemeData[] = [];
        try {
          // Try to find JSON array in the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            schemes = JSON.parse(jsonMatch[0]);
          }
        } catch (parseErr) {
          console.error(`Failed to parse AI response for ${state}:`, parseErr);
          continue;
        }

        // Filter out duplicates and insert new schemes
        const newSchemes = schemes
          .filter((s: SchemeData) => {
            const key = `${s.title}__${state}`.toLowerCase();
            return !existingTitles.has(key) && s.title && s.description;
          })
          .map((s: SchemeData) => ({
            title: s.title,
            category: s.category || "education",
            state: state,
            description: s.description,
            eligibility: s.eligibility || null,
            documents: s.documents || null,
            apply_link: s.apply_link || null,
          }));

        if (newSchemes.length > 0) {
          const { error: insertError } = await supabase
            .from("schemes")
            .insert(newSchemes);

          if (insertError) {
            console.error(`Insert failed for ${state}:`, insertError.message);
          } else {
            totalAdded += newSchemes.length;
            results[state] = newSchemes.length;
            // Update the set to prevent duplicates across states
            newSchemes.forEach((s: any) => existingTitles.add(`${s.title}__${s.state}`.toLowerCase()));
          }
        }
      } catch (stateErr) {
        console.error(`Error processing ${state}:`, stateErr);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_added: totalAdded,
        by_state: results,
        total_schemes: (existingSchemes?.length || 0) + totalAdded,
        synced_at: new Date().toISOString(),
        message: `Synced ${totalAdded} new schemes across ${Object.keys(results).length} states`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
