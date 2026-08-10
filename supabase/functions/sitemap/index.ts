import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://techrola.in";

const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/career-program", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-tools", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-report", priority: "0.7", changefreq: "monthly" },
  { path: "/create-report", priority: "0.7", changefreq: "monthly" },
  { path: "/mock-interview", priority: "0.8", changefreq: "weekly" },
  { path: "/live-hr-interview", priority: "0.7", changefreq: "weekly" },
  { path: "/subscription", priority: "0.7", changefreq: "monthly" },
  { path: "/leaderboard", priority: "0.6", changefreq: "daily" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/install", priority: "0.5", changefreq: "monthly" },
  { path: "/login", priority: "0.4", changefreq: "yearly" },
  { path: "/signup", priority: "0.5", changefreq: "yearly" },
  { path: "/about-us", priority: "0.4", changefreq: "yearly" },
  { path: "/contact-us", priority: "0.4", changefreq: "yearly" },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms-conditions", priority: "0.3", changefreq: "yearly" },
  { path: "/refund-policy", priority: "0.3", changefreq: "yearly" },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: schemes }, { data: blogs }] = await Promise.all([
      supabase.from("schemes").select("slug, updated_at").not("slug", "is", null).order("updated_at", { ascending: false }).limit(50000),
      supabase.from("blogs").select("slug, updated_at, published_at").eq("status", "published").order("published_at", { ascending: false }).limit(50000),
    ]);

    const staticUrls = STATIC_ROUTES.map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ).join("\n");

    const schemeUrls = (schemes || [])
      .map((s: { slug: string; updated_at: string | null }) => {
        const lastmod = s.updated_at ? s.updated_at.split("T")[0] : null;
        return `  <url>
    <loc>${SITE_URL}/scheme/${escapeXml(s.slug)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join("\n");

    const blogUrls = (blogs || [])
      .map((b: { slug: string; updated_at: string | null; published_at: string | null }) => {
        const lastmod = (b.updated_at || b.published_at || "").split("T")[0] || null;
        return `  <url>
    <loc>${SITE_URL}/blog/${escapeXml(b.slug)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${schemeUrls}
${blogUrls}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});
