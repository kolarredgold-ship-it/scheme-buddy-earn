import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  const message = searchParams.get("message");

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-border/40">
          <CardContent className="p-8 text-center">
            {isSuccess ? (
              <>
                <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-secondary">Payment Successful!</h1>
                <p className="text-muted-foreground mb-4">
                  Your premium subscription is now active. Enjoy full access to all schemes and features.
                </p>
                {transactionId && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Transaction ID: <span className="font-mono font-medium">{transactionId}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Link to="/">
                    <Button className="w-full gap-2">
                      Browse Schemes <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full">Go to Dashboard</Button>
                  </Link>
                </div>
              </>
            ) : isFailed ? (
              <>
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-destructive">Payment Failed</h1>
                <p className="text-muted-foreground mb-4">
                  {message || "Your payment could not be processed. Please try again."}
                </p>
                {orderId && (
                  <p className="text-xs text-muted-foreground mb-6">
                    Order ID: <span className="font-mono font-medium">{orderId}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Link to="/subscription">
                    <Button className="w-full">Try Again</Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" className="w-full">Go Home</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-accent-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Payment Status Unknown</h1>
                <p className="text-muted-foreground mb-4">
                  {message || "We couldn't determine the payment status. Please check your dashboard."}
                </p>
                <div className="space-y-2">
                  <Link to="/dashboard">
                    <Button className="w-full">Check Dashboard</Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" className="w-full">Go Home</Button>
                  </Link>
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
