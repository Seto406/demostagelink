import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { createNotification } from "@/lib/notifications";

export const useShowLikes = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['show_likes', user?.id];

  const { data: likedShows = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('show_likes')
        .select('show_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching show likes:', error);
        throw error;
      }
      return data?.map(f => f.show_id) || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Determine loading state exposed to consumers
  const loading = authLoading || (isLoading && !!user?.id);

  const toggleLike = async (showId: string, producerId?: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like shows.",
        variant: "destructive",
      });
      return;
    }

    const previousLikes = queryClient.getQueryData<string[]>(queryKey) || [];
    const isCurrentlyLiked = previousLikes.includes(showId);

    // Optimistic update
    queryClient.setQueryData<string[]>(queryKey, (old: string[] | undefined) => {
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
          .eq('user_id', user.id)
          .eq('show_id', showId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('show_likes')
          .insert({ user_id: user.id, show_id: showId });

        if (error) throw error;

        toast({
          title: "Liked!",
          description: "You've supported this production.",
        });

        // Fetch show details to get producer_id and title
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select('producer_id, title')
          .eq('id', showId)
          .single();

        if (showError || !showData) {
          console.error('Error fetching show details for notification:', showError);
        } else {
          // Fetch current user's profile id
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile for notification:', profileError);
          } else if (profileData) {
            await createNotification({
              userId: showData.producer_id,
              actorId: profileData.id,
              type: 'like',
              title: 'New Like!',
              message: `Someone liked your show: ${showData.title}`,
              link: `/shows/${showId}`
            });
          }
        }
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
