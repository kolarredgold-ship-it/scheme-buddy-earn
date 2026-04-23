// Generates public/sitemap.xml at build time by fetching scheme slugs
// from the public Supabase REST API. Runs before `vite build`.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://techrola.in";
const SUPABASE_URL = "https://bhfjlxizuwwzvhdzpoxs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZmpseGl6dXd3enZoZHpwb3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDU4NjMsImV4cCI6MjA5MTAyMTg2M30.sv5pOxx_978ynac8bc26hJQdUkUuFNXqp76WJl5ELPs";

const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/career-program", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-tools", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-report-generator", priority: "0.7", changefreq: "monthly" },
  { path: "/create-report", priority: "0.7", changefreq: "monthly" },
  { path: "/mock-interview", priority: "0.8", changefreq: "weekly" },
  { path: "/plans", priority: "0.8", changefreq: "monthly" },
  { path: "/subscription", priority: "0.7", changefreq: "monthly" },
  { path: "/leaderboard", priority: "0.6", changefreq: "daily" },
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
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function main() {
  const today = new Date().toISOString().split("T")[0];

  let schemes: { slug: string; updated_at: string | null }[] = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/schemes?select=slug,updated_at&slug=not.is.null&order=updated_at.desc&limit=50000`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (res.ok) schemes = await res.json();
    else console.warn(`[sitemap] schemes fetch failed: ${res.status}`);
  } catch (e) {
    console.warn(`[sitemap] schemes fetch error:`, e);
  }

  const staticUrls = STATIC_ROUTES.map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  ).join("\n");

  const schemeUrls = schemes
    .map((s) => {
      const lastmod = s.updated_at ? s.updated_at.split("T")[0] : today;
      return `  <url>
    <loc>${SITE_URL}/scheme/${escapeXml(s.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${schemeUrls}
</urlset>
`;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, "..", "public", "sitemap.xml");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, xml, "utf8");
  console.log(`[sitemap] wrote ${outPath} with ${schemes.length} scheme URLs`);
}

main().catch((e) => {
  console.error("[sitemap] failed:", e);
  process.exit(0); // don't fail the build
});
