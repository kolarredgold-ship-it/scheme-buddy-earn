import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, CreditCard, Sparkles, Lock } from "lucide-react";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function TopupDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open && !loading && !user) {
      toast.error("Please sign in to purchase AI credits");
    }
  }, [open, loading, user]);

  const redirectParam = encodeURIComponent(location.pathname + location.search);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Top-up AI Credits
          </DialogTitle>
          <DialogDescription>
            Instantly unlock 3 more AI generations across every Techrola tool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-extrabold text-primary">₹499</p>
            <p className="text-sm text-muted-foreground mt-1">Premium AI Top-Up add-on</p>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Internship Report Generator: <b>+3 generations</b></li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Every other AI tool: <b>+5 generations each</b></li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Added instantly on top of your current balance</li>
            <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Available only for Premium members</li>
          </ul>
          {user ? (
            <RazorpayCheckoutButton
              amount={499}
              userId={user.id}
              paymentType="topup"
              description="Techrola AI Credits Top-up (+3 generations)"
              prefill={{
                name: profile?.name || "",
                email: profile?.email || user.email || "",
                contact: (profile?.mobile || "").replace(/\D/g, "").slice(-10),
              }}
              className="w-full"
              onSuccess={async () => {
                await refreshProfile();
                onSuccess?.();
                onOpenChange(false);
              }}
            >
              Pay ₹499 with Razorpay
            </RazorpayCheckoutButton>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
