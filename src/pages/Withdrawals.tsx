import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

const Withdrawals = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => { fetchWithdrawals(); }, [user]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!user) return <Navigate to="/login" />;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }
    if (amt > (profile?.wallet_balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: amt,
    });
    if (error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted!");
      setAmount("");
      fetchWithdrawals();
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-secondary text-secondary-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-accent text-accent-foreground";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-8 space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold">Withdrawals</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Available balance: <span className="font-bold text-foreground">₹{profile?.wallet_balance?.toFixed(2) || "0.00"}</span>
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (min ₹500)</label>
                <Input
                  type="number"
                  min={500}
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No withdrawal requests yet</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">₹{Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(w.created_at), "dd MMM yyyy")}</p>
                    </div>
                    <Badge className={statusColor(w.status)}>{w.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Withdrawals;
