import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-emerald-500" };
  return { score: 5, label: "Very Strong", color: "bg-green-600" };
};

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState("");
  const [validatingRef, setValidatingRef] = useState(false);
  const [refValid, setRefValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/subscription";

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validateReferral = async (code: string): Promise<boolean> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setReferralError("");
      setRefValid(false);
      return true;
    }
    if (trimmed === "WELCOME") {
      setReferralError("");
      setRefValid(true);
      return true;
    }
    if (!/^[A-Z0-9]{4,14}$/.test(trimmed)) {
      setReferralError("Invalid format. Enter the referral code exactly as shared with you.");
      setRefValid(false);
      return false;
    }
    setValidatingRef(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("referral_code", trimmed)
      .maybeSingle();
    setValidatingRef(false);
    if (error || !data) {
      setReferralError("Referral code not found. Please check and try again.");
      setRefValid(false);
      return false;
    }
    setReferralError("");
    setRefValid(true);
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    if (referralCode.trim()) {
      const ok = await validateReferral(referralCode);
      if (!ok) {
        toast.error("Please fix the referral code before continuing");
        return;
      }
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          referred_by: referralCode.trim().toUpperCase() || undefined,
        },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created!");
      navigate(redirectTo);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-8">
            <span className="text-primary-foreground font-bold text-2xl" style={{ fontFamily: 'Space Grotesk' }}>T</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight max-w-md">Join Techrola in seconds.</h2>
          <p className="mt-4 text-lg text-primary-foreground/85 max-w-md">Get 1 free AI generation per tool, browse 800+ government schemes, and earn ₹400 per Premium referral.</p>
          <ul className="mt-8 space-y-3 text-primary-foreground/90 text-sm">
            <li className="flex items-center gap-2">✓ 1 free AI generation per tool</li>
            <li className="flex items-center gap-2">✓ Unified referral code (works everywhere)</li>
            <li className="flex items-center gap-2">✓ 3-level referral earnings up to ₹550</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">© Techrola · Secure sign-up powered by Lovable Cloud</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md relative shadow-xl border-border/60">
        <Link to="/" className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>T</span>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join Techrola to access government schemes & earn rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 1 ? "text-red-500" :
                    strength.score <= 2 ? "text-orange-500" :
                    strength.score <= 3 ? "text-yellow-600" :
                    "text-emerald-600"
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Code (optional)</label>
              <Input
                placeholder="e.g. TRABC123"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setReferralError("");
                  setRefValid(false);
                }}
                onBlur={() => referralCode.trim() && validateReferral(referralCode)}
                className={referralError ? "border-red-500" : refValid ? "border-emerald-500" : ""}
              />
              {validatingRef && <p className="text-xs text-muted-foreground">Checking code…</p>}
              {referralError && <p className="text-xs text-red-500 font-medium">{referralError}</p>}
              {refValid && !referralError && (
                <p className="text-xs text-emerald-600 font-medium">✓ Valid code — you'll get ₹2,000 off</p>
              )}
              <p className="text-xs text-muted-foreground">Have a referral code? Get subscription at ₹1000 instead of ₹2999!</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>

  );
};

export default Signup;
