import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Eye, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type: string;
  transaction_number: string | null;
  payer_name: string | null;
  payer_mobile: string | null;
  payer_email: string | null;
  screenshot_url: string | null;
  admin_note: string | null;
  created_at: string;
  verified_at: string | null;
}

const AdminPayments = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loadingShot, setLoadingShot] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load payments");
    else setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchPayments();
  }, [isAdmin]);

  const openPayment = async (p: Payment) => {
    setSelected(p);
    setAdminNote(p.admin_note || "");
    setScreenshotUrl(null);
    if (p.screenshot_url) {
      setLoadingShot(true);
      const { data, error } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(p.screenshot_url, 3600);
      if (!error && data) setScreenshotUrl(data.signedUrl);
      setLoadingShot(false);
    }
  };

  const updateStatus = async (status: "verified" | "rejected") => {
    if (!selected) return;
    setProcessing(selected.id);
    const { error } = await supabase
      .from("payments")
      .update({ status, admin_note: adminNote || null, verified_by: user?.id })
      .eq("id", selected.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(status === "verified" ? "Payment verified — Pro activated" : "Payment rejected");
      setSelected(null);
      fetchPayments();
    }
    setProcessing(null);
  };

  if (authLoading)
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  if (!isAdmin) return <Navigate to="/" />;

  // Duplicate transaction detection
  const txnCounts = new Map<string, number>();
  payments.forEach((p) => {
    if (p.transaction_number) {
      const k = p.transaction_number.trim().toLowerCase();
      txnCounts.set(k, (txnCounts.get(k) || 0) + 1);
    }
  });

  const pending = payments.filter((p) => p.status === "pending");
  const verified = payments.filter((p) => p.status === "verified");
  const rejected = payments.filter((p) => p.status === "rejected");

  const renderTable = (rows: Payment[]) => (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Txn / UTR</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No payments
              </TableCell>
            </TableRow>
          ) : (
            rows.map((p) => {
              const isDup =
                p.transaction_number &&
                (txnCounts.get(p.transaction_number.trim().toLowerCase()) || 0) > 1;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.payer_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.payer_email}</div>
                    <div className="text-xs text-muted-foreground">{p.payer_mobile}</div>
                  </TableCell>
                  <TableCell className="font-semibold">₹{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1">
                      {p.transaction_number || "—"}
                      {isDup && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "verified" ? "default" : p.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openPayment(p)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Payment Approvals</h1>
          <Button size="sm" variant="outline" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-accent-foreground">{pending.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold text-secondary">{verified.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-destructive">{rejected.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({verified.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">{renderTable(pending)}</TabsContent>
          <TabsContent value="verified">{renderTable(verified)}</TabsContent>
          <TabsContent value="rejected">{renderTable(rejected)}</TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Review and approve or reject this payment</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Payer Name</p>
                  <p className="font-medium">{selected.payer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{Number(selected.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selected.payer_mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{selected.payer_email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Transaction / UTR</p>
                  <p className="font-mono font-medium">{selected.transaction_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selected.status === "verified"
                        ? "default"
                        : selected.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {selected.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Screenshot</Label>
                {loadingShot ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : screenshotUrl ? (
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={screenshotUrl}
                      alt="Payment screenshot"
                      className="w-full max-h-96 object-contain border rounded-lg bg-muted"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No screenshot uploaded</p>
                )}
              </div>

              {selected.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="adminNote">Admin Note (optional)</Label>
                    <Input
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Optional reason or remark"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus("rejected")}
                      disabled={!!processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => updateStatus("verified")} disabled={!!processing}>
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Verify & Activate Pro
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {selected.admin_note && selected.status !== "pending" && (
                <div className="bg-muted/40 rounded p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Admin Note</p>
                  <p>{selected.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminPayments;
