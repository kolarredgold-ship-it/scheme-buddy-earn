import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

const AdminWithdrawals = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchWithdrawals(); }, [isAdmin]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" />;

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) {
      toast.error(`Failed to ${status} withdrawal`);
    } else {
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    }
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-secondary text-secondary-foreground";
    if (s === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-accent text-accent-foreground";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No withdrawal requests</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">₹{Number(w.amount).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(w.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell><Badge className={statusColor(w.status)}>{w.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {w.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" className="gap-1 text-secondary" onClick={() => handleAction(w.id, "approved")}>
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleAction(w.id, "rejected")}>
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminWithdrawals;
