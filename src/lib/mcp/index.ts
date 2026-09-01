import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchSchemes from "./tools/search-schemes";
import getScheme from "./tools/get-scheme";
import searchBlogs from "./tools/search-blogs";
import getBlog from "./tools/get-blog";
import getMyAccount from "./tools/get-my-account";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "scheme-wealth",
  title: "Scheme Wealth",
  version: "0.1.0",
  instructions:
    "Tools for Techrola (techrola.in): search Indian government schemes, scholarships and job notifications, read Techrola career articles, and check the signed-in user's subscription, referral code and AI tool credits. Use search_schemes then get_scheme for full eligibility and apply links.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchSchemes, getScheme, searchBlogs, getBlog, getMyAccount],
});
