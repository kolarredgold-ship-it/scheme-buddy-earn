import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Star, Zap, Shield, Loader2, Tag, MessageCircle } from "lucide-react";
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
  const { user, profile, loading, refreshProfile } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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

  const hasDiscount = !!profile?.referred_by || couponApplied;
  const price = hasDiscount ? 999 : 2999;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }

    setApplyingCoupon(true);

    if (code === "WELCOME") {
      if (user && profile && !profile.referred_by) {
        await supabase.from("profiles").update({ referred_by: "WELCOME" }).eq("user_id", user.id);
        await refreshProfile();
      }
      setCouponApplied(true);
      toast.success("🎉 Coupon applied! You save ₹2,000");
    } else {
      const { data } = await supabase.from("profiles").select("referral_code").eq("referral_code", code).maybeSingle();
      if (data) {
        if (user && profile && !profile.referred_by) {
          await supabase.from("profiles").update({ referred_by: code }).eq("user_id", user.id);
          await refreshProfile();
        }
        setCouponApplied(true);
        toast.success("🎉 Referral code applied! You save ₹2,000");
      } else {
        toast.error("Invalid coupon or referral code");
      }
    }
    setApplyingCoupon(false);
  };

  const [paying, setPaying] = useState(false);

  const handlePayNow = async () => {
    if (!user || !profile) {
      toast.error("Please login to continue");
      return;
    }
    const phone = (profile.mobile || "").replace(/\D/g, "");
    if (!phone || phone.length < 10) {
      toast.error("Please add your mobile number in your profile first");
      return;
    }
    const [firstName, ...rest] = (profile.name || "Customer").trim().split(" ");
    const lastName = rest.join(" ") || "User";
    const email = profile.email || user.email || "";
    const orderId = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("airpay-payment", {
        body: {
          userId: user.id,
          orderId,
          amount: price,
          buyerEmail: email,
          buyerPhone: phone.slice(-10),
          buyerFirstname: firstName,
          buyerLastname: lastName,
        },
      });

      if (error || !data?.success) {
        throw new Error((data as any)?.error || error?.message || "Payment init failed");
      }

      // Build and auto-submit form to Airpay checkout
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;
      form.style.display = "none";
      Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e: any) {
      toast.error(e.message || "Could not start payment");
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

        {/* Pricing Card */}
        <Card className="mb-4 border-primary/30 shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground line-through mb-1">₹2,999</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-extrabold text-secondary">₹{price.toLocaleString()}</span>
              <span className="text-muted-foreground">/lifetime</span>
            </div>
            {hasDiscount ? (
              <Badge variant="outline" className="border-secondary text-secondary">
                <Zap className="h-3 w-3 mr-1" /> Discount Applied! You save ₹2,000
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Apply a coupon code below to get ₹2,000 off</p>
            )}
          </CardContent>
        </Card>

        {/* Coupon Code Box */}
        {!hasDiscount && (
          <Card className="mb-4 border-dashed border-2 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Have a coupon or referral code?</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code (e.g. WELCOME)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                />
                <Button onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()} variant="secondary">
                  {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Try code <span className="font-bold text-primary cursor-pointer" onClick={() => setCouponCode("WELCOME")}>WELCOME</span> to get ₹2,000 discount!
              </p>
            </CardContent>
          </Card>
        )}

        {hasDiscount && (
          <Card className="mb-4 border-secondary/50 bg-secondary/5">
            <CardContent className="p-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Coupon "{profile?.referred_by || couponCode}" applied — ₹2,000 off!</span>
            </CardContent>
          </Card>
        )}

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
          <>
            <Button
              size="lg"
              className="w-full text-lg py-6"
              onClick={handlePayNow}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Redirecting to Airpay...</>
              ) : (
                <>Pay ₹{price.toLocaleString()} Securely</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                const msg = `Hi, I need help paying for Techrola Premium (₹${price.toLocaleString()}).%0AName: ${profile?.name || "N/A"}%0AEmail: ${profile?.email || user?.email || "N/A"}`;
                window.open(`https://wa.me/919999999999?text=${msg}`, "_blank");
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Need help? Contact on WhatsApp
            </Button>
          </>
        ) : (
          <Link to="/plans">
            <Button size="lg" className="w-full text-lg py-6">
              Sign Up to Subscribe
            </Button>
          </Link>
        )}

        <p className="text-center text-xs text-muted-foreground mt-3">
          🔒 Secure payment powered by Airpay. Your subscription activates instantly upon successful payment.
        </p>
      </div>
    </Layout>
  );
};

export default Subscription;
