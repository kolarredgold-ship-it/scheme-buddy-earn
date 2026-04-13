import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Lock, Check, Copy, Share2, Megaphone, TrendingUp, Award,
  UserPlus, CreditCard, Code2, BarChart3, Briefcase, ChevronRight,
  Loader2, Trophy, Flame, Calendar, Users
} from "lucide-react";

interface CareerProgress {
  id: string;
  user_id: string;
  registered: boolean;
  course: string | null;
  college: string | null;
  phone: string | null;
  current_step: number;
  daily_promotions: number;
  last_promotion_date: string | null;
  total_promotions: number;
  streak_days: number;
  total_active_days: number;
  eligible: boolean;
}

const STEPS = [
  { num: 1, title: "Registration", icon: UserPlus, desc: "Complete your profile" },
  { num: 2, title: "Subscribe", icon: CreditCard, desc: "Get premium access" },
  { num: 3, title: "Get Referral Code", icon: Code2, desc: "Your unique EMP code" },
  { num: 4, title: "Promote", icon: Megaphone, desc: "Share & track daily" },
  { num: 5, title: "Performance", icon: BarChart3, desc: "Track consistency" },
  { num: 6, title: "Get Hired", icon: Briefcase, desc: "Apply for opportunities" },
];

const MIN_STREAK_FOR_ELIGIBLE = 7;

const CareerProgram = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<CareerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", course: "", college: "", password: "", referralCode: searchParams.get("ref")?.toUpperCase() || "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch career progress
  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("career_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setProgress(data as unknown as CareerProgress);
      setLoading(false);
    };
    if (!authLoading) fetch();
  }, [user, authLoading]);

  // Pre-fill form with profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        email: profile.email || "",
      }));
    }
  }, [profile]);

  const currentStep = !user ? 1 : !progress?.registered ? 1 : 
    profile?.subscription_status !== "active" ? 2 :
    !profile?.referral_code?.startsWith("EMP") ? 3 :
    progress.current_step;

  const progressPercent = Math.round(((Math.min(currentStep, 6)) / 6) * 100);

  // Check if today's promotions need reset
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyCount = progress?.last_promotion_date === todayStr ? (progress?.daily_promotions || 0) : 0;

  // Step 1: Registration (also handles signup if not logged in)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user) {
      // Sign up the user first
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setSubmitting(false);
        return;
      }
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            referred_by: formData.referralCode || undefined,
          },
        },
      });
      if (signUpError) {
        toast.error(signUpError.message);
        setSubmitting(false);
        return;
      }
      // Wait for auth state to settle, then save career progress
      const userId = signUpData.user?.id;
      if (userId) {
        await supabase.from("career_progress").upsert({
          user_id: userId,
          registered: true,
          course: formData.course,
          college: formData.college,
          phone: formData.phone,
          current_step: 2,
        }, { onConflict: "user_id" });
      }
      toast.success("Account created! Please check your email to verify, then log in.");
      navigate("/login");
      setSubmitting(false);
      return;
    }

    // Already logged in — just register career details
    const { error } = await supabase.from("career_progress").upsert({
      user_id: user.id,
      registered: true,
      course: formData.course,
      college: formData.college,
      phone: formData.phone,
      current_step: 2,
    }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to register. Try again.");
    } else {
      toast.success("Step Unlocked: Subscribe to continue!");
      setProgress(prev => prev ? { ...prev, registered: true, current_step: 2, course: formData.course, college: formData.college, phone: formData.phone } : {
        id: "", user_id: user.id, registered: true, course: formData.course, college: formData.college, phone: formData.phone,
        current_step: 2, daily_promotions: 0, last_promotion_date: null, total_promotions: 0, streak_days: 0, total_active_days: 0, eligible: false,
      });
    }
    setSubmitting(false);
  };

  // Step 3: Generate EMP referral code
  const handleGenerateCode = async () => {
    if (!user) return;
    setSubmitting(true);
    
    // Generate unique EMP code
    let code = "";
    let unique = false;
    while (!unique) {
      const rand = Math.floor(1000 + Math.random() * 999000);
      code = `EMP${rand}`;
      const { data } = await supabase.from("profiles").select("id").eq("referral_code", code).maybeSingle();
      if (!data) unique = true;
    }

    // Update profile with new code
    const { error } = await supabase.from("profiles").update({ referral_code: code }).eq("user_id", user.id);
    if (error) {
      toast.error("Failed to generate code. Try again.");
    } else {
      // Update career progress step
      await supabase.from("career_progress").update({ current_step: 4 }).eq("user_id", user.id);
      setProgress(prev => prev ? { ...prev, current_step: 4 } : null);
      toast.success("Your referral code is ready!");
      // Force profile refresh
      window.location.reload();
    }
    setSubmitting(false);
  };

  // Step 4: Mark as promoted
  const handlePromote = async () => {
    if (!user || !progress) return;
    if (dailyCount >= 3) {
      toast.info("You've completed today's promotions! Come back tomorrow.");
      return;
    }
    setSubmitting(true);

    // Log promotion
    await supabase.from("promotion_logs").insert({ user_id: user.id });

    const newDailyCount = dailyCount + 1;
    const newTotal = (progress.total_promotions || 0) + 1;
    const dayCompleted = newDailyCount >= 3;

    let newStreak = progress.streak_days || 0;
    let newActiveDays = progress.total_active_days || 0;

    if (dayCompleted) {
      newStreak += 1;
      newActiveDays += 1;
    }

    const isEligible = newStreak >= MIN_STREAK_FOR_ELIGIBLE;
    const newStep = isEligible ? 6 : newStreak >= 1 ? 5 : 4;

    await supabase.from("career_progress").update({
      daily_promotions: newDailyCount,
      last_promotion_date: todayStr,
      total_promotions: newTotal,
      streak_days: newStreak,
      total_active_days: newActiveDays,
      eligible: isEligible,
      current_step: Math.max(progress.current_step, newStep),
    }).eq("user_id", user.id);

    setProgress(prev => prev ? {
      ...prev,
      daily_promotions: newDailyCount,
      last_promotion_date: todayStr,
      total_promotions: newTotal,
      streak_days: newStreak,
      total_active_days: newActiveDays,
      eligible: isEligible,
      current_step: Math.max(prev.current_step, newStep),
    } : null);

    toast.success(dayCompleted ? "Day completed! Streak updated!" : `Promoted! ${3 - newDailyCount} more today.`);
    setSubmitting(false);
  };

  // Step 6: Apply for hiring
  const handleApplyHiring = async (type: string) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("hiring_applications").insert({
      user_id: user.id,
      application_type: type,
    });
    if (error) {
      toast.error("Failed to apply. Try again.");
    } else {
      toast.success("Application submitted! Our team will contact you.");
    }
    setSubmitting(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const renderStepContent = (step: number) => {
    const isLocked = step > currentStep;
    const isCompleted = step < currentStep;

    if (isLocked) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Complete previous step to unlock</p>
        </div>
      );
    }

    switch (step) {
      case 1:
        if (isCompleted) return <CompletedBadge text="Registration Complete" />;
        return (
          <form onSubmit={handleRegister} className="space-y-3">
            <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            {!user && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Password (min 6 chars)"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
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
            )}
            <Input placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <Input placeholder="Course (e.g. B.Tech, MBA)" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} required />
            <Input placeholder="College Name" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} required />
            <div className="space-y-1">
              <Input placeholder="Referral Code (optional)" value={formData.referralCode} onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})} />
              <p className="text-xs text-muted-foreground">Have a referral code? Get subscription at ₹999 instead of ₹2999!</p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {user ? "Apply Now" : "Sign Up & Apply Now"}
            </Button>
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
              </p>
            )}
          </form>
        );

      case 2:
        if (isCompleted) return <CompletedBadge text="Subscribed Successfully" />;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {["Government scheme access", "AI Interview Training", "Internship tools", "Career program access"].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-secondary shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <Link to="/subscription">
              <Button className="w-full gap-2">
                <CreditCard className="h-4 w-4" /> Subscribe Now — ₹999
              </Button>
            </Link>
          </div>
        );

      case 3:
        if (isCompleted || profile?.referral_code?.startsWith("EMP")) {
          const code = profile?.referral_code || "";
          const link = `${window.location.origin}/signup?ref=${code}`;
          return (
            <div className="space-y-3">
              <CompletedBadge text="Referral Code Generated" />
              <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                <span className="flex-1 text-center font-bold text-lg tracking-widest">{code}</span>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input value={link} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Join Techrola Career Program", text: `Use my code ${code} to join!`, url: link });
                  } else {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied!");
                  }
                }}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">Generate your unique referral code to start promoting</p>
            <Button onClick={handleGenerateCode} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
              Generate My Code
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share via WhatsApp, Instagram, or college groups. Complete <strong>minimum 3 promotions per day</strong>.
            </p>
            <div className="flex items-center justify-between bg-muted rounded-xl p-3">
              <span className="text-sm font-medium">Today's Progress</span>
              <Badge variant={dailyCount >= 3 ? "default" : "outline"} className={dailyCount >= 3 ? "bg-secondary" : ""}>
                {dailyCount}/3
              </Badge>
            </div>
            <Progress value={(dailyCount / 3) * 100} className="h-2" />
            <Button onClick={handlePromote} disabled={submitting || dailyCount >= 3} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {dailyCount >= 3 ? "Completed for Today ✓" : "Mark as Promoted"}
            </Button>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold">{progress?.total_promotions || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold flex items-center justify-center gap-0.5"><Flame className="h-3.5 w-3.5 text-orange-500" />{progress?.streak_days || 0}</p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold">{progress?.total_active_days || 0}</p>
                <p className="text-[10px] text-muted-foreground">Active Days</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Calendar} label="Active Days" value={progress?.total_active_days || 0} />
              <StatCard icon={Flame} label="Streak Days" value={progress?.streak_days || 0} />
              <StatCard icon={Megaphone} label="Total Promotions" value={progress?.total_promotions || 0} />
              <StatCard icon={Users} label="Total Referrals" value="-" />
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Eligibility Progress</span>
                <span className="text-xs text-muted-foreground">{Math.min(progress?.streak_days || 0, MIN_STREAK_FOR_ELIGIBLE)}/{MIN_STREAK_FOR_ELIGIBLE} days</span>
              </div>
              <Progress value={Math.min(((progress?.streak_days || 0) / MIN_STREAK_FOR_ELIGIBLE) * 100, 100)} className="h-2" />
            </div>
            {progress?.eligible ? (
              <Badge className="bg-secondary w-full justify-center py-2">
                <Award className="h-4 w-4 mr-1" /> You're Eligible! Proceed to Step 6
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Maintain a {MIN_STREAK_FOR_ELIGIBLE}-day streak to become eligible for hiring
              </p>
            )}
          </div>
        );

      case 6:
        if (!progress?.eligible) {
          return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Complete {MIN_STREAK_FOR_ELIGIBLE}-day streak to unlock</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-2">You're eligible! Choose an opportunity:</p>
            {[
              { type: "internship", label: "Apply for Internship", icon: Briefcase },
              { type: "job", label: "Apply for Job", icon: TrendingUp },
              { type: "certificate", label: "Get Certificate", icon: Award },
            ].map(opt => (
              <Button key={opt.type} variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => handleApplyHiring(opt.type)} disabled={submitting}>
                <opt.icon className="h-5 w-5 text-primary" />
                {opt.label}
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
            <Trophy className="h-3 w-3 mr-1" /> Career Program
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Join Techrola Career Program</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Work, Learn, and Get Hired Based on Your Performance
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Overall Progress</span>
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step) => {
            const isActive = step.num === currentStep;
            const isCompleted = step.num < currentStep;
            const isLocked = step.num > currentStep;

            return (
              <Card
                key={step.num}
                className={`transition-all duration-300 ${
                  isActive ? "border-primary shadow-lg ring-1 ring-primary/20" :
                  isCompleted ? "border-secondary/30 bg-secondary/5" :
                  "border-border/40 opacity-60"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted ? "bg-secondary text-secondary-foreground" :
                      isActive ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5" /> :
                       isLocked ? <Lock className="h-4 w-4" /> :
                       <step.icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base flex items-center gap-2">
                        Step {step.num}: {step.title}
                        {isCompleted && <Badge variant="outline" className="text-[10px] border-secondary text-secondary">Done</Badge>}
                        {isActive && <Badge className="text-[10px] bg-primary">Current</Badge>}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </CardHeader>
                {(isActive || (isCompleted && step.num >= 3)) && (
                  <CardContent className="pt-0">
                    {renderStepContent(step.num)}
                  </CardContent>
                )}
                {isLocked && (
                  <CardContent className="pt-0">
                    {renderStepContent(step.num)}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Final CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            "Start as a promoter, grow into a professional, and build your career with Techrola."
          </p>
        </div>
      </div>
    </Layout>
  );
};

const CompletedBadge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 text-secondary text-sm font-medium">
    <Check className="h-4 w-4" /> {text}
  </div>
);

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) => (
  <div className="bg-muted/50 rounded-xl p-3 text-center">
    <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
    <p className="text-xl font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default CareerProgram;
