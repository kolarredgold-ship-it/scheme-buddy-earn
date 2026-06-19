import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  referral_code: string;
  referred_by: string | null;
  subscription_status: "free" | "active" | "expired";
  wallet_balance: number;
  report_credits?: number;
  ai_credits?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Retry — the profile row is created by a DB trigger right after signup,
  // so a fresh session might race the trigger and see nothing on the first read.
  const fetchProfile = async (userId: string, attempts = 4) => {
    for (let i = 0; i < attempts; i++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        return;
      }
      if (error && error.code !== "PGRST116") {
        console.warn("fetchProfile error:", error.message);
      }
      // wait a bit for the new-user trigger to finish
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Defer to avoid deadlock inside the auth callback
          setTimeout(() => {
            fetchProfile(newSession.user.id);
            checkAdmin(newSession.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        await Promise.all([fetchProfile(existing.user.id), checkAdmin(existing.user.id)]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  const signOut = async () => {
    setProfile(null);
    setIsAdmin(false);
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
