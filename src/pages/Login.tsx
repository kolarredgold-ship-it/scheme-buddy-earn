import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate(redirectTo);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-8">
            <span className="text-primary-foreground font-bold text-2xl" style={{ fontFamily: 'Space Grotesk' }}>T</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight max-w-md">Welcome back to Techrola.</h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-md">Sign in to explore 7,700+ government schemes &amp; jobs, use AI student tools, and track your referral earnings.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 max-w-md">
          <div><p className="text-3xl font-extrabold">7,700+</p><p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Schemes &amp; Jobs</p></div>
          <div><p className="text-3xl font-extrabold">₹83.25</p><p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Per Month</p></div>
          <div><p className="text-3xl font-extrabold">₹400</p><p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Per Referral</p></div>
        </div>
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access schemes, jobs &amp; AI student tools</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign Up</Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>

  );
};

export default Login;
