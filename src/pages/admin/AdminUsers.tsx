import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Crown } from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const toggleSubscription = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "free" : "active";
    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: newStatus })
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`User ${newStatus === "active" ? "upgraded to Pro" : "set to Free"}`);
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, subscription_status: newStatus } : u));
    }
    setUpdating(null);
  };

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" />;

  const filtered = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or code..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                      <TableCell><code className="text-xs">{u.referral_code}</code></TableCell>
                      <TableCell>
                        <Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className={u.subscription_status === "active" ? "bg-secondary text-secondary-foreground" : ""}>
                          {u.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{Number(u.wallet_balance).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={u.subscription_status === "active" ? "outline" : "default"}
                          disabled={updating === u.user_id}
                          onClick={() => toggleSubscription(u.user_id, u.subscription_status)}
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          {u.subscription_status === "active" ? "Revoke" : "Make Pro"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminUsers;
