import Layout from "@/components/Layout";
import { FileText } from "lucide-react";

const TermsConditions = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" /> Terms & Conditions
      </h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p>Last updated: April 2026</p>
        <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By using Techrola, you agree to these terms and conditions. If you do not agree, please do not use our services.</p>
        <h2 className="text-lg font-semibold text-foreground">2. Subscription</h2>
        <p>Premium subscription is a one-time lifetime payment of ₹83.25 per month, billed annually as ₹999 (with referral/promo code) or ₹249.92 per month, billed annually as ₹2,999 (without discount). This is non-refundable once activated.</p>
        <h2 className="text-lg font-semibold text-foreground">3. Referral Program</h2>
        <p>Users can earn through our 3-level referral system: ₹400 (Level 1), ₹100 (Level 2), ₹50 (Level 3) per successful referral subscription.</p>
        <h2 className="text-lg font-semibold text-foreground">4. Content Accuracy</h2>
        <p>While we strive to provide accurate scheme information, Techrola is not responsible for changes in government policies. Always verify with official sources.</p>
        <h2 className="text-lg font-semibold text-foreground">5. Account Responsibility</h2>
        <p>You are responsible for maintaining the security of your account credentials.</p>
        <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
        <p>All content, design, and features of Techrola are protected by copyright and intellectual property laws.</p>
      </div>
    </div>
  </Layout>
);

export default TermsConditions;
