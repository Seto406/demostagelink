import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    // Wait for auth initialization
    if (authLoading) return;

    if (!user || !profile) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('show_id')
        .eq('user_id', profile.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.show_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
    setLoading(false);
  }, [user, profile, authLoading]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

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

    const isFavorited = favorites.includes(showId);

    // Optimistic update
    setFavorites(prev => 
      isFavorited 
        ? prev.filter(id => id !== showId)
        : [...prev, showId]
    );

    try {
      if (isFavorited) {
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
      setFavorites(prev => 
        isFavorited 
          ? [...prev, showId]
          : prev.filter(id => id !== showId)
      );
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
      console.error('Toggle favorite error:', error);
    }
  };

  const isFavorited = (showId: string) => favorites.includes(showId);

  return { favorites, loading, toggleFavorite, isFavorited, refetch: fetchFavorites };
};
