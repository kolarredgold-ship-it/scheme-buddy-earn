import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { offset = 0, limit = 30, mode = "og" } = await req.json().catch(() => ({}));

    // Fetch schemes without images (or all if mode is "refresh")
    let query = supabase
      .from("schemes")
      .select("id, title, category, apply_link, source_website")
      .not("apply_link", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (mode !== "refresh") {
      query = query.is("image_url", null);
    }

    const { data: schemes, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!schemes || schemes.length === 0) {
      return new Response(JSON.stringify({ done: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    let failed = 0;

    for (const scheme of schemes) {
      const url = scheme.apply_link || scheme.source_website;
      if (!url) continue;

      try {
        // Try to fetch OG image from the apply link page
        let imageUrl = await fetchOgImage(url);

        // Fallback: Google high-res favicon
        if (!imageUrl) {
          try {
            const domain = new URL(url).hostname;
            imageUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          } catch {
            // Invalid URL, use category fallback
            imageUrl = getCategoryImage(scheme.id, scheme.category);
          }
        }

        if (imageUrl) {
          const { error: updateError } = await supabase
            .from("schemes")
            .update({ image_url: imageUrl })
            .eq("id", scheme.id);

          if (!updateError) {
            updated++;
          } else {
            failed++;
            console.error(`❌ Update failed for ${scheme.title}:`, updateError);
          }
        }
      } catch (e) {
        failed++;
        console.error(`❌ Error for ${scheme.title}:`, e.message);
        // Use category fallback on error
        const fallback = getCategoryImage(scheme.id, scheme.category);
        await supabase.from("schemes").update({ image_url: fallback }).eq("id", scheme.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      done: schemes.length < limit,
      processed: schemes.length,
      updated,
      failed,
      nextOffset: offset + limit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TechrolaBot/1.0)",
        "Accept": "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    // Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (ogMatch?.[1]) {
      return makeAbsoluteUrl(ogMatch[1], url);
    }

    // Try twitter:image
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    if (twitterMatch?.[1]) {
      return makeAbsoluteUrl(twitterMatch[1], url);
    }

    return null;
  } catch {
    return null;
  }
}

function makeAbsoluteUrl(imgUrl: string, baseUrl: string): string {
  if (imgUrl.startsWith("http")) return imgUrl;
  try {
    const base = new URL(baseUrl);
    return new URL(imgUrl, base.origin).toString();
  } catch {
    return imgUrl;
  }
}

// Fallback category images (Unsplash)
const categoryImages: Record<string, string[]> = {
  scholarships: [
    "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop&fm=webp",
  ],
  farmers: [
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=400&fit=crop&fm=webp",
  ],
  sc_st: [
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop&fm=webp",
  ],
  health: [
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&h=400&fit=crop&fm=webp",
  ],
  education: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop&fm=webp",
  ],
  business: [
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&fm=webp",
  ],
  housing: [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop&fm=webp",
  ],
  minority: [
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=400&fit=crop&fm=webp",
  ],
  govt_jobs: [
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=400&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop&fm=webp",
  ],
};

const defaultImages = [
  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=400&fit=crop&fm=webp",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&fm=webp",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&fm=webp",
];

function getCategoryImage(id: string, category: string): string {
  const images = categoryImages[category] || defaultImages;
  const hash = id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  return images[hash % images.length];
}
