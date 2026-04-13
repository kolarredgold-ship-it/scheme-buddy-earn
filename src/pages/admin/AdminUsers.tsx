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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Crown, Pencil, Eye, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  referral_code: string;
  referred_by: string | null;
  subscription_status: "free" | "active" | "expired";
  wallet_balance: number;
  report_credits: number;
  created_at: string;
}

const AdminUsers = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [viewUser, setViewUser] = useState<UserProfile | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    subscription_status: "free" as "free" | "active" | "expired",
    wallet_balance: 0,
    report_credits: 0,
  });

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const makePro = async (user: UserProfile) => {
    setUpdating(user.user_id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-update-user", {
        body: { action: "make_pro", userId: user.user_id },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || "Failed");
      }
      const price = res.data?.price || 999;
      toast.success(`User upgraded to Pro (₹${price}) with referral earnings distributed`);
      await fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to make pro");
    }
    setUpdating(null);
  };

  const revokePro = async (userId: string) => {
    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "free" })
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to revoke");
    } else {
      toast.success("User set to Free");
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, subscription_status: "free" } : u));
    }
    setUpdating(null);
  };

  const changePassword = async () => {
    if (!passwordUser || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setUpdating(passwordUser.user_id);
    try {
      const res = await supabase.functions.invoke("admin-update-user", {
        body: { action: "change_password", userId: passwordUser.user_id, password: newPassword },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || "Failed");
      }
      toast.success("Password changed successfully");
      setPasswordUser(null);
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message || "Failed to change password");
    }
    setUpdating(null);
  };

  const openEdit = (user: UserProfile) => {
    setEditUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      subscription_status: user.subscription_status,
      wallet_balance: Number(user.wallet_balance),
      report_credits: user.report_credits,
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setUpdating(editUser.user_id);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editForm.name || null,
        email: editForm.email || null,
        mobile: editForm.mobile || null,
        subscription_status: editForm.subscription_status,
        wallet_balance: editForm.wallet_balance,
        report_credits: editForm.report_credits,
      })
      .eq("user_id", editUser.user_id);
    if (error) {
      toast.error("Failed to update user");
    } else {
      toast.success("User updated successfully");
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === editUser.user_id
            ? { ...u, ...editForm, name: editForm.name || null, email: editForm.email || null, mobile: editForm.mobile || null }
            : u
        )
      );
      setEditUser(null);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Badge variant="secondary">{users.length} users</Badge>
        </div>

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
                    <TableHead className="hidden lg:table-cell">Mobile</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                     <TableHead className="hidden md:table-cell text-right">Credits</TableHead>
                     <TableHead className="hidden lg:table-cell">Joined</TableHead>
                     <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{u.email || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{u.mobile || "—"}</TableCell>
                      <TableCell><code className="text-xs">{u.referral_code}</code></TableCell>
                      <TableCell>
                        <Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className={u.subscription_status === "active" ? "bg-secondary text-secondary-foreground" : ""}>
                          {u.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{Number(u.wallet_balance).toFixed(2)}</TableCell>
                       <TableCell className="hidden md:table-cell text-right">{u.report_credits}</TableCell>
                       <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                       <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setViewUser(u)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(u)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { setPasswordUser(u); setNewPassword(""); }} title="Change Password">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {u.subscription_status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updating === u.user_id}
                              onClick={() => revokePro(u.user_id)}
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updating === u.user_id}
                              onClick={() => makePro(u)}
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Pro
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> <strong>{viewUser.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{viewUser.email || "—"}</strong></div>
                <div><span className="text-muted-foreground">Mobile:</span> <strong>{viewUser.mobile || "—"}</strong></div>
                <div><span className="text-muted-foreground">Referral Code:</span> <strong>{viewUser.referral_code}</strong></div>
                <div><span className="text-muted-foreground">Referred By:</span> <strong>{viewUser.referred_by || "—"}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={viewUser.subscription_status === "active" ? "default" : "secondary"}>{viewUser.subscription_status}</Badge></div>
                <div><span className="text-muted-foreground">Wallet:</span> <strong>₹{Number(viewUser.wallet_balance).toFixed(2)}</strong></div>
                <div><span className="text-muted-foreground">Report Credits:</span> <strong>{viewUser.report_credits}</strong></div>
                <div className="col-span-2"><span className="text-muted-foreground">Joined:</span> <strong>{new Date(viewUser.created_at).toLocaleDateString()}</strong></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
            </div>
            <div>
              <Label>Subscription Status</Label>
              <Select value={editForm.subscription_status} onValueChange={(v) => setEditForm({ ...editForm, subscription_status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="active">Active (Pro)</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Wallet Balance (₹)</Label>
                <Input type="number" value={editForm.wallet_balance} onChange={(e) => setEditForm({ ...editForm, wallet_balance: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Report Credits</Label>
                <Input type="number" value={editForm.report_credits} onChange={(e) => setEditForm({ ...editForm, report_credits: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updating === editUser?.user_id}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordUser} onOpenChange={() => setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password for {passwordUser?.name || passwordUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordUser(null)}>Cancel</Button>
            <Button onClick={changePassword} disabled={updating === passwordUser?.user_id || newPassword.length < 6}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminUsers;
