import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Wallet, Clock, IndianRupee } from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ users: 0, schemes: 0, pendingWithdrawals: 0, paidUsers: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => {
      const [users, schemes, withdrawals, paid, pendingPay] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("schemes").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        users: users.count || 0,
        schemes: schemes.count || 0,
        pendingWithdrawals: withdrawals.count || 0,
        paidUsers: paid.count || 0,
        pendingPayments: pendingPay.count || 0,
      });
      setLoading(false);
    };
    fetch();
  }, [isAdmin]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" />;

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary", link: "/admin/users" },
    { label: "Paid Users", value: stats.paidUsers, icon: Users, color: "text-secondary", link: "/admin/users" },
    { label: "Pending Payments", value: stats.pendingPayments, icon: IndianRupee, color: "text-accent-foreground", link: "/admin/payments" },
    { label: "Total Schemes", value: stats.schemes, icon: BookOpen, color: "text-accent", link: "/admin/schemes" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Clock, color: "text-destructive", link: "/admin/withdrawals" },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link key={c.label} to={c.link}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <c.icon className={`h-8 w-8 ${c.color} mb-2`} />
                  <p className="text-2xl font-bold">{loading ? "..." : c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <Link to="/admin/schemes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="font-semibold">Manage Schemes</p>
            </Card>
          </Link>
          <Link to="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-secondary mb-2" />
              <p className="font-semibold">Manage Users</p>
            </Card>
          </Link>
          <Link to="/admin/withdrawals">
            <Card className="hover:shadow-md transition-shadow cursor-pointer p-6 text-center">
              <Wallet className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="font-semibold">Manage Withdrawals</p>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
