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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
