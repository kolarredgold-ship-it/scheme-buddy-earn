import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE_URL, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_scheme",
  title: "Get scheme details",
  description:
    "Fetch the full details of one Techrola scheme or job listing by its slug, including eligibility, documents and the official apply link.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Scheme slug, as returned by search_schemes."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("schemes")
      .select("title, slug, category, state, description, eligibility, documents, apply_link, source_website, beneficiary_type, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No scheme found for slug "${slug}".` }], isError: true };

    const scheme = { ...data, url: `${SITE_URL}/scheme/${data.slug}` };
    return {
      content: [{ type: "text", text: JSON.stringify(scheme, null, 2) }],
      structuredContent: { scheme },
    };
  },
});
