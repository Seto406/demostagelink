import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['favorites', profile?.id];

  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('show_id')
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }
      return data?.map(f => f.show_id) || [];
    },
    enabled: !!profile?.id && !authLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Determine loading state exposed to consumers
  const loading = authLoading || (isLoading && !!profile?.id);

  const toggleFavorite = async (showId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save favorites.",
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

    const previousFavorites = queryClient.getQueryData<string[]>(queryKey) || [];
    const isCurrentlyFavorited = previousFavorites.includes(showId);

    // Optimistic update
    queryClient.setQueryData<string[]>(queryKey, (old) => {
      const prev = old || [];
      return isCurrentlyFavorited
        ? prev.filter(id => id !== showId)
        : [...prev, showId];
    });

    try {
      if (isCurrentlyFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', profile.id)
          .eq('show_id', showId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: profile.id, show_id: showId });

        if (error) throw error;
        
        toast({
          title: "Added to Favorites",
          description: "Show saved to your favorites.",
        });
      }
    } catch (error) {
      // Revert optimistic update
      queryClient.setQueryData(queryKey, previousFavorites);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
      console.error('Toggle favorite error:', error);
    }
  };

  const isFavorited = (showId: string) => favorites.includes(showId);

  return { favorites, loading, toggleFavorite, isFavorited, refetch };
};
