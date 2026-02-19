import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { CinematicEmptyState } from "@/components/ui/cinematic-empty-state";
import { useFavorites } from "@/hooks/use-favorites";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Bookmark } from "lucide-react";

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  profiles?: {
    group_name: string | null;
    id: string;
    avatar_url: string | null;
  };
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFavoriteShows = async () => {
      if (favorites.length === 0) {
        setShows([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("shows")
        .select(`
          id,
          title,
          description,
          date,
          venue,
          city,
          poster_url,
          profiles:producer_id (
            group_name,
            id,
            avatar_url
          )
        `)
        .in("id", favorites)
        .eq("status", "approved");

      if (!error && data) {
        setShows(data as Show[]);
      }
      setLoading(false);
    };

    if (favorites.length >= 0) {
      fetchFavoriteShows();
    }
  }, [favorites]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-6 h-6 text-primary fill-primary" />
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                Favorites
              </h1>
            </div>
            <p className="text-muted-foreground">
              Shows you've saved for later
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <BrandedLoader size="md" text="Loading favorites..." />
            </div>
          ) : shows.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12">
              <CinematicEmptyState />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shows.map((show, index) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <Link to={`/show/${show.id}`}>
                    <div className="bg-card border border-secondary/20 rounded-xl overflow-hidden hover:border-secondary/50 transition-all">
                      <div className="aspect-[3/4] relative overflow-hidden bg-black/5">
                        {show.poster_url ? (
                          <>
                            <div
                              className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                              style={{ backgroundImage: `url(${show.poster_url})` }}
                            />
                            <img
                              src={show.poster_url}
                              alt={show.title}
                              className="relative w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-4xl">🎭</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-20 pointer-events-none" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-semibold text-foreground mb-1 line-clamp-1">
                          {show.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          {show.profiles?.avatar_url ? (
                            <img
                              src={show.profiles.avatar_url}
                              alt={show.profiles.group_name || "Producer"}
                              className="w-5 h-5 rounded-full object-cover border border-secondary/30"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                              🎭
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {show.profiles?.group_name || "Unknown Group"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {show.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(show.date).toLocaleDateString()}
                            </span>
                          )}
                          {show.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {show.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <BookmarkButton
                    isFavorited={isFavorited(show.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(show.id);
                    }}
                    className="absolute top-3 right-3"
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Favorites;
