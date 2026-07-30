import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export interface Profile {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  presence: "offline" | "online" | "in_lobby" | "in_match";
  last_seen: string;
  created_at: string;
}

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Local display name used for guest (offline) play. */
  guestName: string;
  isGuest: boolean;
  setGuestName: (name: string) => void;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_KEY = "chitset:guest-name";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestNameState] = useState("Guest");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(GUEST_KEY) : null;
    if (stored) setGuestNameState(stored);
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) {
        // Never call other Supabase APIs synchronously inside this callback.
        setTimeout(() => void loadProfile(nextSession.user.id), 0);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const setGuestName = useCallback((name: string) => {
    setGuestNameState(name);
    if (typeof window !== "undefined") localStorage.setItem(GUEST_KEY, name);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { username },
        },
      });
      if (error) throw error;
      // No session means the account needs email confirmation first.
      return Boolean(data.session);
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw result.error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      guestName,
      isGuest: !session,
      setGuestName,
      refreshProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [
      loading,
      session,
      profile,
      guestName,
      setGuestName,
      refreshProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Display name for the current device — profile username or guest name. */
export function useDisplayName() {
  const { profile, guestName } = useAuth();
  return profile?.username ?? guestName;
}
