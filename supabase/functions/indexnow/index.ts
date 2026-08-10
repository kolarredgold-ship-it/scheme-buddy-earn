// Pings IndexNow (Bing, Yandex, Naver, Seznam) with newly published URLs so
// fresh blogs/schemes get crawled without waiting for a manual submission.
// Public endpoint: safe, it only submits URLs from our own database.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_URL = "https://techrola.in";
const HOST = "techrola.in";
const INDEXNOW_KEY = "8a3d27578472d470685d4a2446808452";
const MAX_URLS = 10000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: { urls?: unknown; since_hours?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      // no body -> default behaviour
    }

    let urls: string[] = [];

    if (Array.isArray(body.urls)) {
      urls = body.urls
        .filter((u): u is string => typeof u === "string" && u.startsWith(SITE_URL))
        .slice(0, MAX_URLS);
    } else {
      const hours = Number(body.since_hours) > 0 ? Number(body.since_hours) : 48;
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const [{ data: blogs }, { data: schemes }] = await Promise.all([
        supabase.from("blogs").select("slug").eq("status", "published").gte("published_at", since).limit(5000),
        supabase.from("schemes").select("slug").not("slug", "is", null).gte("updated_at", since).limit(5000),
      ]);

      urls = [
        `${SITE_URL}/`,
        `${SITE_URL}/blog`,
        ...(blogs || []).map((b: { slug: string }) => `${SITE_URL}/blog/${b.slug}`),
        ...(schemes || []).map((s: { slug: string }) => `${SITE_URL}/scheme/${s.slug}`),
      ].slice(0, MAX_URLS);
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ success: true, submitted: 0, note: "no new urls" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`IndexNow failed [${res.status}]: ${text}`);
      return new Response(
        JSON.stringify({ success: false, status: res.status, details: text, submitted: urls.length }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Also nudge Google + Bing to re-read the sitemap.
    await Promise.allSettled([
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`),
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`),
    ]);

    return new Response(JSON.stringify({ success: true, submitted: urls.length, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
