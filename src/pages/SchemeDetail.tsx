import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ExternalLink, ArrowLeft, FileText, CheckCircle } from "lucide-react";

const SchemeDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPaid = profile?.subscription_status === "active";

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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  if (!scheme) return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-xl text-muted-foreground">Scheme not found</p>
        <Link to="/"><Button variant="link">← Back to Home</Button></Link>
      </div>
    </Layout>
  );

  const description = scheme.description || "";
  const halfLength = Math.floor(description.length / 2);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Schemes
        </Link>

        {scheme.image_url && (
          <div className="rounded-xl overflow-hidden mb-6 h-48 md:h-64">
            <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover" />
          </div>
        )}

        <Badge variant="outline" className="mb-3">{scheme.category}</Badge>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{scheme.title}</h1>

        {/* Description */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Description
            </h2>
            <div className="relative">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {isPaid ? description : description.slice(0, halfLength)}
              </p>
              {!isPaid && (
                <div className="relative">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap blur-sm select-none" aria-hidden>
                    {description.slice(halfLength)}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link to="/subscription">
                      <Button className="gap-2 shadow-lg">
                        <Lock className="h-4 w-4" /> Unlock Full Details for ₹1000
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
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-secondary" /> Eligibility
              </h2>
              {isPaid ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{scheme.eligibility}</p>
              ) : (
                <div className="blur-sm select-none text-muted-foreground">
                  <p>This content is locked. Subscribe to view eligibility criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {scheme.documents && isPaid && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-3">📄 Required Documents</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{scheme.documents}</p>
            </CardContent>
          </Card>
        )}

        {/* Apply Button */}
        <div className="mt-6">
          {isPaid && scheme.apply_link ? (
            <a href={scheme.apply_link} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full md:w-auto gap-2">
                Apply Now <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          ) : !user ? (
            <Link to="/signup">
              <Button size="lg" className="w-full md:w-auto gap-2">
                Sign Up to Access
              </Button>
            </Link>
          ) : (
            <Link to="/subscription">
              <Button size="lg" variant="outline" className="w-full md:w-auto gap-2">
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
