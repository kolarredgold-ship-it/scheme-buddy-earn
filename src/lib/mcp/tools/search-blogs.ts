import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE_URL, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_blogs",
  title: "Search Techrola articles",
  description: "Search published Techrola blog articles about schemes, jobs, careers and AI student tools.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Keyword to match in the article title or excerpt."),
    limit: z.number().int().min(1).max(25).default(10).describe("Maximum number of articles (1-25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("blogs")
      .select("title, slug, excerpt, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);

    if (query) q = q.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = (data ?? []).map((b) => ({
      title: b.title,
      category: b.category,
      excerpt: b.excerpt,
      url: `${SITE_URL}/blog/${b.slug}`,
      slug: b.slug,
    }));

    return {
      content: [{ type: "text", text: items.length ? JSON.stringify(items, null, 2) : "No matching articles found." }],
      structuredContent: { count: items.length, items },
    };
  },
});
