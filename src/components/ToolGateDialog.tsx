import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { GateReason } from "@/hooks/useToolCredits";

interface Props {
  reason: GateReason;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
  onTopup?: () => void;
}

/**
 * Shared gate popup for every AI tool. Handles the three blocked states:
 * - guest → prompt sign up / login
 * - upgrade → free-limit reached, push to /subscription
 * - limit_reached → premium quota exhausted, offer ₹499 top-up
 */
export default function ToolGateDialog({ reason, onOpenChange, onUpgrade, onTopup }: Props) {
  const navigate = useNavigate();
  const open = !!reason;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {reason === "guest" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" /> 🚀 Create Your Free Account
              </DialogTitle>
              <DialogDescription>
                Sign up to unlock your free AI generation and start using Techrola AI tools.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </DialogFooter>
          </>
        )}

        {reason === "upgrade" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" /> 🔒 Free Limit Reached
              </DialogTitle>
              <DialogDescription>
                Upgrade to Premium to continue using this AI tool. You'll get 3 generations for every AI tool plus full access to Government Schemes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => (onUpgrade ? onUpgrade() : navigate("/subscription"))}
              >
                Upgrade to Premium
              </Button>
            </DialogFooter>
          </>
        )}

        {reason === "limit_reached" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Premium Limit Reached
              </DialogTitle>
              <DialogDescription>
                You've used all your generations for this tool. Buy the ₹499 AI Top-Up to get more generations across every AI tool.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => (onTopup ? onTopup() : onOpenChange(false))}
              >
                Buy ₹499 AI Top-Up
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
