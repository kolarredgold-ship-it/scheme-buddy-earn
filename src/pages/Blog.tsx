import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  featured_image_url: string | null;
  reading_time: number | null;
  published_at: string | null;
  author: string | null;
}

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Career & Money Blog for Indian Students | Techrola";
    const desc = "Daily fresh SEO blogs on earning online, government schemes, career tips, interviews, resumes and AI tools — trusted, safe, India-focused.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);

    (async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, slug, title, excerpt, category, featured_image_url, reading_time, published_at, author")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(60);
      setBlogs((data as BlogRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const featured = blogs[0];
  const rest = blogs.slice(1);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <header className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Fresh every day</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            The Techrola Blog
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Honest guides for Indian students & job seekers — earn safely, build real skills, land real jobs.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            First blog drops soon. Check back tomorrow at 6:00 AM IST.
          </div>
        ) : (
          <>
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="block group mb-12">
                <Card className="overflow-hidden hover:shadow-xl transition-all border-2">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto bg-muted overflow-hidden">
                      {featured.featured_image_url ? (
                        <img src={featured.featured_image_url} alt={featured.title} loading="lazy"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                    </div>
                    <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                      {featured.category && <Badge className="w-fit mb-3">{featured.category}</Badge>}
                      <h2 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-3 text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{featured.reading_time ?? 8} min read</span>
                        <span>•</span>
                        <span>{featured.published_at ? new Date(featured.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 text-primary font-semibold">
                        Read article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((b) => (
                <Link key={b.id} to={`/blog/${b.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-video bg-muted overflow-hidden">
                      {b.featured_image_url ? (
                        <img src={b.featured_image_url} alt={b.title} loading="lazy"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      {b.category && <Badge variant="outline" className="mb-2">{b.category}</Badge>}
                      <h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {b.title}
                      </h3>
                      {b.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{b.excerpt}</p>}
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {b.reading_time ?? 8} min
                        <span>•</span>
                        {b.published_at ? new Date(b.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
