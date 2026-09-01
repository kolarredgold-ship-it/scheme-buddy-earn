import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE_URL, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_schemes",
  title: "Search government schemes and jobs",
  description:
    "Search Techrola's catalogue of Indian government schemes, scholarships and job notifications by keyword, category and state.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Keyword to match in the title or description."),
    category: z.string().trim().min(1).optional().describe("Category filter, e.g. Education, Employment, Agriculture."),
    state: z.string().trim().min(1).optional().describe("State name, or 'All India' for central schemes."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, state, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("schemes")
      .select("title, slug, category, state, description, apply_link")
      .eq("is_active", true)
      .limit(limit ?? 10);

    if (category) q = q.ilike("category", category);
    if (state) q = q.ilike("state", state);
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = (data ?? []).map((s) => ({
      title: s.title,
      category: s.category,
      state: s.state,
      summary: (s.description ?? "").slice(0, 300),
      url: `${SITE_URL}/scheme/${s.slug}`,
      apply_link: s.apply_link,
    }));

    return {
      content: [{ type: "text", text: items.length ? JSON.stringify(items, null, 2) : "No matching schemes found." }],
      structuredContent: { count: items.length, items },
    };
  },
});
