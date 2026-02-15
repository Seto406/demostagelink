/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  signUp: (email: string, password: string, role: "audience" | "producer", firstName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfileRef = useRef<Record<string, Promise<void> | null>>({});
  const profileRef = useRef(profile);
  const mountedRef = useRef(true);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
            ensureProfile(mockUser.id, mockUser.user_metadata).then(() => {
                if (mountedRef.current) setLoading(false);
            });
        } else {
            if (mountedRef.current) setLoading(false);
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
      const maxRetries = 3;
      let attempt = 0;
      let lastError: any = null;

      while (attempt <= maxRetries) {
        try {
          // Add a small delay for retries
          if (attempt > 0) {
             const delay = 1000 * Math.pow(2, attempt - 1);
             console.log(`Retrying profile fetch (attempt ${attempt}/${maxRetries}) in ${delay}ms...`);
             await new Promise(resolve => setTimeout(resolve, delay));
          }

          if (!mountedRef.current) return;

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            if (mountedRef.current) setProfile(data as Profile);
            return; // Success!
          } else {
            // Profile not found, create one
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

            if (createError) throw createError;

            if (createdProfile) {
              if (mountedRef.current) setProfile(createdProfile as Profile);

              // Welcome email
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
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
              return; // Success!
            }
          }
        } catch (error: any) {
          lastError = error;
          console.error(`Error in ensureProfile (attempt ${attempt}):`, error);

          // Check for "Session issued in the future" or network errors
          const isTransient = error.message?.includes("future") ||
                              error.message?.includes("network") ||
                              error.message?.includes("fetch");

          if (!isTransient && attempt === 0) {
              // If it's a hard error (e.g. permission denied not related to time), maybe fail fast?
              // But permission denied usually means session issue too.
          }

          attempt++;
        }
      }

      // If we exhausted retries
      console.error("Failed to ensure profile after retries:", lastError);

      // Only sign out if we are sure it's unrecoverable and we can't function
      // If we don't sign out, the user might see a broken state, but maybe better than loop?
      // However, if we can't get profile, we can't do much.
      await signOut();

    })();

    fetchingProfileRef.current[userId] = fetchPromise;
    try {
        await fetchPromise;
    } finally {
        if (fetchingProfileRef.current[userId] === fetchPromise) {
            delete fetchingProfileRef.current[userId];
        }
    }
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
        if (!mountedRef.current) return;

        console.log(`Auth state change: ${event}`);

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
          if (mountedRef.current) setLoading(false);
        }
      }
    );

    // We rely on onAuthStateChange for initialization now.
    // It fires immediately with current session (INITIAL_SESSION).
    // This avoids race conditions with getSession().

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

    const timeoutId = setTimeout(() => {
      console.warn("Auth loading timed out (15s). executing fail-safe...");
      if (mountedRef.current) {
          localStorage.clear();
          setLoading(false);
          navigate("/login");
      }
    }, 15000); // Increased to 15s to allow for retries

    return () => clearTimeout(timeoutId);
  }, [loading, navigate]);

  const signUp = async (email: string, password: string, role: "audience" | "producer", firstName: string) => {
    const redirectUrl = `${window.location.origin}/verify-email`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          role,
          first_name: firstName 
        }
      }
    });

    if (error) {
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
      if (mountedRef.current) {
        setProfile(null);
        setSession(null);
        setUser(null);
      }
    }
  };

  const isAdmin = profile?.role === "admin";

  if (loading) {
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
