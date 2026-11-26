import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { canPurchaseTopup } from '@/lib/topupAccess';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Props {
  amount: number; // in INR rupees
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  userId?: string;
  paymentType?: "subscription" | "report_credits" | string;
  onSuccess?: (payload: { payment_id: string; order_id: string }) => void;
  onFailure?: (err: any) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  receipt,
  name = "Smartlio",
  description = "Payment",
  prefill,
  userId,
  paymentType = "subscription",
  onSuccess,
  onFailure,
  children,
  className,
}: Props) {

  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handlePay = async () => {
    if (['topup', 'ai_topup', 'report_credits'].includes(paymentType) && (!user || !canPurchaseTopup(profile))) {
      toast.info('Activate Pro for ₹999 before purchasing credit top-ups.');
      navigate(user ? '/subscription' : '/login?redirect=/subscription');
      return;
    }
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Razorpay SDK failed to load");

      const { data: order, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { amount: Math.round(amount * 100), currency, receipt, payment_type: paymentType },
      });
      if (error || !order?.order_id) {
        let msg = error?.message || "Failed to create order";
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) msg = body.error === "Authentication failed" ? "Payment gateway is not set up correctly. Please contact support." : body.error;
        } catch { /* keep default */ }
        throw new Error(msg);
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name,
        description,
        order_id: order.order_id,
        prefill,
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          const { data: verify, error: vErr } = await supabase.functions.invoke(
            "razorpay-verify-payment",
            {
              body: {
                ...response,
                user_id: userId,
                amount,
                payment_type: paymentType,
                payer_name: prefill?.name,
                payer_email: prefill?.email,
                payer_mobile: prefill?.contact,
              },
            }
          );
          if (vErr || !verify?.success) {
            toast.error("Payment verification failed");
            onFailure?.(vErr || verify);
            return;
          }
          toast.success("Payment successful — access unlocked!");
          void trackEvent("payment_completed", paymentType);
          onSuccess?.({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
          });
        },

        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
          },
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
        onFailure?.(resp?.error);
      });

      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "Unable to start payment");
      onFailure?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePay} disabled={loading} className={className}>
      {loading ? "Loading..." : children || `Pay ₹${amount}`}
    </Button>
  );
}
