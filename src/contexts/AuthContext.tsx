/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  role: "audience" | "producer" | "admin";
  group_name: string | null;
  description: string | null;
  founded_year: number | null;
  niche: "local" | "university" | null;
  map_screenshot_url: string | null;
  created_at: string;
  username: string | null;
  rank: string | null;
  xp: number | null;
  avatar_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  address: string | null;
  university: string | null;
  has_completed_tour?: boolean | null;
  producer_role: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, role: "audience" | "producer", firstName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileState: (updates: Partial<Profile>) => void;
}

const PUBLIC_PATHS = ["/", "/show", "/shows", "/producer", "/group", "/directory", "/about"];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const areSessionsEqual = (a: Session | null, b: Session | null) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.access_token === b.access_token && a.user?.id === b.user?.id && a.expires_at === b.expires_at;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hasInitialized = useRef(false);
  const latestSessionRef = useRef<Session | null>(null);
  const fetchingProfileRef = useRef<Record<string, Promise<void> | null>>({});
  const profileRef = useRef<Profile | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const ensureProfile = async (
    userId: string,
    userMetadata?: Record<string, unknown> & { avatar_url?: string },
    force = false
  ) => {
    if (!force && profileRef.current?.user_id === userId) return;

    if (fetchingProfileRef.current[userId]) {
      return fetchingProfileRef.current[userId]!;
    }

    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          setProfile(data as Profile);
          return;
        }

        const pendingRoleRaw = localStorage.getItem("pendingUserRole");
        const role: "audience" | "producer" = pendingRoleRaw === "producer" ? "producer" : "audience";

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              user_id: userId,
              role,
              avatar_url: userMetadata?.avatar_url || null,
            },
          ])
          .select()
          .single();

        if (createdProfile) {
          setProfile(createdProfile as Profile);
          localStorage.removeItem("pendingUserRole");
          return;
        }

        console.warn("Error creating profile, retrying fetch:", createError);
        const { data: retryData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (retryData) {
          setProfile(retryData as Profile);
          localStorage.removeItem("pendingUserRole");
          return;
        }

        console.error("Failed to ensure profile:", createError);
      } catch (error) {
        console.error("Unexpected error in ensureProfile:", error);
      } finally {
        delete fetchingProfileRef.current[userId];
      }
    })();

    fetchingProfileRef.current[userId] = fetchPromise;
    return fetchPromise;
  };

  const setAuthStateIfChanged = async (nextSession: Session | null) => {
    if (!areSessionsEqual(latestSessionRef.current, nextSession)) {
      latestSessionRef.current = nextSession;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    }

    if (nextSession?.user) {
      await ensureProfile(nextSession.user.id, nextSession.user.user_metadata);
      return;
    }

    setProfile(null);
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const circuitBreaker = window.setTimeout(() => {
      console.warn("Auth initialization exceeded 5s, forcing loading=false");
      setLoading(false);
    }, 5000);

    console.log("[AuthContext:init]", {
      pathname: window.location.pathname,
      initialLoading: true,
      isPublicPath: PUBLIC_PATHS.some((path) =>
        path === "/" ? window.location.pathname === "/" : window.location.pathname.startsWith(path)
      ),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).PlaywrightTest) {
      console.log("AuthContext: Skipping Supabase Auth listeners (Test Mode)");
      clearTimeout(circuitBreaker);
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    const initSession = async () => {
      try {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, authSession) => {
          try {
            if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
              navigate("/reset-password?type=recovery");
            }

            await setAuthStateIfChanged(authSession);
          } catch (error) {
            console.error("Error handling auth state change:", error);
          } finally {
            setLoading(false);
          }
        });

        subscription = authSubscription;

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error retrieving session:", error);
          localStorage.clear();
          await setAuthStateIfChanged(null);
          return;
        }

        await setAuthStateIfChanged(data.session);
      } catch (error) {
        console.error("Unexpected error or timeout checking session:", error);
        await setAuthStateIfChanged(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    return () => {
      clearTimeout(circuitBreaker);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user.id, user.user_metadata, true);
    }
  };

  const updateProfileState = (updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const signUp = async (email: string, password: string, role: "audience" | "producer", firstName: string) => {
    const redirectUrl = `${window.location.origin}/verify-email`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role,
          first_name: firstName,
        },
      },
    });

    if (error) {
      console.error("SignUp detailed error:", error);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent select_account",
        },
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out timed out")), 5000));
      await Promise.race([supabase.auth.signOut(), timeoutPromise]);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      latestSessionRef.current = null;
      setProfile(null);
      setSession(null);
      setUser(null);
    }
  };

  if (loading) {
    return <div>System Updating...</div>;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut, refreshProfile, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
