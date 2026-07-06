import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  Loader2,
  MessageCircle,
  Clock,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";

const ANNUAL_PRICE = 999;
const MONTHLY_EQUIVALENT = (ANNUAL_PRICE / 12).toFixed(2); // 83.25
const ORIGINAL_PRICE = 2999;
const SAVINGS = ORIGINAL_PRICE - ANNUAL_PRICE;
const SAVINGS_PCT = Math.round((SAVINGS / ORIGINAL_PRICE) * 100);

const FEATURES: { icon: any; title: string; desc: string }[] = [
  { icon: Shield, title: "All Government Schemes", desc: "Full details, eligibility & direct apply links" },
  { icon: Zap, title: "19+ AI Career Tools", desc: "Resume, Cover Letter, SOP, Flashcards & more" },
  { icon: Rocket, title: "AI Mock & Live HR Interview", desc: "Real-time evaluation with feedback" },
  { icon: Sparkles, title: "3 AI Generations / Tool", desc: "Refill anytime with ₹499 top-up (+3–5 credits)" },
  { icon: TrendingUp, title: "Earn up to ₹400 / Referral", desc: "3-level referral earning system" },
  { icon: Crown, title: "Priority Notifications", desc: "Be first to know about new schemes" },
];

const Subscription = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<{ id: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, created_at")
        .eq("user_id", user.id)
        .eq("payment_type", "subscription")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setPending(data);
    })();
  }, [user]);

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );

  if (profile?.subscription_status === "active") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
            <Crown className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">You're Premium!</h1>
          <p className="text-muted-foreground mb-6">Enjoy full access to all schemes & AI tools.</p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">Go to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handlePayNow = async () => {
    if (!user) {
      navigate("/signup?redirect=/subscription");
      return;
    }
    if (!profile) {
      toast.error("Loading your profile, please try again in a moment");
      return;
    }
    setModalOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-12 pb-24 md:pb-16 max-w-lg lg:max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-6 md:mb-10 animate-fade-in">
          <Badge className="mb-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md px-3 py-1">
            <Crown className="h-3.5 w-3.5 mr-1.5" /> PREMIUM PLAN
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Unlock Everything
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Full access to schemes, AI tools & career program</p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
        {/* Pricing card — hero */}
        <div className="relative mb-5 lg:mb-0 lg:sticky lg:top-24 animate-scale-in">
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-br from-primary via-secondary to-amber-400 rounded-3xl blur-lg opacity-30" />
          <Card className="relative overflow-hidden border-2 border-primary/40 rounded-3xl shadow-2xl bg-gradient-to-br from-background via-background to-primary/5">
            {/* Top ribbon */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
              SAVE {SAVINGS_PCT}%
            </div>

            <CardContent className="p-6 md:p-8">
              {/* Monthly headline */}
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Starts at just
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-primary">₹</span>
                  <span className="text-6xl md:text-7xl font-extrabold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none">
                    {MONTHLY_EQUIVALENT.split(".")[0]}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    .{MONTHLY_EQUIVALENT.split(".")[1]}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium ml-1">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Billed annually as <span className="font-bold text-foreground">₹{ANNUAL_PRICE}</span>
                  <span className="line-through ml-2 text-muted-foreground/70">₹{ORIGINAL_PRICE.toLocaleString()}</span>
                </p>
              </div>

              {/* Highlights strip */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border/60">
                <div className="text-center">
                  <p className="text-lg font-extrabold text-primary">12</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Months</p>
                </div>
                <div className="text-center border-x border-border/60">
                  <p className="text-lg font-extrabold text-secondary">19+</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AI Tools</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-extrabold text-amber-500">800+</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Schemes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending payment banner */}
        {pending && (
          <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700">Payment under review</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(pending.created_at).toLocaleString()}. Pro activates within 24 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-2.5 mb-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group flex items-start gap-3 p-3 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
                <Check className="h-4 w-4 text-secondary shrink-0 ml-auto mt-2" />
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {user ? (
          <div className="space-y-3">
            <RazorpayCheckoutButton
              amount={ANNUAL_PRICE}
              userId={user.id}
              paymentType="subscription"
              description="Techrola Premium (Annual)"
              prefill={{
                name: profile?.name || "",
                email: profile?.email || user.email || "",
                contact: (profile?.mobile || "").replace(/\D/g, "").slice(-10),
              }}
              className="w-full text-base font-bold py-6 h-auto rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-95 shadow-lg shadow-primary/30"
              onSuccess={async () => {
                await refreshProfile();
                navigate("/dashboard");
              }}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Get Premium — Pay ₹{ANNUAL_PRICE}
            </RazorpayCheckoutButton>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                const msg = `Hi, I need help paying for Techrola Premium (₹${ANNUAL_PRICE}).%0AName: ${profile?.name || "N/A"}%0AEmail: ${profile?.email || user?.email || "N/A"}`;
                window.open(`https://wa.me/919999999999?text=${msg}`, "_blank");
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Need help? Chat on WhatsApp
            </Button>
          </div>
        ) : (
          <Link to="/signup?redirect=/subscription">
            <Button size="lg" className="w-full text-base font-bold py-6 h-auto rounded-2xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30">
              <Rocket className="h-5 w-5 mr-2" />
              Sign Up & Get Premium
            </Button>
          </Link>
        )}

        <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" /> Secure Razorpay
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> Instant Access
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" /> 12 Months
          </div>
        </div>

        {user && profile && (
          <PaymentModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            amount={ANNUAL_PRICE}
            userId={user.id}
            paymentType="subscription"
            defaultPayerName={profile.name || ""}
            defaultPayerEmail={profile.email || user.email || ""}
            defaultPayerMobile={(profile.mobile || "").replace(/\D/g, "").slice(-10)}
            onSuccess={() => {
              setModalOpen(false);
              refreshProfile();
              supabase
                .from("payments")
                .select("id, created_at")
                .eq("user_id", user.id)
                .eq("payment_type", "subscription")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data }) => data && setPending(data));
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Subscription;
