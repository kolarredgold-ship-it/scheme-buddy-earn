import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rss, Search, ArrowRight, Clock, CalendarDays } from "lucide-react";

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

const CAT_COLORS: Record<string, string> = {
  "Earn Money": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Career Tips": "bg-sky-100 text-sky-800 border-sky-200",
  "Government Schemes": "bg-amber-100 text-amber-800 border-amber-200",
  "AI Tools": "bg-violet-100 text-violet-800 border-violet-200",
  "Interview Prep": "bg-rose-100 text-rose-800 border-rose-200",
  "Skill Development": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Student Life": "bg-pink-100 text-pink-800 border-pink-200",
};

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  useEffect(() => {
    document.title = "Career & Money Blog for Indian Students | Techrola";
    const desc = "Fresh short SEO blogs — earn online safely, discover government schemes, ace interviews, use AI tools — updated daily.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);

    (async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, slug, title, excerpt, category, featured_image_url, reading_time, published_at, author")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(500);
      setBlogs((data as BlogRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => b.category && set.add(b.category));
    return ["All", ...Array.from(set).sort()];
  }, [blogs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs.filter((b) => {
      const catOk = category === "All" || b.category === category;
      const qOk = !q || b.title.toLowerCase().includes(q) || (b.excerpt ?? "").toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [blogs, query, category]);

  const featured = filtered[0];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant="secondary">Fresh daily</Badge>
            <a href="/rss.xml" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700">
              <Rss className="h-3.5 w-3.5" /> RSS Feed
            </a>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer"
               className="text-xs font-semibold text-muted-foreground hover:text-primary">
              Sitemap
            </a>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">The Techrola Blog</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Short, honest SEO guides for Indian students & job seekers — earn safely, build skills, land jobs.
          </p>
        </header>

        {/* Featured card */}
        {featured && (
          <Link to={`/blog/${featured.slug}`} className="block group mb-8">
            <Card className="overflow-hidden hover:shadow-xl transition-all border-2">
              <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
                <div className="aspect-video md:aspect-auto bg-muted overflow-hidden">
                  {featured.featured_image_url ? (
                    <img src={featured.featured_image_url} alt={featured.title} loading="lazy"
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center text-5xl">
                      📰
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  {featured.category && (
                    <Badge className={`w-fit mb-3 border ${CAT_COLORS[featured.category] ?? "bg-muted"}`}>
                      {featured.category}
                    </Badge>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{featured.reading_time ?? 4} min read</span>
                    <span>•</span>
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {featured.published_at
                        ? new Date(featured.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : ""}
                    </span>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-primary font-semibold">
                    Read article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs by title or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <Button
                key={c}
                variant={c === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
                className="whitespace-nowrap"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Aligned table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[55%] md:w-[50%]">Article</TableHead>
                  <TableHead className="hidden md:table-cell w-[15%]">Category</TableHead>
                  <TableHead className="hidden sm:table-cell w-[10%] text-center">Read</TableHead>
                  <TableHead className="hidden lg:table-cell w-[15%]">Published</TableHead>
                  <TableHead className="w-[10%] text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      No blogs found. Try a different search or category.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="align-top py-3">
                        <Link to={`/blog/${b.slug}`} className="flex gap-3 items-start">
                          <div className="hidden sm:block h-14 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                            {b.featured_image_url ? (
                              <img src={b.featured_image_url} alt={b.title} loading="lazy"
                                   className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-lg">📰</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                              {b.title}
                            </p>
                            {b.excerpt && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 hidden md:block">
                                {b.excerpt}
                              </p>
                            )}
                            {/* Mobile-only meta row */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 md:hidden text-[11px] text-muted-foreground">
                              {b.category && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4">{b.category}</Badge>
                              )}
                              <span>{b.reading_time ?? 4} min</span>
                              {b.published_at && (
                                <span>• {new Date(b.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-middle">
                        {b.category ? (
                          <Badge variant="outline" className={`border ${CAT_COLORS[b.category] ?? ""}`}>
                            {b.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-middle text-center text-sm text-muted-foreground tabular-nums">
                        {b.reading_time ?? 4} min
                      </TableCell>
                      <TableCell className="hidden lg:table-cell align-middle text-sm text-muted-foreground tabular-nums">
                        {b.published_at
                          ? new Date(b.published_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                          : "—"}
                      </TableCell>
                      <TableCell className="align-middle text-right">
                        <Link to={`/blog/${b.slug}`} aria-label={`Open ${b.title}`}
                              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
                          Read <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {blogs.length} published articles • Auto-published daily at 6:00 AM IST
        </p>
      </div>
    </Layout>
  );
};

export default Blog;
