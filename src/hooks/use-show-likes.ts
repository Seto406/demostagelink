import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useShowLikes = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['show_likes', profile?.id];

  const { data: likedShows = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('show_likes')
        .select('show_id')
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching show likes:', error);
        throw error;
      }
      return data?.map(f => f.show_id) || [];
    },
    enabled: !!profile?.id && !authLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Determine loading state exposed to consumers
  const loading = authLoading || (isLoading && !!profile?.id);

  const toggleLike = async (showId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like shows.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile Loading",
        description: "Please wait while your profile loads.",
        variant: "default", // Informational
      });
      return;
    }

    const previousLikes = queryClient.getQueryData<string[]>(queryKey) || [];
    const isCurrentlyLiked = previousLikes.includes(showId);

    // Optimistic update
    queryClient.setQueryData<string[]>(queryKey, (old) => {
      const prev = old || [];
      return isCurrentlyLiked
        ? prev.filter(id => id !== showId)
        : [...prev, showId];
    });

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('show_likes')
          .delete()
          .eq('user_id', profile.id)
          .eq('show_id', showId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('show_likes')
          .insert({ user_id: profile.id, show_id: showId });

        if (error) throw error;

        toast({
          title: "Liked!",
          description: "You've supported this production.",
        });
      }
    } catch (error) {
      // Revert optimistic update
      queryClient.setQueryData(queryKey, previousLikes);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
      console.error('Toggle like error:', error);
    }
  };

  const isLiked = (showId: string) => likedShows.includes(showId);

  return { likedShows, loading, toggleLike, isLiked, refetch };
};
