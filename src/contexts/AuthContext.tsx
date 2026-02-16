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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  // UPDATED: Added firstName to the signature
  signUp: (email: string, password: string, role: "audience" | "producer", firstName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
    if (typeof window !== 'undefined' && (window as any).PlaywrightTest) {
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
                expires_at: 9999999999
            } as Session);
            // Bypass Supabase and set mock profile directly for testing
            const mockProfile = {
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
                university: null
            };
            setProfile(mockProfile as unknown as Profile);
            setLoading(false);
        } else {
            setLoading(false);
        }
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
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.email) {
                // Non-blocking call to send welcome email
                supabase.functions.invoke("send-welcome-email", {
                  body: {
                    email: user.email,
                    name: (createdProfile as Profile).group_name || user.user_metadata?.full_name || user.user_metadata?.first_name,
                    role: role,
                  },
                }).then(({ error }) => {
                  if (error) console.error("Failed to trigger welcome email:", error);
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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).PlaywrightTest) {
        console.log("AuthContext: Skipping Supabase Auth listeners (Test Mode)");
        return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await ensureProfile(session.user.id, session.user.user_metadata);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error("Error retrieving session:", error);
        localStorage.clear();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await ensureProfile(session.user.id, session.user.user_metadata);
        }
      } catch (error) {
        console.error("Error processing session:", error);
        localStorage.clear();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Unexpected error checking session:", err);
      localStorage.clear();
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

    const timeoutId = setTimeout(() => {
      console.warn("Auth loading timed out (10s). executing fail-safe...");
      localStorage.clear();
      setLoading(false);

      // Allow public viewing for shows, producers, etc. without redirecting to login
      const publicPaths = ["/show", "/shows", "/producer", "/group", "/directory", "/about"];
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path)) || location.pathname === "/";

      if (!isPublicPath) {
        navigate("/login");
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading, navigate, location.pathname]);

  // CORRECTED: Added firstName parameter and removed extra closing brace
  const signUp = async (email: string, password: string, role: "audience" | "producer", firstName: string) => {
    const redirectUrl = `${window.location.origin}/verify-email`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          role,
          // Matches {{ .Data.first_name }} in your Supabase email template
          first_name: firstName 
        }
      }
    });

    if (error) {
      // Enhanced logging as recommended by Jules
      console.error("SignUp detailed error:", error);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
        },
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timed out')), 5000)
      );

      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setProfile(null);
      setSession(null);
      setUser(null);
    }
  };

  const isAdmin = profile?.role === "admin";

  const publicPaths = ["/show", "/shows", "/producer", "/group", "/directory", "/about"];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path)) || location.pathname === "/";

  // If loading but on a public path, allow rendering (read-only mode)
  if (loading && !isPublicPath) {
    return <FullPageLoader text="Loading StageLink..." />;
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut, refreshProfile }}>
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
