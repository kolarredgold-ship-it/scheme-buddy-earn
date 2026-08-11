// Re-submits the sitemap to Google Search Console.
// Called automatically whenever content is published or unpublished
// (via the indexnow function) and by the daily cron.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_URL = "https://techrola.in";
const DEFAULT_SITEMAP = `${SITE_URL}/sitemap.xml`;
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionApiKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableApiKey || !connectionApiKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Search Console connection is not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const headers = {
    Authorization: `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionApiKey,
  };

  try {
    let body: { sitemap_url?: unknown; site_url?: unknown } = {};
    try {
      body = await req.json();
    } catch { /* no body */ }

    const sitemapUrl =
      typeof body.sitemap_url === "string" && body.sitemap_url.startsWith(SITE_URL)
        ? body.sitemap_url
        : DEFAULT_SITEMAP;

    // 1. List verified properties at runtime.
    const listRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!listRes.ok) {
      const details = await listRes.text();
      console.error(`Could not list properties [${listRes.status}]: ${details}`);
      return new Response(
        JSON.stringify({ success: false, status: listRes.status, details }),
        { status: listRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { siteEntry = [] } = (await listRes.json()) as { siteEntry?: SiteEntry[] };
    const target = new URL(SITE_URL);
    const matches = siteEntry.filter(
      (e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target),
    );

    let siteUrl: string;
    if (typeof body.site_url === "string") {
      const chosen = matches.find((e) => e.siteUrl === body.site_url);
      if (!chosen) {
        return new Response(
          JSON.stringify({ success: false, error: "Selected property is not verified for this site" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      siteUrl = chosen.siteUrl;
    } else if (matches.length === 1) {
      siteUrl = matches[0].siteUrl;
    } else if (matches.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No verified Search Console property covers this site" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          status: "selection_required",
          candidates: matches.map((m) => m.siteUrl),
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Re-submit the sitemap for that property.
    const submitRes = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      { method: "PUT", headers },
    );
    if (!submitRes.ok) {
      const details = await submitRes.text();
      console.error(`Sitemap submit failed [${submitRes.status}]: ${details}`);
      return new Response(
        JSON.stringify({ success: false, status: submitRes.status, details, siteUrl, sitemapUrl }),
        { status: submitRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, siteUrl, sitemapUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
