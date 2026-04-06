import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight, Flame, GraduationCap, Tractor, Tags, Moon } from "lucide-react";
import Layout from "@/components/Layout";

const CATEGORIES = [
  { key: "recent", label: "🔥 Recent Schemes", icon: Flame },
  { key: "scholarships", label: "🎓 Scholarships", icon: GraduationCap },
  { key: "farmers", label: "🌾 Farmers", icon: Tractor },
  { key: "sc_st", label: "🏷️ SC/ST", icon: Tags },
  { key: "minority", label: "🌙 Minority", icon: Moon },
];

interface Scheme {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

const SchemeCard = ({ scheme, isPaid }: { scheme: Scheme; isPaid: boolean }) => (
  <Link to={`/scheme/${scheme.id}`}>
    <Card className="group min-w-[280px] max-w-[320px] overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <div className="h-40 bg-muted relative overflow-hidden">
        {scheme.image_url ? (
          <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-4xl">📋</span>
          </div>
        )}
        {!isPaid && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs gap-1">
              <Lock className="h-3 w-3" /> Premium
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2 text-xs">{scheme.category}</Badge>
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{scheme.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{scheme.description.slice(0, 80)}...</p>
        <div className="mt-3 flex items-center text-xs text-primary font-medium">
          View Details <ArrowRight className="h-3 w-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

const Index = () => {
  const { profile } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const isPaid = profile?.subscription_status === "active";

  useEffect(() => {
    const fetchSchemes = async () => {
      const { data } = await supabase.from("schemes").select("*").order("created_at", { ascending: false });
      if (data) setSchemes(data);
      setLoading(false);
    };
    fetchSchemes();
  }, []);

  const getSchemesByCategory = (cat: string) => {
    if (cat === "recent") return schemes.slice(0, 10);
    return schemes.filter((s) => s.category.toLowerCase() === cat);
  };

  return (
    <Layout>
      <div className="pb-20 md:pb-8">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Discover Government
                <span className="text-primary"> Schemes</span> for You
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Access scholarships, subsidies, and welfare programs. Refer friends and earn rewards.
              </p>
              <div className="flex gap-3">
                <Link to="/signup">
                  <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link to="/subscription">
                  <button className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors">
                    View Plans
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Scheme Categories */}
        <div className="container mx-auto px-4 py-8 space-y-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-muted-foreground">No schemes available yet. Check back soon!</p>
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const catSchemes = getSchemesByCategory(cat.key);
              if (catSchemes.length === 0) return null;
              return (
                <section key={cat.key}>
                  <h2 className="text-xl font-bold mb-4">{cat.label}</h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {catSchemes.map((scheme) => (
                      <SchemeCard key={scheme.id} scheme={scheme} isPaid={isPaid} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
