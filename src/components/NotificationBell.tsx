import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  scheme_id: string | null;
  state: string;
  category: string;
  title: string;
  message: string;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [preferredState, setPreferredState] = useState<string | null>(null);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  // Load user preferences to filter notifications
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("preferred_state, preferred_categories")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPreferredState(data.preferred_state);
        setPreferredCategories((data.preferred_categories as string[]) || []);
      }
    };
    load();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      let query = supabase
        .from("scheme_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Filter by user's preferred state if set
      if (preferredState && preferredState !== "all") {
        query = query.eq("state", preferredState);
      }

      const { data } = await query;
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("scheme-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scheme_notifications" }, (payload) => {
        const newNotif = payload.new as Notification;
        // Only show if matches preferences
        if (preferredState && preferredState !== "all" && newNotif.state !== preferredState) return;
        if (preferredCategories.length > 0 && !preferredCategories.includes(newNotif.category)) return;
        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [preferredState, preferredCategories]);

  const filteredNotifications = preferredCategories.length > 0
    ? notifications.filter(n => preferredCategories.includes(n.category))
    : notifications;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
          <Bell className="h-4.5 w-4.5" />
          {filteredNotifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
              {Math.min(filteredNotifications.length, 9)}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Scheme Updates
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh]">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No new scheme updates yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Set your preferences to get personalized alerts</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <Link
                key={notif.id}
                to={notif.scheme_id ? `/scheme/${notif.scheme_id}` : "#"}
                onClick={() => setOpen(false)}
                className="block"
              >
                <div className="p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{notif.category}</Badge>
                        <span className="text-[10px] text-muted-foreground/60">{formatTime(notif.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
