import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Pencil } from "lucide-react";

type WStatus = "pending" | "processing" | "approved" | "success" | "rejected";

const STAGES: { key: WStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing (UTR)" },
  { key: "success", label: "Success" },
  { key: "rejected", label: "Rejected" },
];

const statusColor = (s: string) => {
  if (s === "success" || s === "approved") return "bg-secondary text-secondary-foreground";
  if (s === "rejected") return "bg-destructive text-destructive-foreground";
  if (s === "processing") return "bg-primary text-primary-foreground";
  return "bg-accent text-accent-foreground";
};

const AdminWithdrawals = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WStatus>("pending");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkUtr, setBulkUtr] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [bankEdit, setBankEdit] = useState({
    bank_account_holder: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_name: "",
  });

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchWithdrawals();
  }, [isAdmin]);

  // Reset selection when changing tab
  useEffect(() => {
    setSelected({});
    setBulkUtr("");
  }, [tab]);

  const filtered = useMemo(
    () => withdrawals.filter((w) => w.status === tab),
    [withdrawals, tab]
  );

  if (authLoading)
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  if (!isAdmin) return <Navigate to="/" />;

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  const allChecked = filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) filtered.forEach((w) => (next[w.id] = true));
    setSelected(next);
  };

  const handleReject = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("withdrawals")
      .update({ status: "rejected" as WStatus })
      .in("id", ids);
    if (error) toast.error("Failed to reject");
    else {
      toast.success(`${ids.length} rejected`);
      setSelected({});
      fetchWithdrawals();
    }
  };

  const handleEnterUtr = async () => {
    if (!bulkUtr.trim()) {
      toast.error("Enter a UTR number");
      return;
    }
    if (!selectedIds.length) {
      toast.error("Select at least one withdrawal");
      return;
    }
    const { error } = await supabase
      .from("withdrawals")
      .update({
        utr_number: bulkUtr.trim(),
        status: "processing" as WStatus,
        processed_at: new Date().toISOString(),
      })
      .in("id", selectedIds);
    if (error) toast.error(error.message || "Failed to update");
    else {
      toast.success(`UTR set on ${selectedIds.length} withdrawal(s)`);
      setSelected({});
      setBulkUtr("");
      fetchWithdrawals();
    }
  };

  const handleMarkSuccess = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("withdrawals")
      .update({
        status: "success" as WStatus,
        completed_at: new Date().toISOString(),
      })
      .in("id", ids);
    if (error) toast.error("Failed to mark success");
    else {
      toast.success(`${ids.length} marked successful`);
      setSelected({});
      fetchWithdrawals();
    }
  };

  const openBankEdit = (w: any) => {
    setEditing(w);
    setBankEdit({
      bank_account_holder: w.bank_account_holder || "",
      bank_account_number: w.bank_account_number || "",
      bank_ifsc_code: w.bank_ifsc_code || "",
      bank_name: w.bank_name || "",
    });
  };

  const saveBankEdit = async () => {
    if (!editing) return;
    // Update both withdrawal snapshot and user's locked profile
    const [r1, r2] = await Promise.all([
      supabase.from("withdrawals").update(bankEdit).eq("id", editing.id),
      supabase.from("profiles").update(bankEdit).eq("user_id", editing.user_id),
    ]);
    if (r1.error || r2.error) {
      toast.error(r1.error?.message || r2.error?.message || "Failed to save");
    } else {
      toast.success("Bank details updated");
      setEditing(null);
      fetchWithdrawals();
    }
  };

  const renderTable = (rows: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allChecked}
              onCheckedChange={(v) => toggleAll(!!v)}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Bank</TableHead>
          <TableHead>UTR</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((w) => (
          <TableRow key={w.id}>
            <TableCell>
              <Checkbox
                checked={!!selected[w.id]}
                onCheckedChange={(v) =>
                  setSelected((s) => ({ ...s, [w.id]: !!v }))
                }
                aria-label="Select row"
              />
            </TableCell>
            <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}…</TableCell>
            <TableCell className="font-medium">₹{Number(w.amount).toFixed(2)}</TableCell>
            <TableCell className="text-xs">
              {w.bank_account_number ? (
                <div className="space-y-0.5">
                  <p className="font-medium">{w.bank_account_holder}</p>
                  <p className="text-muted-foreground">{w.bank_name}</p>
                  <p className="font-mono">A/C {w.bank_account_number}</p>
                  <p className="font-mono">{w.bank_ifsc_code}</p>
                </div>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">{w.utr_number || "—"}</TableCell>
            <TableCell className="text-xs">{format(new Date(w.created_at), "dd MMM yyyy")}</TableCell>
            <TableCell>
              <Badge className={statusColor(w.status)}>{w.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end flex-wrap">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openBankEdit(w)}>
                  <Pencil className="h-3 w-3" /> Bank
                </Button>
                {w.status === "processing" && (
                  <Button size="sm" variant="outline" className="gap-1 text-secondary" onClick={() => handleMarkSuccess([w.id])}>
                    <Check className="h-3 w-3" /> Success
                  </Button>
                )}
                {(w.status === "pending" || w.status === "processing") && (
                  <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleReject([w.id])}>
                    <X className="h-3 w-3" /> Reject
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as WStatus)}>
          <TabsList className="flex flex-wrap h-auto">
            {STAGES.map((s) => {
              const count = withdrawals.filter((w) => w.status === s.key).length;
              return (
                <TabsTrigger key={s.key} value={s.key} className="gap-2">
                  {s.label}
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {STAGES.map((s) => (
            <TabsContent key={s.key} value={s.key} className="space-y-4">
              {/* Bulk action bar — same UTR for all selected */}
              <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
                  <p className="text-sm text-muted-foreground flex-1">
                    {selectedIds.length} selected
                  </p>
                  {(s.key === "pending" || s.key === "processing") && (
                    <>
                      <Input
                        placeholder="Enter UTR number for all selected"
                        value={bulkUtr}
                        onChange={(e) => setBulkUtr(e.target.value)}
                        className="md:max-w-xs"
                      />
                      <Button onClick={handleEnterUtr} disabled={!selectedIds.length || !bulkUtr.trim()}>
                        Set UTR (Processing)
                      </Button>
                    </>
                  )}
                  {s.key === "processing" && (
                    <Button
                      variant="outline"
                      className="text-secondary"
                      onClick={() => handleMarkSuccess(selectedIds)}
                      disabled={!selectedIds.length}
                    >
                      Mark Success
                    </Button>
                  )}
                  {(s.key === "pending" || s.key === "processing") && (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleReject(selectedIds)}
                      disabled={!selectedIds.length}
                    >
                      Reject Selected
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No {s.label.toLowerCase()} requests</p>
                  ) : (
                    renderTable(filtered)
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Bank edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Account Holder"
              value={bankEdit.bank_account_holder}
              onChange={(e) => setBankEdit({ ...bankEdit, bank_account_holder: e.target.value })}
            />
            <Input
              placeholder="Bank Name"
              value={bankEdit.bank_name}
              onChange={(e) => setBankEdit({ ...bankEdit, bank_name: e.target.value })}
            />
            <Input
              placeholder="Account Number"
              value={bankEdit.bank_account_number}
              onChange={(e) => setBankEdit({ ...bankEdit, bank_account_number: e.target.value })}
            />
            <Input
              placeholder="IFSC Code"
              value={bankEdit.bank_ifsc_code}
              onChange={(e) => setBankEdit({ ...bankEdit, bank_ifsc_code: e.target.value.toUpperCase() })}
            />
            <p className="text-xs text-muted-foreground">
              Updates this withdrawal record and the user's locked bank profile.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveBankEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminWithdrawals;
