import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, User, Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Blog {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  category: string | null;
  focus_keyword: string | null;
  secondary_keywords: string[] | null;
  featured_image_url: string | null;
  hook: string | null;
  excerpt: string | null;
  body_markdown: string;
  faq: Array<{ q: string; a: string }> | null;
  social_captions: Record<string, string> | null;
  related_articles: string[] | null;
  author: string | null;
  reading_time: number | null;
  published_at: string | null;
}

const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

// Normalize AI-generated markdown that arrives collapsed onto a single line.
// The generator often writes headings ("## Title:") and bullets (" - **Item**")
// inline without newlines. We reinsert paragraph breaks around them.
const normalizeMarkdown = (raw: string): string => {
  if (!raw) return "";
  let s = raw.replace(/\r\n/g, "\n").trim();

  // Only skip if headings already sit at line starts
  const headingsAtLineStart = /(^|\n)#{2,6}\s/.test(s);
  const inlineHeadings = /[^\n]\s#{2,6}\s/.test(s);
  if (headingsAtLineStart && !inlineHeadings) return s;

  // Insert blank line before every heading marker that isn't at the start
  s = s.replace(/([^\n])\s+(#{2,6})\s+/g, "$1\n\n$2 ");
  // Break at " - **Term**:" style bullets (converts inline list into real list)
  s = s.replace(/([.!?)])\s+-\s+\*\*/g, "$1\n\n- **");
  s = s.replace(/\s+-\s+\*\*/g, "\n- **");
  // Break inline pipe tables — put each row on its own line
  s = s.replace(/\s+(\|[^\n|]+\|[^\n]*\|)/g, "\n$1");
  // Ensure heading line ends before the next sentence (heuristic: heading ends
  // at the first period, exclamation, or question mark following the marker).
  s = s.replace(/^(#{2,6}\s[^\n.!?]*[.!?:])\s+/gm, "$1\n\n");
  // Collapse triple+ newlines
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<Array<{ slug: string; title: string; featured_image_url: string | null }>>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setBlog(data as unknown as Blog);
      setLoading(false);

      // Fetch related (same category, latest 3)
      const d = data as unknown as Blog;
      const { data: rel } = await supabase
        .from("blogs")
        .select("slug, title, featured_image_url")
        .eq("status", "published")
        .eq("category", d.category ?? "")
        .neq("id", d.id)
        .order("published_at", { ascending: false })
        .limit(3);
      setRelated(rel ?? []);
    })();
  }, [slug]);

  useEffect(() => {
    if (!blog) return;
    document.title = (blog.meta_title || blog.title).slice(0, 65);
    setMeta("description", (blog.meta_description || blog.excerpt || "").slice(0, 160));
    setMeta("og:title", blog.title, "property");
    setMeta("og:description", (blog.meta_description || blog.excerpt || "").slice(0, 160), "property");
    setMeta("og:type", "article", "property");
    if (blog.featured_image_url) setMeta("og:image", blog.featured_image_url, "property");
    setMeta("twitter:card", "summary_large_image");

    // FAQ schema JSON-LD
    document.querySelectorAll('script[data-blog-jsonld]').forEach((n) => n.remove());
    const scripts: any[] = [];
    scripts.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: blog.title,
      description: blog.meta_description ?? blog.excerpt,
      image: blog.featured_image_url ? [blog.featured_image_url] : [],
      datePublished: blog.published_at,
      author: { "@type": "Organization", name: blog.author ?? "Techrola Editorial" },
      publisher: { "@type": "Organization", name: "Techrola", url: "https://techrola.in" },
      mainEntityOfPage: `https://techrola.in/blog/${blog.slug}`,
    });
    if (blog.faq?.length) {
      scripts.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: blog.faq.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    scripts.forEach((json) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-blog-jsonld", "1");
      s.textContent = JSON.stringify(json);
      document.head.appendChild(s);
    });
  }, [blog]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: blog?.title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  if (notFound) return <Navigate to="/blog" replace />;
  if (loading || !blog) {
    return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl text-left">
        {blog.category && <Badge className="mb-3">{blog.category}</Badge>}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-left">{blog.title}</h1>
        {blog.excerpt && <p className="mt-4 text-lg text-muted-foreground text-left">{blog.excerpt}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{blog.author ?? "Techrola Editorial"}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{blog.published_at ? new Date(blog.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{blog.reading_time ?? 8} min read</span>
          <Button size="sm" variant="ghost" onClick={share} className="ml-auto"><Share2 className="h-4 w-4 mr-1.5" />Share</Button>
        </div>

        {blog.featured_image_url && (
          <img src={blog.featured_image_url} alt={blog.title}
               className="w-full aspect-video object-cover rounded-xl mt-6 border" />
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none mt-8 text-left
                        prose-p:text-left prose-p:leading-relaxed prose-p:my-4
                        prose-headings:font-bold prose-headings:text-left prose-headings:mt-8 prose-headings:mb-3
                        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                        prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-left
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-lg prose-img:mx-0
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                        prose-table:border prose-table:w-full prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-td:p-2 prose-td:border prose-td:align-top">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(blog.body_markdown)}</ReactMarkdown>
        </div>

        {blog.faq && blog.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {blog.faq.map((f, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <p className="font-semibold">{f.q}</p>
                    <p className="mt-2 text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card className="mt-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold">Join the Techrola Career Program</h3>
            <p className="mt-2 text-muted-foreground">25+ AI tools, internships, job portal, government schemes & referral rewards.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link to="/career-program">Join Career Program <ArrowRight className="h-4 w-4 ml-1.5" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/ai-tools">Try AI Tools</Link></Button>
            </div>
          </CardContent>
        </Card>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-video bg-muted overflow-hidden">
                      {r.featured_image_url && (
                        <img src={r.featured_image_url} alt={r.title} loading="lazy"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
};

export default BlogDetail;
