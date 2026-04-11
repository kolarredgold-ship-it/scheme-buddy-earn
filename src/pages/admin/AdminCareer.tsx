import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, CreditCard, Megaphone, Award, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

interface CareerUser {
  user_id: string;
  registered: boolean;
  course: string | null;
  college: string | null;
  current_step: number;
  total_promotions: number;
  streak_days: number;
  eligible: boolean;
  name: string | null;
  subscription_status: string | null;
  referral_code: string | null;
}

interface HiringApp {
  id: string;
  user_id: string;
  application_type: string;
  status: string;
  created_at: string;
  name: string | null;
}

const AdminCareer = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<CareerUser[]>([]);
  const [applications, setApplications] = useState<HiringApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => {
      const { data: progress } = await supabase.from("career_progress").select("*");
      const { data: apps } = await supabase.from("hiring_applications").select("*").order("created_at", { ascending: false });

      if (progress) {
        const uids = progress.map(p => p.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, name, subscription_status, referral_code").in("user_id", uids);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        setUsers(progress.map(p => ({
          ...p,
          name: profileMap.get(p.user_id)?.name || null,
          subscription_status: profileMap.get(p.user_id)?.subscription_status || null,
          referral_code: profileMap.get(p.user_id)?.referral_code || null,
        })) as CareerUser[]);
      }

      if (apps) {
        const appUids = [...new Set(apps.map(a => a.user_id))];
        const { data: appProfiles } = await supabase.from("profiles").select("user_id, name").in("user_id", appUids);
        const nameMap = new Map(appProfiles?.map(p => [p.user_id, p.name]) || []);
        setApplications(apps.map(a => ({ ...a, name: nameMap.get(a.user_id) || null })) as HiringApp[]);
      }
      setLoading(false);
    };
    fetch();
  }, [isAdmin]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const registered = users.filter(u => u.registered).length;
  const subscribed = users.filter(u => u.subscription_status === "active").length;
  const promoting = users.filter(u => u.total_promotions > 0).length;
  const eligible = users.filter(u => u.eligible).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-4">Career Program — Admin</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={UserPlus} label="Registered" value={registered} />
          <StatCard icon={CreditCard} label="Subscribed" value={subscribed} />
          <StatCard icon={Megaphone} label="Promoting" value={promoting} />
          <StatCard icon={Award} label="Eligible" value={eligible} />
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">All Users ({users.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
              <div className="space-y-2">
                {users.map(u => (
                  <Card key={u.user_id}>
                    <CardContent className="p-3 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-semibold">{u.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{u.college} • {u.course}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Step {u.current_step}</Badge>
                      <Badge variant={u.subscription_status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {u.subscription_status === "active" ? "Pro" : "Free"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{u.referral_code}</span>
                      <span className="text-xs">{u.total_promotions} promos</span>
                      {u.eligible && <Badge className="bg-secondary text-[10px]">Eligible</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {applications.map(a => (
                  <Card key={a.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline">{a.application_type}</Badge>
                      <Badge variant={a.status === "pending" ? "secondary" : "default"}>{a.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 text-center">
      <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default AdminCareer;
