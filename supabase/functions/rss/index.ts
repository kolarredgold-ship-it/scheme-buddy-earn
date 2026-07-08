// Public RSS 2.0 feed for Techrola blogs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://techrola.in";

const escapeXml = (s: string) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const cdata = (s: string) => `<![CDATA[${(s ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, title, excerpt, category, author, featured_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200);

    const items = (blogs || []).map((b: any) => {
      const link = `${SITE_URL}/blog/${b.slug}`;
      const pub = b.published_at ? new Date(b.published_at).toUTCString() : new Date().toUTCString();
      const img = b.featured_image_url
        ? `<enclosure url="${escapeXml(b.featured_image_url)}" type="image/png" />`
        : "";
      return `    <item>
      <title>${cdata(b.title || "")}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <category>${cdata(b.category || "Career Tips")}</category>
      <author>noreply@techrola.in (${escapeXml(b.author || "Techrola Editorial")})</author>
      <description>${cdata(b.excerpt || "")}</description>
      ${img}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Techrola Blog — Career, Schemes &amp; AI Tools for Indian Students</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Daily fresh, honest SEO blogs on earning online, government schemes, career tips, resumes, interviews and AI tools — for Indian students and job seekers.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});
