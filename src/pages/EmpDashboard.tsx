import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, Clock, MessageCircle, TrendingUp, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  subscription_status: "free" | "active" | "expired";
  created_at: string;
}

const EmpDashboard = () => {
  const { user, profile, loading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [careerProgress, setCareerProgress] = useState<any>(null);

  useEffect(() => {
    if (!profile?.referral_code) return;

    const fetchLeads = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, mobile, subscription_status, created_at")
        .eq("referred_by", profile.referral_code)
        .order("created_at", { ascending: false });

      if (data) setLeads(data as Lead[]);
      setLoadingLeads(false);
    };

    const fetchCareer = async () => {
      const { data } = await supabase
        .from("career_progress")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      setCareerProgress(data);
    };

    fetchLeads();
    fetchCareer();
  }, [profile?.referral_code, user]);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!user) return <Navigate to="/login" replace />;

  // Check if user is in career program (has career progress)
  if (!profile || profile.subscription_status !== "active") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center max-w-lg">
          <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">EMP Dashboard</h1>
          <p className="text-muted-foreground mb-6">You need an active subscription to access the EMP dashboard.</p>
          <Link to="/career-program">
            <Button className="bg-gradient-primary font-semibold">Join Career Program</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const pendingLeads = leads.filter(l => l.subscription_status === "free" || l.subscription_status === "expired");
  const successLeads = leads.filter(l => l.subscription_status === "active");

  const referralLink = `https://techrola.in/signup?ref=${profile.referral_code}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const sendWhatsAppMessage = (lead: Lead) => {
    const name = lead.name || "there";
    const message = encodeURIComponent(
      `Hi ${name}! 👋\n\nI noticed you signed up on Techrola but haven't activated your premium subscription yet.\n\n🎯 With Premium, you get:\n✅ Direct Apply links for 800+ govt schemes\n✅ AI Mock Interviews\n✅ AI Report Generator\n✅ Career Program access\n\n💰 Use code *${profile.referral_code}* to get it at just ₹83.25/m (instead of ₹249.92/m)!\n\n👉 ${referralLink}\n\nDon't miss out! 🚀`
    );
    const phone = lead.mobile?.replace(/[^0-9]/g, "") || "";
    const url = phone
      ? `https://wa.me/91${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, "_blank");
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🚀 Join Techrola - India's #1 Government Schemes Platform!\n\n✅ 800+ Schemes across all states\n✅ AI-powered search & tools\n✅ Career program with earning opportunities\n\n💰 Use my referral code *${profile.referral_code}* to get Premium at ₹83.25/m!\n\n👉 ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-4 pb-24 md:pb-8 max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              EMP Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              {profile.referral_code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Track your referrals & grow your network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-border/40">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{leads.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{pendingLeads.length}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{successLeads.length}</p>
              <p className="text-[10px] text-muted-foreground">Converted</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link & Share */}
        <Card className="mb-6 border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold mb-2">Your Referral Link</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-background rounded-lg px-3 py-2 text-xs text-muted-foreground truncate border border-border/60">
                {referralLink}
              </div>
              <Button size="sm" variant="outline" onClick={copyReferralLink} className="shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={shareOnWhatsApp} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1">
                <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={copyReferralLink} className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <Card className="mb-6 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estimated Earnings</p>
                <p className="text-2xl font-bold text-primary">₹{successLeads.length * 400}</p>
                <p className="text-[10px] text-muted-foreground">₹400 per conversion (Level 1)</p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Leads Tabs */}
        <Tabs defaultValue={pendingLeads.length > 0 ? "pending" : "success"} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1 gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" /> Pending ({pendingLeads.length})
            </TabsTrigger>
            <TabsTrigger value="success" className="flex-1 gap-1.5 text-xs">
              <CheckCircle className="h-3.5 w-3.5" /> Converted ({successLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingLeads ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingLeads.length === 0 ? (
              <Card className="border-border/40">
                <CardContent className="p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No pending leads yet</p>
                  <Button size="sm" onClick={shareOnWhatsApp} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <MessageCircle className="h-3.5 w-3.5" /> Start Marketing on WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingLeads.map((lead) => (
                  <Card key={lead.id} className="border-border/40">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{lead.name || "Unnamed User"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {lead.subscription_status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendWhatsAppMessage(lead)}
                        className="shrink-0 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 h-auto"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="success">
            {loadingLeads ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : successLeads.length === 0 ? (
              <Card className="border-border/40">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversions yet. Keep promoting!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {successLeads.map((lead) => (
                  <Card key={lead.id} className="border-border/40 border-l-4 border-l-emerald-500">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{lead.name || "Unnamed User"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            ✅ Converted
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            +₹400 earned
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmpDashboard;
