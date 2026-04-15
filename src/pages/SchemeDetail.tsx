import { useEffect, useState } from "react";
import techrolaIcon from "@/assets/techrola_icon.png";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ExternalLink, ArrowLeft, FileText, CheckCircle, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";

const SchemeDetail = () => {
  const { slug } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPaid = profile?.subscription_status === "active";

  // Profile is already loaded by AuthProvider, no need to re-fetch

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("schemes").select("*").eq("slug", slug!).single();
      setScheme(data);
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!scheme) return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground mb-4">Scheme not found</p>
        <Link to="/"><Button variant="link" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Home</Button></Link>
      </div>
    </Layout>
  );

  const description = scheme.description || "";
  

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-4 pb-24 md:pb-8 max-w-3xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={async () => {
              const url = window.location.href;
              const text = `Check out this scheme: ${scheme.title}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: scheme.title, text, url });
                } catch {}
              } else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
              }
            }}
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>

        <div className="rounded-2xl overflow-hidden mb-5 h-44 md:h-60">
          {scheme.image_url ? (
            <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <img src={techrolaIcon} alt="Techrola" className="h-20 w-20 opacity-20" />
            </div>
          )}
        </div>

        <Badge variant="outline" className="mb-2 text-xs font-medium">{scheme.category}</Badge>
        <h1 className="text-xl md:text-3xl font-extrabold mb-5 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>{scheme.title}</h1>

        {/* Description */}
        <Card className="mb-4 border-border/40 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              Description
            </h2>
            <div className="relative">
              <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${!isPaid ? "line-clamp-4" : ""}`}>
                {description}
              </p>
              {!isPaid && description.length > 200 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
              )}
            </div>
            {!isPaid && (
              <Link to={user ? "/subscription" : "/plans"}>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5 rounded-xl text-xs border-primary/30 text-primary">
                  <Lock className="h-3.5 w-3.5" /> Subscribe to read full details
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Eligibility - Locked for non-subscribers */}
        {scheme.eligibility && (
          <Card className="mb-4 border-border/40 relative">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-secondary/10">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                </div>
                Eligibility
                {!isPaid && <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
              </h2>
              {isPaid ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{scheme.eligibility}</p>
              ) : (
                <div className="text-sm text-muted-foreground/40 select-none blur-sm pointer-events-none" aria-hidden>
                  {scheme.eligibility.slice(0, 120)}...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents - Locked for non-subscribers */}
        {scheme.documents && (
          <Card className="mb-4 border-border/40 relative">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                📄 Required Documents
                {!isPaid && <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
              </h2>
              {isPaid ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{scheme.documents}</p>
              ) : (
                <div className="text-sm text-muted-foreground/40 select-none blur-sm pointer-events-none" aria-hidden>
                  {scheme.documents.slice(0, 120)}...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Apply Button */}
        <div className="mt-6">
          {isPaid ? (
            scheme.apply_link ? (
              <a href={scheme.apply_link} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full md:w-auto gap-2 rounded-xl bg-gradient-secondary font-semibold">
                  Apply Now <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            ) : scheme.source_website ? (
              <a href={scheme.source_website} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full md:w-auto gap-2 rounded-xl bg-gradient-primary font-semibold">
                  Visit Department Page <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Button size="lg" disabled className="w-full md:w-auto gap-2 rounded-xl opacity-60 font-semibold">
                Apply Link Coming Soon
              </Button>
            )
          ) : (
            <Link to={user ? "/subscription" : "/plans"}>
              <Button size="lg" className="w-full md:w-auto gap-2 rounded-xl bg-gradient-primary font-semibold">
                <Lock className="h-4 w-4" /> {user ? "Subscribe to Apply" : "Subscribe to Apply"}
              </Button>
            </Link>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
          <p className="text-[11px] md:text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
            ⚠️ <strong>Disclaimer:</strong> This is AI-generated content. Please verify all details from official government websites before applying.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SchemeDetail;
