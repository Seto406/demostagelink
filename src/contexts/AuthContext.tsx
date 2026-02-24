/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback, useMemo } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 THE GAME CHANGER: This forcefully aborts frozen background network requests 
const withTimeout = <T,>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timed out due to network sleep")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hasInitialized = useRef(false);

  const fetchProfile = useCallback(async (userId: string, userMetadata?: any) => {
    try {
      // Wrapped in strict 5s timeout to prevent infinite hangs
      const fetchResponse = await withTimeout(
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()
      );

      if (fetchResponse.data) {
        setProfile(fetchResponse.data as Profile);
        return;
      }

      if (fetchResponse.error) {
        console.error("Profile fetch error:", fetchResponse.error);
        return;
      }

      // If no profile exists, try to create one
      const pendingRoleRaw = localStorage.getItem("pendingUserRole");
      const role: "audience" | "producer" = pendingRoleRaw === "producer" ? "producer" : "audience";

      const createResponse = await withTimeout(
        supabase.from("profiles").insert([{
          user_id: userId,
          role,
          avatar_url: userMetadata?.avatar_url || null,
        }]).select().single()
      );

      if (createResponse.data) {
        setProfile(createResponse.data as Profile);
        localStorage.removeItem("pendingUserRole");
      }
    } catch (error) {
      console.warn("Profile fetch/create aborted or timed out:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // ABSOLUTE FAILSAFE: The app will never be permanently stuck on the loading screen.
    const failsafeTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("AuthContext: Initial load timed out. Forcing UI to render.");
        setLoading(false);
      }
    }, 4000);

    const initAuth = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        const { data: { session }, error } = await withTimeout(supabase.auth.getSession());
        
        if (error) throw error;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id, session.user.user_metadata);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          clearTimeout(failsafeTimer);
          setLoading(false);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).PlaywrightTest) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).PlaywrightUser) setUser((window as any).PlaywrightUser);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).PlaywrightProfile) setProfile((window as any).PlaywrightProfile);
        setLoading(false);
        clearTimeout(failsafeTimer);
        return;
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
        navigate("/reset-password?type=recovery");
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Run quietly in background without forcing a loading screen
        fetchProfile(currentSession.user.id, currentSession.user.user_metadata);
      } else {
        setProfile(null);
      }
    });

    // Clean background recovery for ghost states
    const handleFocus = () => {
      if (mounted && user && !profile && !loading) {
        console.log("Tab focus: Healing ghost state...");
        fetchProfile(user.id, user.user_metadata);
        supabase.auth.getSession(); // Ping Supabase internally
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.user_metadata);
    }
  }, [user, fetchProfile]);

  const updateProfileState = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: "audience" | "producer", firstName: string) => {
    const redirectUrl = `${window.location.origin}/verify-email`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { role, first_name: firstName },
      },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: { access_type: "offline", prompt: "consent select_account" },
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    // 🔥 OPTIMISTIC LOGOUT: We immediately clear the UI state here, line 1.
    // The user will instantly see they are logged out without waiting for the server.
    setUser(null);
    setSession(null);
    setProfile(null);
    
    try {
      // Ping the server to destroy the session, but only give it 2 seconds max
      await withTimeout(supabase.auth.signOut(), 2000);
    } catch (error) {
      console.warn("Sign out background sync delayed/failed", error);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-foreground">System Updating...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    updateProfileState
  }), [user, session, profile, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut, refreshProfile, updateProfileState]);

  return (
    <AuthContext.Provider value={value}>
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
