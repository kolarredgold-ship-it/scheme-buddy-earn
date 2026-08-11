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

/** Single self-referencing canonical, always pointing at the post's own slug URL. */
const setCanonical = (href: string) => {
  document.querySelectorAll('link[rel="canonical"]').forEach((n, i) => { if (i > 0) n.remove(); });
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", href);
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

    // Canonical: always the post's own slug URL (dedupes query-string / stale-slug variants)
    const canonical = `https://techrola.in/blog/${blog.slug}`;
    setCanonical(canonical);
    setMeta("og:url", canonical, "property");
    setMeta("robots", "index,follow");

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
      {/* Hero header */}
      <header className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-3xl text-left">
          {blog.category && (
            <Badge variant="secondary" className="mb-4 uppercase tracking-wider text-[11px] font-semibold">
              {blog.category}
            </Badge>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
            {blog.title}
          </h1>
          {blog.excerpt && (
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl leading-relaxed text-muted-foreground">
              {blog.excerpt}
            </p>
          )}

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground border-t border-b py-3 sm:py-4">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{blog.author ?? "Techrola Editorial"}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{blog.reading_time ?? 8} min read</span>
            <Button size="sm" variant="ghost" onClick={share} className="ml-auto h-8"><Share2 className="h-4 w-4 mr-1.5" />Share</Button>
          </div>
        </div>
      </header>

      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl text-left">
        {blog.featured_image_url && (
          <figure className="-mt-2 mb-8 sm:mb-12">
            <img src={blog.featured_image_url} alt={blog.title}
                 className="w-full aspect-video object-cover rounded-2xl border shadow-sm" />
          </figure>
        )}

        <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none text-left
                        prose-p:text-left prose-p:leading-[1.9] prose-p:my-6 sm:prose-p:my-7
                        prose-p:text-[16px] sm:prose-p:text-[18px] prose-p:text-foreground/90
                        prose-headings:font-bold prose-headings:text-left prose-headings:tracking-tight prose-headings:text-foreground
                        prose-headings:mt-12 sm:prose-headings:mt-16 prose-headings:mb-5 sm:prose-headings:mb-6
                        prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-[2rem]
                        prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/60
                        prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-10 sm:prose-h3:mt-12
                        prose-h4:text-lg sm:prose-h4:text-xl
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-ul:my-6 sm:prose-ul:my-7 prose-ol:my-6 sm:prose-ol:my-7 prose-ul:pl-6 prose-ol:pl-6 prose-ul:space-y-2 prose-ol:space-y-2
                        prose-li:my-2.5 sm:prose-li:my-3 prose-li:leading-[1.8] prose-li:text-left prose-li:pl-1
                        prose-li:marker:text-primary
                        prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline break-words
                        prose-img:rounded-xl prose-img:mx-0 prose-img:my-10 prose-img:border
                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/40
                        prose-blockquote:pl-5 prose-blockquote:pr-4 prose-blockquote:py-3 prose-blockquote:rounded-r-lg
                        prose-blockquote:not-italic prose-blockquote:my-8
                        prose-hr:my-12 prose-hr:border-border
                        prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.9em] prose-code:font-medium
                        prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl prose-pre:my-8
                        prose-table:border prose-table:w-full prose-table:my-10 prose-table:text-sm sm:prose-table:text-base prose-table:rounded-lg prose-table:overflow-hidden
                        prose-th:bg-muted prose-th:p-3 sm:prose-th:p-4 prose-th:text-left prose-th:font-semibold
                        prose-td:p-3 sm:prose-td:p-4 prose-td:border-t prose-td:align-top prose-td:leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(blog.body_markdown)}</ReactMarkdown>
        </div>

        {blog.faq && blog.faq.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 tracking-tight">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {blog.faq.map((f, i) => (
                <Card key={i} className="border-border/60 hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 sm:p-6">
                    <p className="font-semibold text-base sm:text-lg leading-snug text-foreground">{f.q}</p>
                    <p className="mt-3 text-sm sm:text-base leading-[1.75] text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card className="mt-12 sm:mt-16 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30 overflow-hidden">
          <CardContent className="p-6 sm:p-10 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Join the Techrola Career Program</h3>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">25+ AI tools, internships, job portal, government schemes & referral rewards.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link to="/career-program">Join Career Program <ArrowRight className="h-4 w-4 ml-1.5" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/ai-tools">Try AI Tools</Link></Button>
            </div>
          </CardContent>
        </Card>

        {related.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 tracking-tight">Related Articles</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all border-border/60">
                    <div className="aspect-video bg-muted overflow-hidden">
                      {r.featured_image_url && (
                        <img src={r.featured_image_url} alt={r.title} loading="lazy"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
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
