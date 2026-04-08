import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SchemeDetail from "./pages/SchemeDetail";
import Dashboard from "./pages/Dashboard";
import Earnings from "./pages/Earnings";
import Withdrawals from "./pages/Withdrawals";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSchemes from "./pages/admin/AdminSchemes";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import CreateReport from "./pages/CreateReport";
import AIReportGenerator from "./pages/AIReportGenerator";
import MockInterview from "./pages/MockInterview";
import Install from "./pages/Install";
import PaymentStatus from "./pages/PaymentStatus";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      const timer = setTimeout(() => {
        splash.style.opacity = "0";
        setTimeout(() => splash.remove(), 400);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/scheme/:id" element={<SchemeDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/withdrawals" element={<Withdrawals />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/schemes" element={<AdminSchemes />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/create-report" element={<CreateReport />} />
            <Route path="/ai-report" element={<AIReportGenerator />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/install" element={<Install />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
