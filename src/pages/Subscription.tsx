import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Star, Zap, Shield, Loader2, Tag, MessageCircle, FlaskConical, AlertCircle, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const { user, profile, loading, refreshProfile, isAdmin } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [paying, setPaying] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<number>(0);
  const [initError, setInitError] = useState<{
    title: string;
    detail: string;
    hint: string;
    code: "network" | "timeout" | "validation" | "auth" | "config" | "gateway" | "unknown";
    raw?: string;
  } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    amount: number;
    buyerEmail: string;
    buyerPhone: string;
    buyerFirstname: string;
    buyerLastname: string;
  } | null>(null);

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
  const [lastAttempt, setLastAttempt] = useState<number>(0);
  const [initError, setInitError] = useState<{
    title: string;
    detail: string;
    hint: string;
    code: "network" | "timeout" | "validation" | "auth" | "config" | "gateway" | "unknown";
    raw?: string;
  } | null>(null);
  // Persist order context across retries so the same orderId is reused
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    amount: number;
    buyerEmail: string;
    buyerPhone: string;
    buyerFirstname: string;
    buyerLastname: string;
  } | null>(null);

  const classifyError = (raw: string): NonNullable<typeof initError> => {
    const m = raw.toLowerCase();
    if (m === "timeout" || m.includes("timed out")) {
      return {
        title: "Airpay didn't respond in time",
        detail: "The payment gateway took too long to start your checkout.",
        hint: "Check your internet connection and tap retry. Your order ID is preserved.",
        code: "timeout",
        raw,
      };
    }
    if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) {
      return {
        title: "Network connection issue",
        detail: "We couldn't reach the payment service from your device.",
        hint: "Reconnect to Wi-Fi or mobile data, then retry.",
        code: "network",
        raw,
      };
    }
    if (m.includes("missing required")) {
      return {
        title: "Profile information missing",
        detail: "Some details required by Airpay are missing from your profile.",
        hint: "Make sure your name, email, and 10-digit mobile are filled in.",
        code: "validation",
        raw,
      };
    }
    if (m.includes("login") || m.includes("auth") || m.includes("unauthorized") || m.includes("jwt")) {
      return {
        title: "Session expired",
        detail: "Your login session has expired during checkout.",
        hint: "Please log in again to continue.",
        code: "auth",
        raw,
      };
    }
    if (m.includes("airpay credentials") || m.includes("not configured") || m.includes("misconfigured")) {
      return {
        title: "Payment gateway not configured",
        detail: "Airpay credentials are missing on the server.",
        hint: "Please contact support — this is on our side, not yours.",
        code: "config",
        raw,
      };
    }
    if (m.includes("airpay") || m.includes("checksum") || m.includes("encrypt")) {
      return {
        title: "Payment gateway error",
        detail: "Airpay rejected the request to start your checkout.",
        hint: "Wait a few seconds and try again. If it keeps failing, contact support.",
        code: "gateway",
        raw,
      };
    }
    return {
      title: "Couldn't start payment",
      detail: raw || "An unexpected error occurred while contacting the gateway.",
      hint: "Tap retry — your order will be reused.",
      code: "unknown",
      raw,
    };
  };

  const startPayment = async (order: NonNullable<typeof pendingOrder>) => {
    setInitError(null);
    setPaying(true);
    setLastAttempt((n) => n + 1);

    try {
      localStorage.setItem(
        "airpay_pending_order",
        JSON.stringify({ orderId: order.orderId, amount: order.amount, createdAt: Date.now() })
      );
    } catch {}

    const timeoutPromise = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), 20000)
    );

    try {
      const result: any = await Promise.race([
        supabase.functions.invoke("airpay-payment", {
          body: {
            userId: user!.id,
            orderId: order.orderId,
            amount: order.amount,
            buyerEmail: order.buyerEmail,
            buyerPhone: order.buyerPhone,
            buyerFirstname: order.buyerFirstname,
            buyerLastname: order.buyerLastname,
            mode: testMode ? "test" : "live",
          },
        }),
        timeoutPromise,
      ]);
      const { data, error } = result;

      if (error || !data?.success) {
        throw new Error((data as any)?.error || error?.message || "Payment init failed");
      }

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
      const friendly = classifyError(e?.message || String(e));
      setInitError(friendly);
      toast.error(friendly.title);
      setPaying(false);
    }
  };

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
    const orderId = `SUB_${user.id}_${Date.now()}`;

    const order = {
      orderId,
      amount: price,
      buyerEmail: email,
      buyerPhone: phone.slice(-10),
      buyerFirstname: firstName,
      buyerLastname: lastName,
    };
    setPendingOrder(order);
    await startPayment(order);
  };

  const handleRetry = async () => {
    if (pendingOrder) {
      await startPayment(pendingOrder);
    } else {
      await handlePayNow();
    }
  };

  const handleFreshOrder = async () => {
    setPendingOrder(null);
    setInitError(null);
    setLastAttempt(0);
    await handlePayNow();
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
            {isAdmin && (
              <Card className={`mb-3 border-2 ${testMode ? "border-amber-500/60 bg-amber-500/5" : "border-muted"}`}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className={`h-4 w-4 ${testMode ? "text-amber-600" : "text-muted-foreground"}`} />
                    <div>
                      <Label htmlFor="test-mode" className="text-sm font-semibold cursor-pointer">
                        Airpay {testMode ? "Test (Sandbox)" : "Live"} Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {testMode ? "Sandbox checkout, charges ₹1 only" : "Real payment on production gateway"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="test-mode"
                    checked={testMode}
                    onCheckedChange={setTestMode}
                    disabled={paying}
                  />
                </CardContent>
              </Card>
            )}
            {initError && (
              <Card className="mb-3 border-destructive/40 bg-destructive/5">
                <CardContent className="p-4 text-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-destructive">{initError.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{initError.detail}</p>
                      <p className="text-xs text-foreground/80 mt-2">💡 {initError.hint}</p>
                      {pendingOrder && (
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono break-all">
                          Order: {pendingOrder.orderId}
                        </p>
                      )}
                    </div>
                  </div>

                  {initError.code === "auth" ? (
                    <Button size="sm" className="w-full" onClick={() => (window.location.href = "/login")}>
                      Log in again
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleRetry}
                        disabled={paying}
                      >
                        {paying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry (try {lastAttempt + 1})</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleFreshOrder}
                        disabled={paying}
                      >
                        New order
                      </Button>
                    </div>
                  )}

                  {(initError.code === "config" || initError.code === "gateway") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => {
                        const msg = `Hi, payment failed for Techrola Premium.%0AReason: ${encodeURIComponent(initError.title)}%0AOrder: ${pendingOrder?.orderId || "n/a"}%0AName: ${profile?.name || "N/A"}`;
                        window.open(`https://wa.me/919999999999?text=${msg}`, "_blank");
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Contact support on WhatsApp
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
            <Button
              size="lg"
              className="w-full text-lg py-6"
              onClick={handlePayNow}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Redirecting to Airpay{testMode ? " Sandbox" : ""}...</>
              ) : initError ? (
                <>Try again — Pay ₹{(testMode ? 1 : price).toLocaleString()}</>
              ) : (
                <>Pay ₹{(testMode ? 1 : price).toLocaleString()} {testMode ? "(Test)" : "Securely"}</>
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
