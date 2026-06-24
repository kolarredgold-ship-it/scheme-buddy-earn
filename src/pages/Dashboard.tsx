import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, BookOpen, ArrowRight, Copy, Share2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTx = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setTransactions(data);
      setTxLoading(false);
    };
    fetchTx();
  }, [user]);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  if (!user) return <Navigate to="/login" />;

  const totalEarnings = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareWhatsApp = () => {
    const msg = `Join Techrola and access government schemes! Use my referral code: ${profile?.referral_code} to get subscription at just ₹999! https://techrola.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hey, {profile?.name || (user?.user_metadata as any)?.name || user?.email?.split("@")[0] || "there"}! 👋</h1>
          <p className="text-muted-foreground">Here's your account overview</p>
        </div>

        {/* Wallet & Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-3xl font-bold text-accent-foreground">₹{totalEarnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

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
              Earn <span className="font-bold text-secondary">₹400</span> (L1), <span className="font-bold">₹100</span> (L2) & <span className="font-bold">₹50</span> (L3) per referral subscription!
            </p>
            <Button onClick={shareWhatsApp} className="w-full gap-2" variant="outline">
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet. Refer friends to start earning!</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => {
                  const isAirpay = typeof t.source === "string" && t.source.startsWith("Airpay|");
                  const parts = isAirpay ? String(t.source).split("|") : [];
                  const orderId = parts[1];
                  const txnId = parts[2];
                  const payStatus = parts[3]; // success | failed
                  const isFail = payStatus === "failed";

                  return (
                    <div key={t.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {isAirpay ? (isFail ? "Airpay Payment Failed" : "Premium Subscription Payment") : t.source}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd MMM yyyy, hh:mm a")}</p>
                        </div>
                        <Badge
                          variant={t.type === "credit" && !isFail ? "default" : "destructive"}
                          className={t.type === "credit" && !isFail ? "bg-secondary text-secondary-foreground shrink-0" : "shrink-0"}
                        >
                          {t.type === "credit" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                        </Badge>
                      </div>
                      {isAirpay && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                          {orderId && <div className="truncate">Order: <span className="font-mono">{orderId.slice(0, 18)}…</span></div>}
                          {txnId && txnId !== "n/a" && <div className="truncate">Txn: <span className="font-mono">{txnId}</span></div>}
                          <div>Status: <span className={isFail ? "text-destructive font-medium" : "text-secondary font-medium"}>{isFail ? "Failed" : "Success"}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
