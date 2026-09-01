import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE_URL, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_blog",
  title: "Read a Techrola article",
  description: "Fetch the full markdown body of one published Techrola article by slug.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Article slug, as returned by search_blogs."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("blogs")
      .select("title, slug, excerpt, category, body_markdown, meta_description, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No published article found for slug "${slug}".` }], isError: true };

    const article = { ...data, url: `${SITE_URL}/blog/${data.slug}` };
    return {
      content: [{ type: "text", text: `# ${article.title}\n\n${article.body_markdown}\n\nSource: ${article.url}` }],
      structuredContent: { article },
    };
  },
});
