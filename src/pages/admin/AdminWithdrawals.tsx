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
import { Check, X, Pencil, Download, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

type WStatus = "pending" | "processing" | "approved" | "success" | "rejected";

const statusColor = (s: string) => {
  if (s === "success" || s === "approved") return "bg-secondary text-secondary-foreground";
  if (s === "rejected") return "bg-destructive text-destructive-foreground";
  if (s === "processing") return "bg-primary text-primary-foreground";
  return "bg-accent text-accent-foreground";
};

const AdminWithdrawals = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "processing" | "success">("pending");

  // Pending tab state
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);

  // Processing tab state — UTR per batch
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});

  // Bank edit dialog
  const [editing, setEditing] = useState<any | null>(null);
  const [bankEdit, setBankEdit] = useState({
    bank_account_holder: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_name: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: w }, { data: b }] = await Promise.all([
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawal_batches").select("*").order("created_at", { ascending: false }),
    ]);
    if (w) setWithdrawals(w);
    if (b) setBatches(b);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  useEffect(() => {
    setSelected({});
  }, [tab]);

  const pending = useMemo(() => withdrawals.filter((w) => w.status === "pending"), [withdrawals]);
  const processingBatches = useMemo(() => batches.filter((b) => b.status === "processing"), [batches]);
  const successBatches = useMemo(() => batches.filter((b) => b.status === "success"), [batches]);

  const withdrawalsByBatch = useMemo(() => {
    const map: Record<string, any[]> = {};
    withdrawals.forEach((w) => {
      if (w.batch_id) (map[w.batch_id] ||= []).push(w);
    });
    return map;
  }, [withdrawals]);

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
  const allChecked = pending.length > 0 && selectedIds.length === pending.length;

  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    if (v) pending.forEach((w) => (next[w.id] = true));
    setSelected(next);
  };

  // === Pending tab actions ===
  const handleReject = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("withdrawals").update({ status: "rejected" as WStatus }).in("id", ids);
    if (error) toast.error("Failed to reject");
    else {
      toast.success(`${ids.length} rejected`);
      setSelected({});
      fetchAll();
    }
  };

  const openBatchDialog = () => {
    if (!selectedIds.length) {
      toast.error("Select withdrawal requests first");
      return;
    }
    setBatchName(`Batch ${format(new Date(), "dd-MMM-yyyy HH:mm")}`);
    setBatchDialog(true);
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      toast.error("Enter a batch name");
      return;
    }
    setCreatingBatch(true);
    const selectedRows = pending.filter((w) => selected[w.id]);
    const total = selectedRows.reduce((s, w) => s + Number(w.amount), 0);

    const { data: batch, error: bErr } = await supabase
      .from("withdrawal_batches")
      .insert({
        name: batchName.trim(),
        status: "processing" as WStatus,
        total_amount: total,
        total_count: selectedRows.length,
        created_by: user?.id,
      })
      .select()
      .single();

    if (bErr || !batch) {
      setCreatingBatch(false);
      toast.error(bErr?.message || "Failed to create batch");
      return;
    }

    const { error: uErr } = await supabase
      .from("withdrawals")
      .update({
        batch_id: batch.id,
        status: "processing" as WStatus,
        processed_at: new Date().toISOString(),
      })
      .in("id", selectedRows.map((w) => w.id));

    setCreatingBatch(false);
    if (uErr) toast.error(uErr.message);
    else {
      toast.success(`Batch "${batch.name}" created with ${selectedRows.length} requests`);
      setBatchDialog(false);
      setSelected({});
      setBatchName("");
      setTab("processing");
      fetchAll();
    }
  };

  // === Processing tab actions ===
  const downloadBatchExcel = (batch: any) => {
    const rows = (withdrawalsByBatch[batch.id] || []).map((w, i) => ({
      "S.No": i + 1,
      "Beneficiary Name": w.bank_account_holder || "",
      "Account Number": w.bank_account_number || "",
      "IFSC Code": w.bank_ifsc_code || "",
      "Bank Name": w.bank_name || "",
      "Amount (INR)": Number(w.amount),
      "Reference": w.user_id?.slice(0, 8) || "",
    }));
    const totalRow = {
      "S.No": "",
      "Beneficiary Name": "TOTAL",
      "Account Number": "",
      "IFSC Code": "",
      "Bank Name": "",
      "Amount (INR)": rows.reduce((s, r) => s + Number(r["Amount (INR)"]), 0),
      "Reference": "",
    };
    const ws = XLSX.utils.json_to_sheet([...rows, totalRow]);
    ws["!cols"] = [
      { wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payout");
    const safe = batch.name.replace(/[^a-z0-9]+/gi, "_");
    XLSX.writeFile(wb, `${safe}.xlsx`);
  };

  const markBatchSuccess = async (batch: any) => {
    const utr = (utrInputs[batch.id] || "").trim();
    if (!utr) {
      toast.error("Enter the UTR number first");
      return;
    }
    const now = new Date().toISOString();
    const [r1, r2] = await Promise.all([
      supabase
        .from("withdrawal_batches")
        .update({ utr_number: utr, status: "success" as WStatus, completed_at: now })
        .eq("id", batch.id),
      supabase
        .from("withdrawals")
        .update({ utr_number: utr, status: "success" as WStatus, completed_at: now })
        .eq("batch_id", batch.id),
    ]);
    if (r1.error || r2.error) toast.error(r1.error?.message || r2.error?.message || "Failed");
    else {
      toast.success(`Batch "${batch.name}" marked successful`);
      setUtrInputs((s) => ({ ...s, [batch.id]: "" }));
      fetchAll();
    }
  };

  // === Bank edit ===
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
    const [r1, r2] = await Promise.all([
      supabase.from("withdrawals").update(bankEdit).eq("id", editing.id),
      supabase.from("profiles").update(bankEdit).eq("user_id", editing.user_id),
    ]);
    if (r1.error || r2.error) toast.error(r1.error?.message || r2.error?.message || "Failed");
    else {
      toast.success("Bank details updated");
      setEditing(null);
      fetchAll();
    }
  };

  // ====== UI ======
  const renderBankCell = (w: any) =>
    w.bank_account_number ? (
      <div className="space-y-0.5 text-xs">
        <p className="font-medium">{w.bank_account_holder}</p>
        <p className="text-muted-foreground">{w.bank_name}</p>
        <p className="font-mono">A/C {w.bank_account_number}</p>
        <p className="font-mono">{w.bank_ifsc_code}</p>
      </div>
    ) : (
      <span className="text-muted-foreground italic text-xs">—</span>
    );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="pending" className="gap-2">
              1. Pending
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {pending.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="gap-2">
              2. Processing
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {processingBatches.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="success" className="gap-2">
              3. Success
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {successBatches.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Pending — select + assign batch */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
                <p className="text-sm text-muted-foreground flex-1">
                  {selectedIds.length} selected ·{" "}
                  ₹{pending
                    .filter((w) => selected[w.id])
                    .reduce((s, w) => s + Number(w.amount), 0)
                    .toFixed(2)}{" "}
                  total
                </p>
                <Button onClick={openBatchDialog} disabled={!selectedIds.length} className="gap-1">
                  Assign Batch & Next <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => handleReject(selectedIds)}
                  disabled={!selectedIds.length}
                >
                  Reject Selected
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : pending.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <Checkbox
                              checked={!!selected[w.id]}
                              onCheckedChange={(v) =>
                                setSelected((s) => ({ ...s, [w.id]: !!v }))
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {w.user_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{Number(w.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{renderBankCell(w)}</TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(w.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end flex-wrap">
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => openBankEdit(w)}>
                                <Pencil className="h-3 w-3" /> Bank
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleReject([w.id])}>
                                <X className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Processing — per-batch download + UTR */}
          <TabsContent value="processing" className="space-y-4">
            {loading ? (
              <Card><CardContent className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
              </CardContent></Card>
            ) : processingBatches.length === 0 ? (
              <Card><CardContent className="text-center text-muted-foreground py-8">
                No batches in processing
              </CardContent></Card>
            ) : (
              processingBatches.map((batch) => {
                const rows = withdrawalsByBatch[batch.id] || [];
                return (
                  <Card key={batch.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-base">{batch.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {batch.total_count} requests · ₹{Number(batch.total_amount).toFixed(2)} ·
                            Created {format(new Date(batch.created_at), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                        <Button variant="outline" className="gap-2" onClick={() => downloadBatchExcel(batch)}>
                          <Download className="h-4 w-4" /> Download Payout Excel
                        </Button>
                      </div>

                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Bank</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((w) => (
                              <TableRow key={w.id}>
                                <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}…</TableCell>
                                <TableCell className="font-medium">₹{Number(w.amount).toFixed(2)}</TableCell>
                                <TableCell>{renderBankCell(w)}</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openBankEdit(w)}>
                                    <Pencil className="h-3 w-3" /> Bank
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 md:items-center pt-2 border-t">
                        <p className="text-sm text-muted-foreground flex-1">
                          After bank payout, enter UTR and mark batch successful:
                        </p>
                        <Input
                          placeholder="UTR / Reference Number"
                          value={utrInputs[batch.id] || ""}
                          onChange={(e) =>
                            setUtrInputs((s) => ({ ...s, [batch.id]: e.target.value }))
                          }
                          className="md:max-w-xs"
                        />
                        <Button
                          onClick={() => markBatchSuccess(batch)}
                          disabled={!(utrInputs[batch.id] || "").trim()}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" /> Mark Success
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Tab 3: Success */}
          <TabsContent value="success" className="space-y-4">
            {loading ? (
              <Card><CardContent className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
              </CardContent></Card>
            ) : successBatches.length === 0 ? (
              <Card><CardContent className="text-center text-muted-foreground py-8">
                No completed batches yet
              </CardContent></Card>
            ) : (
              successBatches.map((batch) => {
                const rows = withdrawalsByBatch[batch.id] || [];
                return (
                  <Card key={batch.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            {batch.name}
                            <Badge className={statusColor("success")}>Success</Badge>
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {batch.total_count} requests · ₹{Number(batch.total_amount).toFixed(2)} ·
                            UTR <span className="font-mono">{batch.utr_number}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Completed{" "}
                            {batch.completed_at
                              ? format(new Date(batch.completed_at), "dd MMM yyyy, hh:mm a")
                              : "—"}
                          </p>
                        </div>
                        <Button variant="outline" className="gap-2" onClick={() => downloadBatchExcel(batch)}>
                          <Download className="h-4 w-4" /> Re-download Excel
                        </Button>
                      </div>

                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Bank</TableHead>
                              <TableHead>UTR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((w) => (
                              <TableRow key={w.id}>
                                <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}…</TableCell>
                                <TableCell className="font-medium">₹{Number(w.amount).toFixed(2)}</TableCell>
                                <TableCell>{renderBankCell(w)}</TableCell>
                                <TableCell className="font-mono text-xs">{w.utr_number}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign batch dialog */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Batch Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} requests · ₹
              {pending
                .filter((w) => selected[w.id])
                .reduce((s, w) => s + Number(w.amount), 0)
                .toFixed(2)}{" "}
              total will be moved to Processing.
            </p>
            <Input
              placeholder="Batch name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={creatingBatch || !batchName.trim()}>
              {creatingBatch ? "Creating..." : "Create Batch & Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
