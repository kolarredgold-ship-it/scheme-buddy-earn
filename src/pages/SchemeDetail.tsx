import { useEffect, useState } from "react";
import techrolaIcon from "@/assets/techrola_icon.png";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ExternalLink, ArrowLeft, FileText, CheckCircle, Sparkles } from "lucide-react";

const SchemeDetail = () => {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPaid = profile?.subscription_status === "active";

  // Profile is already loaded by AuthProvider, no need to re-fetch

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("schemes").select("*").eq("id", id!).single();
      setScheme(data);
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

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
  const halfLength = Math.floor(description.length / 2);

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-4 pb-24 md:pb-8 max-w-3xl animate-fade-in">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>

        <div className="rounded-2xl overflow-hidden mb-5 h-44 md:h-60">
          {scheme.image_url ? (
            <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <img src={techrolaIcon} alt="TechRola" className="h-20 w-20 opacity-20" />
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
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {isPaid ? description : description.slice(0, halfLength)}
              </p>
              {!isPaid && (
                <div className="relative mt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap blur-sm select-none" aria-hidden>
                    {description.slice(halfLength)}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
                    <Link to="/subscription">
                      <Button className="gap-2 rounded-xl bg-gradient-primary shadow-glow font-semibold">
                        <Lock className="h-4 w-4" /> Unlock Full Details
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Eligibility */}
        {scheme.eligibility && (
          <Card className="mb-4 border-border/40">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-secondary/10">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                </div>
                Eligibility
              </h2>
              {isPaid ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{scheme.eligibility}</p>
              ) : (
                <div className="blur-sm select-none text-sm text-muted-foreground">
                  <p>Subscribe to view eligibility criteria for this scheme.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {scheme.documents && isPaid && (
          <Card className="mb-4 border-border/40">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold text-base mb-3">📄 Required Documents</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{scheme.documents}</p>
            </CardContent>
          </Card>
        )}

        {/* Apply Button */}
        <div className="mt-6">
          {isPaid && scheme.apply_link ? (
            <a href={scheme.apply_link} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full md:w-auto gap-2 rounded-xl bg-gradient-secondary font-semibold">
                Apply Now <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          ) : !user ? (
            <Link to="/plans">
              <Button size="lg" className="w-full md:w-auto gap-2 rounded-xl bg-gradient-primary font-semibold">
                Sign Up to Access
              </Button>
            </Link>
          ) : (
            <Link to="/subscription">
              <Button size="lg" variant="outline" className="w-full md:w-auto gap-2 rounded-xl font-semibold">
                <Lock className="h-4 w-4" /> Subscribe to Apply
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SchemeDetail;
