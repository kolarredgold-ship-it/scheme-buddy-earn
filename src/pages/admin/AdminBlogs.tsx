import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminBlogs = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("id, slug, title, category, status, published_at, featured_image_url")
      .order("published_at", { ascending: false });
    setBlogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-daily-blog", { body: {} });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Generation failed");
      toast.success(`Blog generated: ${data.blog?.title ?? "OK"}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this blog?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "published" ? "draft" : "published";
    const { error } = await supabase.from("blogs").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (authLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Blog Management</h1>
            <p className="text-sm text-muted-foreground">Auto-publishes daily at 6:00 AM IST via DeepSeek + AI image.</p>
          </div>
          <Button onClick={generateNow} disabled={generating}>
            {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Now</>}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : blogs.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No blogs yet. Click "Generate Now" to create the first one.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {blogs.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                  <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                    {b.featured_image_url && <img src={b.featured_image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {b.category && <Badge variant="outline">{b.category}</Badge>}
                      <Badge variant={b.status === "published" ? "default" : "secondary"}>{b.status}</Badge>
                      <span>{b.published_at ? new Date(b.published_at).toLocaleString("en-IN") : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/blog/${b.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(b.id, b.status)}>
                      {b.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => del(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminBlogs;
