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
  tags?: string[];
  beneficiary_type?: string;
  source_website?: string;
}

const ALL_STATES = [
  "karnataka", "andhra_pradesh", "tamil_nadu", "kerala", "telangana",
  "maharashtra", "gujarat", "rajasthan", "uttar_pradesh", "madhya_pradesh",
  "bihar", "west_bengal", "odisha", "punjab", "haryana", "himachal_pradesh",
  "uttarakhand", "chhattisgarh", "jharkhand", "assam", "manipur", "meghalaya",
  "mizoram", "nagaland", "sikkim", "tripura", "arunachal_pradesh", "goa",
  "delhi", "jammu_kashmir", "ladakh", "chandigarh", "puducherry",
  "andaman_nicobar", "dadra_nagar_haveli", "lakshadweep", "central"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let targetState = "all";
    let mode = "check";
    
    try {
      const body = await req.json();
      targetState = body.state || "all";
      mode = body.mode || "check";
    } catch {
      // defaults
    }

    // Fetch existing schemes
    const { data: existingSchemes, error: fetchError } = await supabase
      .from("schemes")
      .select("title, state, category");

    if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);

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

    // Try DeepSeek first, fall back to Lovable AI
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    const aiConfig = deepseekKey 
      ? { url: "https://api.deepseek.com/chat/completions", key: deepseekKey, model: "deepseek-chat" }
      : lovableKey
        ? { url: "https://ai-gateway.lovable.dev/chat/completions", key: lovableKey, model: "google/gemini-2.5-flash" }
        : null;

    if (!aiConfig) {
      return new Response(
        JSON.stringify({ success: false, error: "No AI API key configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Determine states to sync
    const statesToSync = targetState === "all"
      ? ALL_STATES.filter(s => (stateCounts[s] || 0) < 30)
      : [targetState];

    let totalAdded = 0;
    const results: Record<string, number> = {};
    const newNotifications: any[] = [];

    for (const state of statesToSync.slice(0, 5)) {
      const stateLabel = state.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const currentCount = stateCounts[state] || 0;
      if (currentCount >= 30) continue;

      const schemesToGenerate = Math.min(10, 30 - currentCount);
      const existingForState = (existingSchemes || [])
        .filter((s: any) => s.state === state)
        .map((s: any) => s.title);

      const prompt = `Generate ${schemesToGenerate} real, currently active government schemes for ${stateLabel}, India that are NOT in this list: ${existingForState.join(", ")}.

Return a JSON array. Each object must have:
- title: Official scheme name
- category: One of: scholarships, farmers, sc_st, minority, housing, health, education, business, govt_jobs
- description: 2-3 sentence description
- eligibility: Who can apply
- documents: Required documents (comma-separated)
- apply_link: Official government portal URL (*.gov.in or *.nic.in preferred)
- tags: Array of tags like ["loan", "subsidy", "scholarship", "free", "dbt", "insurance"]
- beneficiary_type: One of: students, farmers, women, sc_st, obc, minority, senior_citizens, general, youth, disabled
- source_website: The official portal URL where this scheme information is listed

Focus on REAL schemes from official state departments. Return ONLY a valid JSON array.`;

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
              { role: "system", content: "You are a government scheme research assistant. Only output valid JSON arrays. No markdown, no explanations." },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI failed for ${state}: ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        let schemes: SchemeData[] = [];
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) schemes = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.error(`Parse failed for ${state}:`, parseErr);
          continue;
        }

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
            tags: s.tags || [],
            beneficiary_type: s.beneficiary_type || null,
            source_website: s.source_website || null,
            is_active: true,
          }));

        if (newSchemes.length > 0) {
          const { data: insertedSchemes, error: insertError } = await supabase
            .from("schemes")
            .insert(newSchemes)
            .select("id, title, state, category");

          if (insertError) {
            console.error(`Insert failed for ${state}:`, insertError.message);
          } else {
            totalAdded += newSchemes.length;
            results[state] = newSchemes.length;
            newSchemes.forEach((s: any) => existingTitles.add(`${s.title}__${s.state}`.toLowerCase()));

            // Create notifications for new schemes
            if (insertedSchemes) {
              for (const scheme of insertedSchemes) {
                newNotifications.push({
                  scheme_id: scheme.id,
                  state: scheme.state,
                  category: scheme.category,
                  title: `New Scheme in ${stateLabel}`,
                  message: `${scheme.title} has been added to ${scheme.category} schemes.`,
                });
              }
            }
          }
        }
      } catch (stateErr) {
        console.error(`Error processing ${state}:`, stateErr);
        continue;
      }
    }

    // Insert notifications
    if (newNotifications.length > 0) {
      await supabase.from("scheme_notifications").insert(newNotifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_added: totalAdded,
        by_state: results,
        total_schemes: (existingSchemes?.length || 0) + totalAdded,
        notifications_created: newNotifications.length,
        synced_at: new Date().toISOString(),
        ai_engine: deepseekKey ? "deepseek" : "lovable-ai",
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
