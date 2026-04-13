import Layout from "@/components/Layout";
import { RotateCcw } from "lucide-react";

const RefundPolicy = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <RotateCcw className="h-6 w-6 text-primary" /> Refund & Cancellation Policy
      </h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p>Last updated: April 2026</p>
        <h2 className="text-lg font-semibold text-foreground">1. Refund Policy</h2>
        <p>Since Techrola offers digital content and lifetime access to government scheme information, all payments are non-refundable once the subscription is activated.</p>
        <h2 className="text-lg font-semibold text-foreground">2. Payment Failures</h2>
        <p>If your payment was deducted but subscription was not activated, please contact us at omlaytechnologies@gmail.com or call 7899666679 with your transaction ID. We will resolve it within 48 hours.</p>
        <h2 className="text-lg font-semibold text-foreground">3. Cancellation</h2>
        <p>Since this is a lifetime subscription, there is no recurring charge and hence no cancellation needed. Your access remains active indefinitely.</p>
        <h2 className="text-lg font-semibold text-foreground">4. Contact for Disputes</h2>
        <p>For any payment-related disputes, reach out to omlaytechnologies@gmail.com or call 7899666679.</p>
      </div>
    </div>
  </Layout>
);

export default RefundPolicy;
