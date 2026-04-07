import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, BookOpen, ArrowRight, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  if (!user) return <Navigate to="/login" />;

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareWhatsApp = () => {
    const msg = `Join TechRola and access government schemes! Use my referral code: ${profile?.referral_code} to get subscription at just ₹999! https://techrola.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hey, {profile?.name || "there"}! 👋</h1>
          <p className="text-muted-foreground">Here's your account overview</p>
        </div>

        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Wallet Balance</p>
                <p className="text-3xl font-bold mt-1">₹{profile?.wallet_balance?.toFixed(2) || "0.00"}</p>
              </div>
              <Wallet className="h-10 w-10 opacity-50" />
            </div>
            <div className="mt-4 flex gap-2">
              <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30">
                {profile?.subscription_status === "active" ? "✅ Active" : "Free Plan"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
              <code className="text-lg font-bold tracking-wider flex-1">{profile?.referral_code}</code>
              <Button variant="ghost" size="icon" onClick={copyReferralCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Earn <span className="font-bold text-secondary">₹400</span> for each friend who subscribes! 
              Your referrals earn <span className="font-bold">₹50</span> at Level 2 & 3 too.
            </p>
            <Button onClick={shareWhatsApp} className="w-full gap-2" variant="outline">
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link to="/earnings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <Wallet className="h-8 w-8 text-accent" />
                <span className="font-medium text-sm">Earnings</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/withdrawals">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <ArrowRight className="h-8 w-8 text-secondary" />
                <span className="font-medium text-sm">Withdraw</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="font-medium text-sm">Browse Schemes</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
