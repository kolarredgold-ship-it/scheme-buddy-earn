import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { offset = 0, limit = 3 } = await req.json();

    // Fetch schemes without images or with placeholder images
    const { data: schemes, error: fetchError } = await supabase
      .from("schemes")
      .select("id, title, category, state")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;
    if (!schemes || schemes.length === 0) {
      return new Response(JSON.stringify({ done: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const results: any[] = [];

    for (const scheme of schemes) {
      try {
        // Build a visual prompt based on scheme context
        const categoryVisuals: Record<string, string> = {
          scholarships: "students studying in a bright classroom, books and graduation caps, education theme",
          farmers: "lush green agricultural fields, Indian farmer working, crops and sunshine",
          "sc-st": "diverse Indian community, empowerment theme, people thriving together",
          minority: "multicultural Indian community, unity and diversity, people of different backgrounds",
          women: "empowered Indian women, professional and confident, modern workplace or community",
          health: "healthcare setting, Indian hospital, doctors helping patients, medical equipment",
          employment: "Indian professionals at work, job fair, career development, office setting",
          housing: "modern affordable housing in India, family moving into new home, residential area",
          pension: "happy senior Indian citizens, retirement lifestyle, peaceful elderly life",
          insurance: "family protection theme, shield symbolism, secure Indian family",
          business: "Indian entrepreneurs, small business, startup office, innovation",
          disability: "inclusive Indian community, accessibility, people with different abilities thriving",
          education: "Indian school classroom, students learning, teacher at blackboard, bright environment",
          recent: "modern Indian government building, digital India theme, technology and governance",
        };

        const visual = categoryVisuals[scheme.category] || "Indian government welfare scheme, people benefiting, vibrant community scene";

        const prompt = `Create a vivid, photorealistic illustration for a government scheme about: "${scheme.title}". 
Scene: ${visual}. 
Style: Modern, warm colors, professional quality, Indian context. 
IMPORTANT: No text, no words, no letters, no numbers, no watermarks anywhere in the image. Pure visual illustration only.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${scheme.id}:`, aiResponse.status, errText);
          results.push({ id: scheme.id, title: scheme.title, status: "ai_error", code: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(`No image returned for ${scheme.id}`);
          results.push({ id: scheme.id, title: scheme.title, status: "no_image" });
          continue;
        }

        // Extract base64 data
        const base64Match = imageUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
        if (!base64Match) {
          results.push({ id: scheme.id, title: scheme.title, status: "invalid_format" });
          continue;
        }

        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const filePath = `schemes/${scheme.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("scheme-images")
          .upload(filePath, binaryData, {
            contentType: `image/${base64Match[1]}`,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${scheme.id}:`, uploadError);
          results.push({ id: scheme.id, title: scheme.title, status: "upload_error" });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("scheme-images").getPublicUrl(filePath);

        // Update scheme
        const { error: updateError } = await supabase
          .from("schemes")
          .update({ image_url: urlData.publicUrl })
          .eq("id", scheme.id);

        if (updateError) {
          console.error(`Update error for ${scheme.id}:`, updateError);
          results.push({ id: scheme.id, title: scheme.title, status: "db_error" });
          continue;
        }

        updated++;
        results.push({ id: scheme.id, title: scheme.title, status: "success" });
      } catch (err) {
        console.error(`Error processing ${scheme.id}:`, err);
        results.push({ id: scheme.id, title: scheme.title, status: "error", message: String(err) });
      }
    }

    return new Response(JSON.stringify({
      done: false,
      processed: schemes.length,
      updated,
      nextOffset: offset + limit,
      results,
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
