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
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/career-program", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-tools", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-report", priority: "0.7", changefreq: "monthly" },
  { path: "/create-report", priority: "0.7", changefreq: "monthly" },
  { path: "/dashboard", priority: "0.6", changefreq: "weekly" },
  { path: "/mock-interview", priority: "0.8", changefreq: "weekly" },
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

const AI_TOOL_LANDING_SLUGS = [
  "internship-report-generator","mock-interview","live-hr-interview","resume-builder",
  "cover-letter-generator","sop-generator","study-notes-maker","career-roadmap",
  "leave-letter","letter-of-recommendation","project-report","professional-email-writer",
  "viva-questions","ppt-outline","scholarship-essay","linkedin-bio","business-plan",
  "assignment-helper","essay-writer","speech-writer",
];
const STUDENT_TOOL_SLUGS = [
  "resume","cover-letter","sop","study-notes","roadmap","leave-letter","lor",
  "project-report","email-writer","viva-questions","ppt-outline","scholarship-essay",
  "linkedin-bio","business-plan","assignment","essay","speech",
];
for (const slug of STUDENT_TOOL_SLUGS) {
  STATIC_ROUTES.push({ path: `/student-tool/${slug}`, priority: "0.8", changefreq: "monthly" });
}
STATIC_ROUTES.push({ path: "/live-hr-interview", priority: "0.8", changefreq: "monthly" });

for (const slug of AI_TOOL_LANDING_SLUGS) {
  STATIC_ROUTES.push({ path: `/ai/${slug}`, priority: "0.8", changefreq: "monthly" });
}

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
    const pageSize = 1000;
    for (let from = 0; from < 50000; from += pageSize) {
      const to = from + pageSize - 1;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/schemes?select=slug,updated_at&slug=not.is.null&order=updated_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Range: `${from}-${to}`,
            "Range-Unit": "items",
          },
        },
      );
      if (!res.ok) {
        console.warn(`[sitemap] schemes fetch failed at ${from}: ${res.status}`);
        break;
      }
      const batch = (await res.json()) as { slug: string; updated_at: string | null }[];
      schemes = schemes.concat(batch);
      if (batch.length < pageSize) break;
    }
  } catch (e) {
    console.warn(`[sitemap] schemes fetch error:`, e);
  }

  let blogs: { slug: string; updated_at: string | null }[] = [];
  try {
    const pageSize = 1000;
    for (let from = 0; from < 50000; from += pageSize) {
      const to = from + pageSize - 1;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/blogs?select=slug,updated_at&status=eq.published&slug=not.is.null&order=published_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Range: `${from}-${to}`,
            "Range-Unit": "items",
          },
        },
      );
      if (!res.ok) {
        console.warn(`[sitemap] blogs fetch failed at ${from}: ${res.status}`);
        break;
      }
      const batch = (await res.json()) as { slug: string; updated_at: string | null }[];
      blogs = blogs.concat(batch);
      if (batch.length < pageSize) break;
    }
  } catch (e) {
    console.warn(`[sitemap] blogs fetch error:`, e);
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
