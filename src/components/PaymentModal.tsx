import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Upload, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import paymentQrCode from "@/assets/payment-qr.jpg";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  userId: string;
  onSuccess?: () => void;
  paymentType?: "subscription" | "topup" | "report";
  defaultPayerName?: string;
  defaultPayerEmail?: string;
  defaultPayerMobile?: string;
}

const PaymentModal = ({
  isOpen,
  onClose,
  amount,
  userId,
  onSuccess,
  paymentType = "subscription",
  defaultPayerName = "",
  defaultPayerEmail = "",
  defaultPayerMobile = "",
}: PaymentModalProps) => {
  const [step, setStep] = useState<"qr" | "form" | "submitted">("qr");
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    transactionNumber: "",
    payerName: defaultPayerName,
    payerMobile: defaultPayerMobile,
    payerEmail: defaultPayerEmail,
  });

  useEffect(() => {
    if (!isOpen || step !== "qr") return;
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(timer);
          toast.error("Payment timeout. Please try again.");
          onClose();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStep("qr");
      setTimeLeft(300);
      setScreenshotFile(null);
      setFormData({
        transactionNumber: "",
        payerName: defaultPayerName,
        payerMobile: defaultPayerMobile,
        payerEmail: defaultPayerEmail,
      });
    }
  }, [isOpen, defaultPayerName, defaultPayerEmail, defaultPayerMobile]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }
    setScreenshotFile(f);
  };

  const handleSubmit = async () => {
    const { transactionNumber, payerName, payerMobile, payerEmail } = formData;
    if (!transactionNumber || !payerName || !payerMobile || !payerEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!screenshotFile) {
      toast.error("Please upload a payment screenshot.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!/^[0-9]{10}$/.test(payerMobile)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const txn = transactionNumber.trim();
    const { data: dupes } = await supabase
      .from("payments")
      .select("id")
      .ilike("transaction_number", txn)
      .limit(1);
    if (dupes && dupes.length > 0) {
      toast.error("This transaction ID has already been used. Please enter a unique one.");
      return;
    }

    setSubmitting(true);
    try {
      const ext = screenshotFile.name.split(".").pop();
      const path = `${userId}/${paymentType}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, screenshotFile);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("payments").insert({
        user_id: userId,
        amount,
        currency: "INR",
        payment_type: paymentType,
        status: "pending",
        transaction_number: txn,
        payer_name: payerName,
        payer_mobile: payerMobile,
        payer_email: payerEmail,
        screenshot_url: path,
      });
      if (insErr) throw insErr;

      setStep("submitted");
      onSuccess?.();
      toast.success("Payment submitted! Verification within 24 hours.");
    } catch (e: any) {
      console.error("Payment submission error:", e);
      toast.error(e.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "qr" && "Scan & Pay"}
            {step === "form" && "Payment Details"}
            {step === "submitted" && "Payment Submitted"}
          </DialogTitle>
          <DialogDescription>
            {step === "qr" && `Pay ₹${amount.toLocaleString()} using any UPI app`}
            {step === "form" && "Enter your payment details for verification"}
            {step === "submitted" && "Your payment is being verified by our team"}
          </DialogDescription>
        </DialogHeader>

        {step === "qr" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className={`w-5 h-5 ${timeLeft < 60 ? "text-destructive" : "text-primary"}`} />
              <span className={timeLeft < 60 ? "text-destructive" : ""}>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img
                  src={paymentQrCode}
                  alt="UPI payment QR code"
                  className="w-64 h-64 object-contain"
                  width={256}
                  height={256}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">₹{amount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Scan with Google Pay, PhonePe, Paytm or any UPI app
              </p>
            </div>
            <Button className="w-full" onClick={() => setStep("form")}>
              I've Made the Payment
            </Button>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionNumber">Transaction / UTR Number *</Label>
              <Input
                id="transactionNumber"
                name="transactionNumber"
                value={formData.transactionNumber}
                onChange={handleChange}
                placeholder="Enter UPI transaction ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payerName">Your Name *</Label>
              <Input id="payerName" name="payerName" value={formData.payerName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payerMobile">Mobile Number *</Label>
              <Input
                id="payerMobile"
                name="payerMobile"
                value={formData.payerMobile}
                onChange={handleChange}
                maxLength={10}
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payerEmail">Email *</Label>
              <Input
                id="payerEmail"
                name="payerEmail"
                type="email"
                value={formData.payerEmail}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input id="screenshot" type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <label htmlFor="screenshot" className="cursor-pointer">
                  {screenshotFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="truncate max-w-[200px]">{screenshotFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-8 h-8" />
                      <span>Click to upload screenshot</span>
                      <span className="text-xs">Max 5MB, JPG / PNG</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
              <p>Your Pro access will be activated within 24 hours after verification.</p>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Payment Details"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("qr")}>
              Back to QR Code
            </Button>
          </div>
        )}

        {step === "submitted" && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Payment Under Review</h3>
              <p className="text-muted-foreground text-sm">
                Your payment of ₹{amount.toLocaleString()} is being verified. Pro access activates once approved.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Status: <span className="text-accent-foreground">Waiting for Verification</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const msg = `Hi, I just submitted my Techrola Pro payment of ₹${amount}.%0ATxn: ${formData.transactionNumber}%0AName: ${formData.payerName}`;
                window.open(`https://wa.me/919999999999?text=${msg}`, "_blank");
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Notify on WhatsApp
            </Button>
            <Button className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
