import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";

// Lazy load all non-homepage routes
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

const SchemeDetail = lazy(() => import("./pages/SchemeDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const Withdrawals = lazy(() => import("./pages/Withdrawals"));
const Subscription = lazy(() => import("./pages/Subscription"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSchemes = lazy(() => import("./pages/admin/AdminSchemes"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const CreateReport = lazy(() => import("./pages/CreateReport"));
const AIReportGenerator = lazy(() => import("./pages/AIReportGenerator"));
const MockInterview = lazy(() => import("./pages/MockInterview"));
const LiveHRInterview = lazy(() => import("./pages/LiveHRInterview"));
const AITools = lazy(() => import("./pages/AITools"));
const StudentTool = lazy(() => import("./pages/StudentTool"));
const AIToolLanding = lazy(() => import("./pages/AIToolLanding"));
const Install = lazy(() => import("./pages/Install"));
const CareerProgram = lazy(() => import("./pages/CareerProgram"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminCareer = lazy(() => import("./pages/admin/AdminCareer"));
const EmpDashboard = lazy(() => import("./pages/EmpDashboard"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Investors = lazy(() => import("./pages/Investors"));
const Faq = lazy(() => import("./pages/Faq"));

const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/plans" element={<Navigate to="/subscription" replace />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/scheme/:slug" element={<SchemeDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/earnings" element={<Navigate to="/dashboard" replace />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/schemes" element={<AdminSchemes />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/create-report" element={<CreateReport />} />
              <Route path="/ai-report" element={<AIReportGenerator />} />
              <Route path="/mock-interview" element={<MockInterview />} />
              <Route path="/live-hr-interview" element={<LiveHRInterview />} />
              <Route path="/ai-tools" element={<AITools />} />
              <Route path="/student-tool/:slug" element={<StudentTool />} />
              <Route path="/ai/:slug" element={<AIToolLanding />} />
              <Route path="/install" element={<Install />} />
              <Route path="/career-program" element={<CareerProgram />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin/career" element={<AdminCareer />} />
              <Route path="/emp" element={<EmpDashboard />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/faq" element={<Faq />} />

              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/admin/blogs" element={<AdminBlogs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
