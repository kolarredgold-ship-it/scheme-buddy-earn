import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Rss, Newspaper } from "lucide-react";

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  featured_image_url: string | null;
  reading_time: number | null;
  published_at: string | null;
}

const HomeBlogSection = () => {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, slug, title, excerpt, category, featured_image_url, reading_time, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);
      setBlogs((data as BlogRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (!loading && blogs.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-3 py-1 mb-2">
            <Newspaper className="h-3.5 w-3.5" /> Fresh Daily
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            From the Techrola Blog
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Short, honest SEO guides — earn safely, discover schemes, ace interviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/rss.xml" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Rss className="h-4 w-4 text-orange-500" /> RSS
            </Button>
          </a>
          <Link to="/blog">
            <Button size="sm" className="gap-1.5">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.map((b) => (
            <Link key={b.id} to={`/blog/${b.slug}`} className="group">
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all border">
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  {b.featured_image_url ? (
                    <img src={b.featured_image_url} alt={b.title} loading="lazy"
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 flex items-center justify-center text-4xl">
                      📰
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {b.category && <Badge variant="outline" className="mb-2 text-[10px]">{b.category}</Badge>}
                  <h3 className="font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {b.title}
                  </h3>
                  {b.excerpt && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{b.excerpt}</p>}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {b.reading_time ?? 4} min
                    {b.published_at && (
                      <>
                        <span>•</span>
                        {new Date(b.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeBlogSection;
