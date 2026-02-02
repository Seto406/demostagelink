import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  slug: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge | null; // Joined data
}

export const useGamification = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: userBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching badges:", error);
        throw error;
      }

      // Cast the response to match our interface, assuming Supabase join returns an object or array
      return data as unknown as UserBadge[];
    },
    enabled: !!user,
  });

  const addXp = async (amount: number) => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc("add_xp", { amount });
      if (error) throw error;

      await refreshProfile();

      toast({
        title: "XP Gained!",
        description: `You earned ${amount} XP.`,
      });
    } catch (error) {
      console.error("Error adding XP:", error);
      toast({
        title: "Error",
        description: "Failed to add XP.",
        variant: "destructive",
      });
    }
  };

  const awardBadge = async (slug: string) => {
    if (!user) return;
    try {
      const { data: success, error } = await supabase.rpc("award_badge", { badge_slug: slug });

      if (error) throw error;

      if (success) {
        await queryClient.invalidateQueries({ queryKey: ["user-badges", user.id] });
        toast({
          title: "New Badge Unlocked!",
          description: `You've earned a new badge! Check your profile.`,
        });
        // We could fetch the badge name here to be more specific, but generic is fine for now
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
      toast({
        title: "Error",
        description: "Failed to award badge.",
        variant: "destructive",
      });
    }
  };

  return {
    userBadges,
    loadingBadges,
    addXp,
    awardBadge,
  };
};
