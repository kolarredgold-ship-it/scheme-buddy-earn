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
import { Lock } from "lucide-react";
import { z } from "zod";

const bankSchema = z.object({
  bank_account_holder: z.string().trim().min(2, "Name required").max(100),
  bank_account_number: z.string().trim().regex(/^\d{6,20}$/, "Enter a valid account number"),
  bank_ifsc_code: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  bank_name: z.string().trim().min(2, "Bank name required").max(100),
});

const Withdrawals = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [bankProfile, setBankProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_account_holder: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_name: "",
  });

  const fetchAll = async () => {
    if (!user) return;
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("bank_account_holder,bank_account_number,bank_ifsc_code,bank_name,bank_locked,wallet_balance")
        .eq("user_id", user.id)
        .single(),
    ]);
    if (w) setWithdrawals(w);
    if (p) setBankProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  if (authLoading)
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  if (!user) return <Navigate to="/login" />;

  const hasBank = !!bankProfile?.bank_account_number;
  const isLocked = !!bankProfile?.bank_locked;

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bankSchema.safeParse({
      ...bankForm,
      bank_ifsc_code: bankForm.bank_ifsc_code.toUpperCase(),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSavingBank(true);
    const { error } = await supabase
      .from("profiles")
      .update(parsed.data)
      .eq("user_id", user.id);
    setSavingBank(false);
    if (error) {
      toast.error(error.message || "Failed to save bank details");
    } else {
      toast.success("Bank details saved and locked. Contact admin to change.");
      fetchAll();
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBank) {
      toast.error("Please save your bank details first");
      return;
    }
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
      bank_account_holder: bankProfile.bank_account_holder,
      bank_account_number: bankProfile.bank_account_number,
      bank_ifsc_code: bankProfile.bank_ifsc_code,
      bank_name: bankProfile.bank_name,
    });
    if (error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted!");
      setAmount("");
      fetchAll();
    }
    setSubmitting(false);
  };

  const statusLabel = (s: string) => {
    if (s === "success") return "Success";
    if (s === "approved") return "Approved";
    if (s === "rejected") return "Rejected";
    if (s === "processing") return "Under Process";
    return "Pending";
  };

  const statusColor = (s: string) => {
    if (s === "success" || s === "approved") return "bg-secondary text-secondary-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    if (s === "processing") return "bg-primary text-primary-foreground";
    return "bg-accent text-accent-foreground";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-8 space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold">Withdrawals</h1>

        {/* Bank details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Bank Details
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasBank ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Account Holder:</span> <span className="font-medium">{bankProfile.bank_account_holder}</span></p>
                <p><span className="text-muted-foreground">Bank Name:</span> <span className="font-medium">{bankProfile.bank_name}</span></p>
                <p><span className="text-muted-foreground">Account No:</span> <span className="font-mono font-medium">{bankProfile.bank_account_number}</span></p>
                <p><span className="text-muted-foreground">IFSC:</span> <span className="font-mono font-medium">{bankProfile.bank_ifsc_code}</span></p>
                <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                  These details are locked. Contact admin to change them.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveBank} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Fill carefully. Once saved, only an admin can change these.
                </p>
                <Input
                  placeholder="Account Holder Name"
                  value={bankForm.bank_account_holder}
                  onChange={(e) => setBankForm({ ...bankForm, bank_account_holder: e.target.value })}
                  required
                />
                <Input
                  placeholder="Bank Name"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Account Number"
                  value={bankForm.bank_account_number}
                  onChange={(e) => setBankForm({ ...bankForm, bank_account_number: e.target.value.replace(/\D/g, "") })}
                  required
                />
                <Input
                  placeholder="IFSC Code (e.g. HDFC0001234)"
                  value={bankForm.bank_ifsc_code}
                  onChange={(e) => setBankForm({ ...bankForm, bank_ifsc_code: e.target.value.toUpperCase() })}
                  required
                />
                <Button type="submit" className="w-full" disabled={savingBank}>
                  {savingBank ? "Saving..." : "Save & Lock Bank Details"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

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
              <Button type="submit" className="w-full" disabled={submitting || !hasBank}>
                {submitting ? "Submitting..." : hasBank ? "Submit Request" : "Add bank details first"}
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
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No withdrawal requests yet</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">₹{Number(w.amount).toFixed(2)}</p>
                      <Badge className={statusColor(w.status)}>{statusLabel(w.status)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.created_at), "dd MMM yyyy, hh:mm a")}
                    </p>
                    {w.utr_number && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">UTR:</span>{" "}
                        <span className="font-mono font-medium">{w.utr_number}</span>
                      </p>
                    )}
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
