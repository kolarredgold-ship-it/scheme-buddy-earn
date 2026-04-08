import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BENEFITS = [
  "Full access to all government scheme details",
  "Direct apply links for all schemes",
  "Eligibility criteria & required documents",
  "Priority notifications for new schemes",
  "Refer & earn up to ₹400 per referral",
  "3-level referral earning system",
  "Get AI Internship Report Generator",
  "Get AI Interview Training App Access",
  "Get AI HR Mock Interview Training Access",
  "Get AI Based Interview Q&A - Flash Cards",
];

const Subscription = () => {
  const { user, profile, loading } = useAuth();
  const [paying, setPaying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  if (profile?.subscription_status === "active") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're a Premium Member!</h1>
          <p className="text-muted-foreground mb-6">You have full access to all schemes and features.</p>
          <Link to="/">
            <Button>Browse Schemes</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasReferral = !!profile?.referred_by;
  const price = hasReferral ? 999 : 2999;

  const handlePayment = async () => {
    if (!user || !profile) {
      toast.error("Please log in first");
      return;
    }

    setPaying(true);
    try {
      const orderId = `SUB_${user.id}_${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke("airpay-payment", {
        body: {
          userId: user.id,
          orderId,
          amount: price,
          buyerEmail: profile.email || user.email,
          buyerPhone: profile.mobile || "9999999999",
          buyerFirstname: profile.name || "User",
          buyerLastname: "",
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Payment initiation failed");
      }

      // Create a hidden form and submit to Airpay
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;
      form.style.display = "none";

      Object.entries(data.formData as Record<string, string>).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Failed to initiate payment. Please try again.");
      setPaying(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-md">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-accent text-accent-foreground">
            <Star className="h-3 w-3 mr-1" /> Premium Plan
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Unlock Full Access</h1>
          <p className="text-muted-foreground">Get complete access to all government schemes</p>
        </div>

        {/* Limited Time Offer Banner */}
        <Card className="mb-4 border-secondary/50 bg-secondary/5">
          <CardContent className="p-4 text-center">
            <Badge className="mb-2 bg-destructive text-destructive-foreground">
              <Zap className="h-3 w-3 mr-1" /> Limited Time Offer
            </Badge>
            <p className="text-sm font-semibold">Get Premium at just <span className="text-secondary">₹999</span>!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Don't have a referral code? Use code <span className="font-bold text-primary">WELCOME</span> & get ₹2,000 discount!
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6 border-primary/30 shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground line-through mb-1">₹2,999</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-extrabold text-secondary">₹999</span>
              <span className="text-muted-foreground">/lifetime</span>
            </div>
            {hasReferral ? (
              <Badge variant="outline" className="border-secondary text-secondary">
                <Zap className="h-3 w-3 mr-1" /> Referral Discount Applied! Save ₹2,000
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Use code <span className="font-bold text-primary">WELCOME</span> to unlock this price</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> What you get
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {user ? (
          <Button 
            size="lg" 
            className="w-full text-lg py-6" 
            onClick={handlePayment}
            disabled={paying}
          >
            {paying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay ₹${price.toLocaleString()} Now`
            )}
          </Button>
        ) : (
          <Link to="/plans">
            <Button size="lg" className="w-full text-lg py-6">
              Sign Up to Subscribe
            </Button>
          </Link>
        )}

        {!hasReferral && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Have a referral code? <Link to="/signup" className="text-primary hover:underline">Sign up with one</Link> to get ₹2,000 off! Try code <span className="font-bold">WELCOME</span>
          </p>
        )}

        {/* Payment Security Note */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Secured payments powered by Airpay
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Subscription;
