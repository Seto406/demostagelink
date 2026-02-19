/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { FullPageLoader } from "@/components/ui/branded-loader";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfileRef = useRef<Record<string, Promise<void> | null>>({});
  const profileRef = useRef(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).PlaywrightTest) {
      console.log("Playwright Test detected: Force disabling auth loader");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockUser = (window as any).PlaywrightUser;

      if (mockUser) {
        console.log("Injecting Playwright Mock User");
        setUser(mockUser);
        setSession({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh",
          user: mockUser,
          expires_at: 9999999999,
        } as Session);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const playwrightProfile = (window as any).PlaywrightProfile;
        const mockProfile = playwrightProfile || {
          id: "profile-" + mockUser.id,
          user_id: mockUser.id,
          role: localStorage.getItem("pendingUserRole") || "audience",
          username: "Mock User",
          created_at: new Date().toISOString(),
          avatar_url: mockUser.user_metadata?.avatar_url,
          group_name: null,
          description: null,
          founded_year: null,
          niche: null,
          map_screenshot_url: null,
          rank: null,
          xp: null,
          facebook_url: null,
          instagram_url: null,
          address: null,
          university: null,
          has_completed_tour: false,
          producer_role: null,
        };
        setProfile(mockProfile as unknown as Profile);
      }

      setLoading(false);
    }
  }, []);

  const ensureProfile = async (
    userId: string,
    userMetadata?: Record<string, unknown> & { avatar_url?: string },
    force = false
  ) => {
    if (!force && profileRef.current?.user_id === userId) {
      return;
    }

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
        } else {
          const pendingRoleRaw = localStorage.getItem("pendingUserRole");
          let role: "audience" | "producer" = "audience";

          if (pendingRoleRaw === "audience" || pendingRoleRaw === "producer") {
            role = pendingRoleRaw;
          }

          const newProfile = {
            user_id: userId,
            role: role,
            avatar_url: userMetadata?.avatar_url || null,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single();

          if (createdProfile) {
            setProfile(createdProfile as Profile);

            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user?.email) {
                supabase.functions
                  .invoke("send-welcome-email", {
                    body: {
                      email: user.email,
                      name:
                        (createdProfile as Profile).group_name ||
                        user.user_metadata?.full_name ||
                        user.user_metadata?.first_name,
                      role: role,
                    },
                  })
                  .then(({ error }) => {
                    if (error) console.warn("Failed to trigger welcome email:", error);
                  })
                  .catch((err) => {
                    console.warn("Welcome email invocation failed:", err);
                  });
              }
            } catch (emailError) {
              console.error("Failed to trigger welcome email:", emailError);
            }

            localStorage.removeItem("pendingUserRole");
          } else {
            console.warn("Error creating profile, retrying fetch:", createError);
            const { data: retryData } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", userId)
              .maybeSingle();

            if (retryData) {
              setProfile(retryData as Profile);
              localStorage.removeItem("pendingUserRole");
            } else {
              console.error("Failed to ensure profile:", createError);
              await signOut();
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error in ensureProfile:", error);
        await signOut();
      } finally {
        delete fetchingProfileRef.current[userId];
      }
    })();

    fetchingProfileRef.current[userId] = fetchPromise;
    return fetchPromise;
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user.id, user.user_metadata, true);
    }
  };

  const updateProfileState = (updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  useEffect(() => {
    // 5-second circuit breaker: force-unblock UI if auth init hangs
    const circuitBreaker = window.setTimeout(() => {
      console.warn("Auth initialization exceeded 5s, forcing loading=false");
      setLoading(false);
    }, 5000);

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
            if (event === "TOKEN_REFRESHED") {
              console.log("Auth token refreshed");
            }

            if (event === "PASSWORD_RECOVERY") {
              if (window.location.pathname !== "/reset-password") {
                navigate("/reset-password?type=recovery");
              }
            }

            setSession(authSession);
            setUser(authSession?.user ?? null);

            if (authSession?.user) {
              await ensureProfile(authSession.user.id, authSession.user.user_metadata);
            } else {
              setProfile(null);
            }
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
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await ensureProfile(currentSession.user.id, currentSession.user.user_metadata);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Unexpected error or timeout checking session:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
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

  let isPublicPath = true;
  try {
    const publicPaths = ["/show", "/shows", "/producer", "/group", "/directory", "/about"];
    isPublicPath = publicPaths.some((path) => location.pathname.startsWith(path)) || location.pathname === "/";
  } catch (pathError) {
    console.error("Error evaluating public path, defaulting to public access:", pathError);
    isPublicPath = true;
  }

  console.log("[AuthContext] Path/loading state:", {
    pathname: typeof window !== "undefined" ? window.location.pathname : location.pathname,
    loading,
    isPublicPath,
  });

  if (loading && !isPublicPath) {
    return <FullPageLoader text="Loading StageLink..." autoRecovery={true} />;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
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
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

  async function signUp(email: string, password: string, role: "audience" | "producer", firstName: string) {
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
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signInWithGoogle() {
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
  }

  async function signOut() {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out timed out")), 5000));

      await Promise.race([supabase.auth.signOut(), timeoutPromise]);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setProfile(null);
      setSession(null);
      setUser(null);
    }
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
