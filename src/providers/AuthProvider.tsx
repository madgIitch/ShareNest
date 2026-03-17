import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureProfileExists(userId: string) {
  const { data: current, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!current) {
    const { error: insertError } = await supabase.from("profiles").insert({ id: userId });
    if (insertError) {
      throw insertError;
    }
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    await ensureProfileExists(session.user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      throw error;
    }

    setProfile(data as Profile);
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);

        // Load profile in the same tick so index.tsx never sees session+null profile
        if (data.session?.user?.id) {
          await ensureProfileExists(data.session.user.id);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();
          if (mounted && profileData) setProfile(profileData as Profile);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    void (async () => {
      try {
        await refreshProfile();
      } catch {
        if (mounted) {
          setProfile(null);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshProfile, session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [loading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
