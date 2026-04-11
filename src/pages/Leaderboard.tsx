import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Flame, TrendingUp, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  total_promotions: number;
  streak_days: number;
  total_active_days: number;
  name: string | null;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Fetch top career_progress entries
      const { data: progressData } = await supabase
        .from("career_progress")
        .select("user_id, total_promotions, streak_days, total_active_days")
        .order("total_promotions", { ascending: false })
        .limit(50);

      if (!progressData || progressData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch names from profiles
      const userIds = progressData.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      
      setEntries(progressData.map(p => ({
        ...p,
        name: nameMap.get(p.user_id) || "Anonymous",
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const getMedal = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        <div className="text-center mb-6">
          <Badge className="mb-3 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Trophy className="h-3 w-3 mr-1" /> Leaderboard
          </Badge>
          <h1 className="text-2xl font-extrabold mb-1">Top Performers</h1>
          <p className="text-sm text-muted-foreground">Ranked by promotions, consistency & activity</p>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">No participants yet. Be the first!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <Card key={entry.user_id} className={`transition-all ${isCurrentUser ? "border-primary ring-1 ring-primary/20 bg-primary/5" : ""}`}>
                  <CardContent className="p-3 md:p-4 flex items-center gap-3">
                    <div className="w-8 flex justify-center shrink-0">{getMedal(i)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {entry.name}
                        {isCurrentUser && <Badge className="ml-2 text-[10px] bg-primary">You</Badge>}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{entry.total_promotions} promos</span>
                        <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" />{entry.streak_days} streak</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">{entry.total_promotions}</p>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
