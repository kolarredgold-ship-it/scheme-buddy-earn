import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, HelpCircle, Mail, Phone, MapPin } from "lucide-react";

const PrivacyPolicy = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" /> Privacy Policy
      </h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p>Last updated: April 2026</p>
        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect personal information like name, email, phone number, and payment details when you register or subscribe to TechRola.</p>
        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>Your information is used to provide access to government schemes, process payments via Airpay, manage referral earnings, and improve our services.</p>
        <h2 className="text-lg font-semibold text-foreground">3. Payment Security</h2>
        <p>All payments are processed securely through Airpay payment gateway using AES-256-CBC encryption. We do not store your card details.</p>
        <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
        <p>We do not sell your personal data to third parties. Data may be shared with payment processors (Airpay) for transaction processing.</p>
        <h2 className="text-lg font-semibold text-foreground">5. Contact Us</h2>
        <p>For any privacy concerns, contact us at omlaytechnologies@gmail.com or call 7899666679. Address: Bengaluru, India.</p>
      </div>
    </div>
  </Layout>
);

export default PrivacyPolicy;
