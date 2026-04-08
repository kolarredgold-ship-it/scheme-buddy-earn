import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield } from "lucide-react";

const BENEFITS = [
  "Full access to all government scheme details",
  "Direct apply links for all schemes",
  "Eligibility criteria & required documents",
  "Priority notifications for new schemes",
  "Refer & earn up to ₹400 per referral",
  "3-level referral earning system",
  "Get AI Internship Report Generator",
  "Get AI Interview Training App Access",
  "Get AI HR Mock Interview Training Access",
  "Get AI Based Interview Q&A - Flash Cards",
];

const Plans = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold">
            <Star className="h-3 w-3 mr-1" /> LIMITED TIME OFFER
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm">Unlock all features with TechRola Premium</p>
        </div>

        <Card className="border-2 border-primary shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
            BEST VALUE
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Premium Plan</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Lifetime access to all features</p>

            {/* Pricing */}
            <div className="bg-muted/50 rounded-xl p-4 mb-5 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg text-muted-foreground line-through">₹2,999</span>
                <span className="text-4xl font-extrabold text-primary">₹999</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One-time payment • Lifetime access</p>
              <div className="mt-3 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-primary">
                  💡 Don't have a referral code? Use <span className="font-bold">WELCOME</span> and get ₹2000 discount!
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2.5 mb-6">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" /> What you get:
              </h3>
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/signup">
              <Button className="w-full h-12 text-base font-bold" size="lg">
                Continue to Sign Up →
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Plans;
