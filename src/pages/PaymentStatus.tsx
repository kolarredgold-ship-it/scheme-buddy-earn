import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PollStatus = "processing" | "success" | "failed" | "unknown";

interface Receipt {
  orderId: string;
  transactionId: string;
  amount: number;
  status: "success" | "failed";
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~60s total

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();

  const queryStatus = searchParams.get("status");
  const queryOrderId = searchParams.get("orderId");
  const queryTxnId = searchParams.get("transactionId");
  const queryMessage = searchParams.get("message");

  // Recover orderId from localStorage when redirect dropped query params
  let pendingOrderId = queryOrderId || "";
  let pendingAmount = 0;
  try {
    const raw = localStorage.getItem("airpay_pending_order");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!pendingOrderId) pendingOrderId = parsed.orderId;
      pendingAmount = parsed.amount || 0;
    }
  } catch {}

  const [status, setStatus] = useState<PollStatus>(
    queryStatus === "success" ? "success" :
    queryStatus === "failed" ? "failed" :
    pendingOrderId ? "processing" : "unknown"
  );
  const [receipt, setReceipt] = useState<Receipt | null>(
    queryStatus === "success" && queryOrderId ? {
      orderId: queryOrderId,
      transactionId: queryTxnId || "",
      amount: pendingAmount,
      status: "success",
    } : null
  );
  const [pollCount, setPollCount] = useState(0);
  const stoppedRef = useRef(false);

  const checkOnce = async () => {
    if (!user || !pendingOrderId) return false;
    const { data } = await supabase
      .from("transactions")
      .select("source, amount, type, created_at")
      .eq("user_id", user.id)
      .like("source", `Airpay|${pendingOrderId}|%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return false;
    const parts = String(data.source).split("|"); // Airpay|orderId|txnId|status|amount
    const txnId = parts[2] || "";
    const finalStatus = (parts[3] === "success" ? "success" : "failed") as "success" | "failed";
    setReceipt({
      orderId: pendingOrderId,
      transactionId: txnId,
      amount: Number(data.amount) || pendingAmount,
      status: finalStatus,
    });
    setStatus(finalStatus);
    if (finalStatus === "success") {
      try { localStorage.removeItem("airpay_pending_order"); } catch {}
      refreshProfile?.();
    }
    return true;
  };

  useEffect(() => {
    if (status !== "processing" || !user || !pendingOrderId) return;
    stoppedRef.current = false;

    let count = 0;
    const tick = async () => {
      if (stoppedRef.current) return;
      count++;
      setPollCount(count);
      const found = await checkOnce();
      if (found || stoppedRef.current) return;
      if (count >= MAX_POLLS) {
        setStatus("unknown");
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();

    return () => { stoppedRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingOrderId]);

  const recheckNow = async () => {
    setStatus("processing");
    setPollCount(0);
    const found = await checkOnce();
    if (!found) setStatus("unknown");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-border/40">
          <CardContent className="p-8 text-center">
            {status === "processing" && (
              <>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Confirming your payment…</h1>
                <p className="text-muted-foreground mb-2">
                  We're verifying with Airpay. This usually takes a few seconds.
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Order: <span className="font-mono">{pendingOrderId}</span>
                  {pollCount > 0 && <> · Check {pollCount}/{MAX_POLLS}</>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please don't close this page.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-secondary">Payment Successful!</h1>
                <p className="text-muted-foreground mb-4">
                  Your premium subscription is now active.
                </p>
                {receipt && (
                  <div className="text-left bg-muted/40 rounded-lg p-3 mb-6 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">{receipt.orderId.slice(0, 24)}…</span></div>
                    {receipt.transactionId && <div className="flex justify-between"><span className="text-muted-foreground">Txn ID</span><span className="font-mono">{receipt.transactionId}</span></div>}
                    {receipt.amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₹{receipt.amount.toFixed(2)}</span></div>}
                  </div>
                )}
                <div className="space-y-2">
                  <Link to="/"><Button className="w-full gap-2">Browse Schemes <ArrowRight className="h-4 w-4" /></Button></Link>
                  <Link to="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
                </div>
              </>
            )}

            {status === "failed" && (
              <>
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-destructive">Payment Failed</h1>
                <p className="text-muted-foreground mb-4">
                  {queryMessage || "Your payment could not be processed."}
                </p>
                {pendingOrderId && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Order: <span className="font-mono">{pendingOrderId.slice(0, 28)}…</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Link to="/subscription"><Button className="w-full">Try Again</Button></Link>
                  <Link to="/"><Button variant="outline" className="w-full">Go Home</Button></Link>
                </div>
              </>
            )}

            {status === "unknown" && (
              <>
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-accent-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Status Pending</h1>
                <p className="text-muted-foreground mb-4">
                  We haven't received Airpay's confirmation yet. If money was deducted, it will reflect within a few minutes.
                </p>
                {pendingOrderId && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Order: <span className="font-mono">{pendingOrderId.slice(0, 28)}…</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Button className="w-full gap-2" onClick={recheckNow}>
                    <RefreshCw className="h-4 w-4" /> Check again
                  </Button>
                  <Link to="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentStatus;
