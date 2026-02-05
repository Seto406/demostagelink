import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, role: "audience" | "producer") => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (userId: string, userMetadata?: Record<string, unknown> & { avatar_url?: string }) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Profile doesn't exist, create it
        // Get role from localStorage or default to audience
        const pendingRoleRaw = localStorage.getItem("pendingUserRole");
        let role: "audience" | "producer" = "audience";

        // Validate role
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

          // Trigger welcome email for new user
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              await supabase.functions.invoke("send-welcome-email", {
                body: {
                  email: user.email,
                  name: (createdProfile as Profile).group_name || user.user_metadata?.full_name,
                  role: role,
                },
              });
            }
          } catch (emailError) {
            console.error("Failed to trigger welcome email:", emailError);
          }

          localStorage.removeItem("pendingUserRole");
        } else {
          // If insert failed, it might be a race condition (profile created elsewhere)
          // Try fetching one last time
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
            setProfile(null);
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error in ensureProfile:", error);
      // Even if profile fetch fails, we don't want to leave the user completely blocked
      // checking if we can proceed without profile or if we should set it to null
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user.id, user.user_metadata);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
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

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await ensureProfile(session.user.id, session.user.user_metadata);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: "audience" | "producer") => {
    const redirectUrl = `${window.location.origin}/verify-email`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { role }
      }
    });
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
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Create a timeout promise to prevent hanging
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
      // Optional: Clear any local storage items if needed, though supabase client handles this
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
