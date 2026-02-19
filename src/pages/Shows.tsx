import { useState, useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Filter, X, Sparkles, ChevronDown, Ticket, Share2, Pencil, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShowCardSkeleton as SkeletonCard } from "@/components/ui/skeleton-loaders";
import { TiltCard } from "@/components/ui/tilt-card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFavorites } from "@/hooks/use-favorites";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { useAuth } from "@/contexts/AuthContext";
import { AdBanner } from "@/components/ads/AdBanner";
// Import all posters for local mapping
import posterElBimbo from "@/assets/posters/ang-huling-el-bimbo.jpg";
import posterMulaSaBuwan from "@/assets/posters/mula-sa-buwan.jpg";
import posterRent from "@/assets/posters/rent-manila.jpg";
import posterHamilton from "@/assets/posters/hamilton.jpg";
import posterPhantom from "@/assets/posters/the-phantom.jpg";
import posterDekada from "@/assets/posters/dekada-70.jpg";
import posterRakOfAegis from "@/assets/posters/rak-of-aegis.jpg";
import posterSpringAwakening from "@/assets/posters/spring-awakening.jpg";
import posterOrosman from "@/assets/posters/orosman-at-zafira.jpg";
import posterBatangRizal from "@/assets/posters/batang-rizal.jpg";

// Map titles to local poster images
const posterMap: Record<string, string> = {
  "Ang Huling El Bimbo": posterElBimbo,
  "Mula sa Buwan": posterMulaSaBuwan,
  "Rent": posterRent,
  "Hamilton": posterHamilton,
  "The Phantom of the Opera": posterPhantom,
  "Dekada '70": posterDekada,
  "Rak of Aegis": posterRakOfAegis,
  "Spring Awakening": posterSpringAwakening,
  "Orosman at Zafira": posterOrosman,
  "Batang Rizal": posterBatangRizal,
};

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  poster_url: string | null;
  genre: string | null;
  ticket_link: string | null;
  producer_id: {
    id: string;
    group_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Enhanced Show Card component with 3D tilt
const ShowCard = forwardRef<HTMLDivElement, { show: Show; index: number }>(({ show, index }, ref) => {
  const { user, profile } = useAuth();
  const posterUrl = posterMap[show.title] || show.poster_url;
  const { toggleFavorite, isFavorited } = useFavorites();
  const { toast } = useToast();

  const isProducerOrAdmin = user && (user.id === show.producer_id?.id || profile?.role === 'admin');

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/show/${show.id}`);
    toast({
      title: "Link Copied to Clipboard!",
      description: "You can now share this show with your friends.",
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0 }}
      layout
    >
      <TiltCard tiltAmount={10} glareEnabled={true} scale={1.02}>
        <div
          className="block bg-card rounded-xl overflow-hidden group relative flex flex-col h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Link to={`/shows/${show.id}`} className="absolute inset-0 z-10">
            <span className="sr-only">View {show.title}</span>
          </Link>

          {/* Poster */}
          <div className="aspect-[2/3] relative overflow-hidden bg-black/5 pointer-events-none">
            {posterUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                  style={{ backgroundImage: `url(${posterUrl})` }}
                />
                <motion.img
                  src={posterUrl}
                  alt={show.title}
                  className="relative w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl opacity-30">🎭</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

            {/* Social Proof Badge - DEMO ONLY */}
            {/* TODO: Replace with actual real-time count */}
            <div className="absolute top-12 left-3 z-20 pointer-events-none">
               <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <span className="text-xs">🔥</span>
                  <span className="text-[10px] font-medium text-white/90 font-sans tracking-wide">
                    {/* DEMO_ONLY */}
                    12 People Reserved Recently
                  </span>
               </div>
            </div>

            {/* Niche badge */}
            {(show.niche || show.genre) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-3 right-3"
                style={{ transform: "translateZ(30px)" }}
              >
                <span className="px-2 py-1 text-xs uppercase tracking-wider bg-secondary/20 border border-secondary/40 text-secondary backdrop-blur-sm">
                  {show.genre || (show.niche === "university" ? "University" : "Local")}
                </span>
              </motion.div>
            )}

            {/* Favorite Button */}
            <div
              className="absolute top-3 left-3 z-20 pointer-events-auto"
              style={{ transform: "translateZ(30px)" }}
            >
              <BookmarkButton
                isFavorited={isFavorited(show.id)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(show.id);
                }}
                size="sm"
              />
            </div>

            {/* Share Button */}
            <div
              className="absolute top-3 left-12 z-20 pointer-events-auto"
              style={{ transform: "translateZ(30px)" }}
            >
               <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border-secondary/30 text-muted-foreground hover:bg-background/90 hover:text-primary hover:border-primary/50 p-0"
                  onClick={handleShare}
                  aria-label="Share this show"
               >
                  <Share2 className="w-3.5 h-3.5" />
               </Button>
            </div>

            {/* Edit Button */}
            {isProducerOrAdmin && (
              <div
                className="absolute top-3 left-[84px] z-20 pointer-events-auto"
                style={{ transform: "translateZ(30px)" }}
              >
                <Link to={`/dashboard?tab=shows&edit=${show.id}`}>
                  <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border-secondary/30 text-muted-foreground hover:bg-background/90 hover:text-primary hover:border-primary/50 p-0"
                      aria-label="Edit Production"
                  >
                      <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Content */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{ transform: "translateZ(20px)" }}
            >
              <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2 group-hover:text-secondary transition-colors duration-300">
                {show.title}
              </h3>
              <div className="flex items-center gap-2 relative z-20">
                {show.producer_id?.avatar_url ? (
                  <img 
                    src={show.producer_id.avatar_url}
                    alt={show.producer_id.group_name || "Producer"}
                    className="w-5 h-5 rounded-full object-cover border border-secondary/40"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px]">
                    🎭
                  </div>
                )}
                <Link
                  to={`/producer/${show.producer_id?.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-secondary/80 hover:text-secondary hover:underline transition-colors pointer-events-auto relative"
                >
                  {show.producer_id?.group_name || "Theater Group"}
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {show.date && (
                  <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-sm">
                    <Calendar className="w-3 h-3 text-secondary" />
                    {new Date(show.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {show.city && (
                  <span className="flex items-center gap-1 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-sm">
                    <MapPin className="w-3 h-3 text-secondary" />
                    {show.city}
                  </span>
                )}
              </div>

              {/* Buy Ticket Button */}
              {show.ticket_link && (
                <div className="mt-4 pt-2 border-t border-white/10 relative z-20 pointer-events-auto">
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 bg-secondary/90 hover:bg-secondary text-black font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(show.ticket_link || '', '_blank');
                    }}
                  >
                    <Ticket className="w-3 h-3 mr-1" />
                    Buy Ticket
                  </Button>
                </div>
              )}
            </div>

            {/* Hover border effect */}
            <div className="absolute inset-0 border-2 border-secondary/0 group-hover:border-secondary/50 transition-colors duration-300 pointer-events-none" />
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
});
ShowCard.displayName = "ShowCard";

// Compact List Item for List View
const ShowListItem = ({ show }: { show: Show }) => {
  const posterUrl = posterMap[show.title] || show.poster_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex h-[120px] bg-card border border-secondary/20 rounded-xl overflow-hidden hover:border-secondary/50 transition-colors group"
    >
      {/* Thumbnail */}
      <div className="w-[80px] sm:w-[100px] h-full relative shrink-0 bg-black/5 overflow-hidden">
        {posterUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
              style={{ backgroundImage: `url(${posterUrl})` }}
            />
            <img
              src={posterUrl}
              alt={show.title}
              className="relative z-10 w-full h-full object-contain"
            />
          </>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-xl">🎭</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-bold text-base sm:text-lg text-foreground truncate group-hover:text-secondary transition-colors">
            {show.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1 mb-2">
           {show.date && (
              <span className="flex items-center gap-1">
                 <Calendar className="w-3 h-3 text-secondary/70" />
                 {new Date(show.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
           )}
           {show.venue && (
             <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
               <MapPin className="w-3 h-3 text-secondary/70" />
               {show.venue}
             </span>
           )}
           {show.city && !show.venue && (
              <span className="flex items-center gap-1 truncate">
                 <MapPin className="w-3 h-3 text-secondary/70" />
                 {show.city}
              </span>
           )}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
          {show.description || "No description available."}
        </p>
      </div>

      {/* Action */}
      <div className="flex items-center px-4 border-l border-white/5 bg-muted/5 shrink-0">
        <Link to={`/shows/${show.id}`}>
          <Button size="sm" variant="secondary" className="h-8 text-xs font-medium whitespace-nowrap">
            View Details
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

const PAGE_SIZE = 12;

const Shows = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "All");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Dynamic filter options
  const [availableCities, setAvailableCities] = useState<string[]>(["All"]);
  const [availableGenres, setAvailableGenres] = useState<string[]>(["All"]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCity !== "All") params.set("city", selectedCity);
    if (selectedGenre !== "All") params.set("genre", selectedGenre);
    if (dateFilter) params.set("date", dateFilter);
    setSearchParams(params, { replace: true });
  }, [selectedCity, selectedGenre, dateFilter, setSearchParams]);

  // Fetch metadata for filters
  useEffect(() => {
    const fetchFilterMetadata = async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("city, genre, niche")
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching filter metadata:", error);
        return;
      }

      const uniqueCities = Array.from(new Set(data.map((s) => s.city).filter(Boolean))) as string[];
      setAvailableCities(["All", ...uniqueCities.sort()]);

      const genres = new Set<string>();
      data.forEach((s) => {
        if (s.genre) genres.add(s.genre);
      });

      const hasUniversity = data.some((s) => s.niche === "university");
      const hasLocal = data.some((s) => s.niche === "local");

      const genreList = Array.from(genres).sort();
      if (hasLocal) genreList.push("Local/Community");
      if (hasUniversity) genreList.push("University Theater");

      setAvailableGenres(["All", ...genreList]);
    };

    fetchFilterMetadata();
  }, []);

  // Fetch function for shows
  const fetchShows = useCallback(async (targetPage = 0) => {
    // Treat targetPage 0 as a reset
    if (targetPage === 0) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const from = targetPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("shows")
      .select(`
        id,
        title,
        description,
        date,
        venue,
        city,
        niche,
        genre,
        ticket_link,
        poster_url,
        producer_id:profiles!producer_id (
          id,
          group_name,
          avatar_url
        )
      `)
      .eq("status", "approved")
      .range(from, to);

    if (selectedCity !== "All") {
      query = query.eq("city", selectedCity);
    }

    if (selectedGenre !== "All") {
      const nicheValue = selectedGenre === "Local/Community" ? "local" : "university";
      query = query.eq("niche", nicheValue);
    }

    if (dateFilter) {
      query = query.gte("date", dateFilter);
    }

    if (debouncedSearchQuery) {
      query = query.or(`title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
    }

    const { data, error } = await query.order("date", { ascending: true });

    if (error) {
      console.error("Error fetching shows:", error);
    } else {
      const fetchedShows = data as Show[];

      if (targetPage === 0) {
        setShows(fetchedShows);
      } else {
        setShows((prev) => [...prev, ...fetchedShows]);
      }

      setPage(targetPage);
      setHasMore(fetchedShows.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [selectedCity, selectedGenre, dateFilter, debouncedSearchQuery]);

  // Fetch approved shows (reset when filters change)
  useEffect(() => {
    fetchShows(0);
  }, [fetchShows]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    await fetchShows(0);
  };

  // We use the raw shows array now as filtering is done server-side
  const filteredShows = shows;

  const clearFilters = () => {
    setSelectedCity("All");
    setSelectedGenre("All");
    setDateFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCity !== "All" || selectedGenre !== "All" || dateFilter || searchQuery;

  const activeFilterCount = [
    selectedCity !== "All",
    selectedGenre !== "All",
    !!dateFilter,
    !!searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pt-4 sm:pt-8 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-secondary uppercase tracking-[0.2em] text-xs sm:text-sm font-medium">
                Now Showing
              </span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              All Productions
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Discover theatrical productions across Metro Manila
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 sm:mb-12 space-y-4 sm:space-y-6"
          >
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for shows, venues, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card border-secondary/30 focus:border-secondary h-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills - Desktop: always visible, Mobile: collapsible */}
            {/* Desktop Filters */}
            <div className="hidden sm:block space-y-4">
              {/* City Filter */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <span className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 mr-2">
                  <MapPin className="w-3 h-3" /> City:
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableCities.map((city) => (
                    <motion.button
                      key={city}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCity(city)}
                      className={`px-3 py-1.5 text-xs sm:text-sm border transition-all duration-300 touch-target ${
                        selectedCity === city
                          ? "border-secondary bg-secondary/20 text-secondary shadow-[0_0_15px_hsl(43_72%_52%/0.3)]"
                          : "border-secondary/30 text-muted-foreground hover:border-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {city}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Genre Filter */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <span className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 mr-2">
                  <Filter className="w-3 h-3" /> Type:
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <motion.button
                      key={genre}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1.5 text-xs sm:text-sm border transition-all duration-300 touch-target ${
                        selectedGenre === genre
                          ? "border-secondary bg-secondary/20 text-secondary shadow-[0_0_15px_hsl(43_72%_52%/0.3)]"
                          : "border-secondary/30 text-muted-foreground hover:border-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {genre}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex justify-center items-center gap-2">
                <span className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> From:
                </span>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40 bg-card border-secondary/30 focus:border-secondary text-sm h-10"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filters - Collapsible */}
            <div className="sm:hidden">
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-card border border-secondary/30 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 p-4 bg-card/50 border border-secondary/20 rounded-lg">
                  {/* City Filter */}
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> City
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`px-3 py-1.5 text-xs border transition-all ${
                            selectedCity === city
                              ? "border-secondary bg-secondary/20 text-secondary"
                              : "border-secondary/30 text-muted-foreground"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre Filter */}
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Type
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableGenres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => setSelectedGenre(genre)}
                          className={`px-3 py-1.5 text-xs border transition-all ${
                            selectedGenre === genre
                              ? "border-secondary bg-secondary/20 text-secondary"
                              : "border-secondary/30 text-muted-foreground"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> From Date
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex-1 bg-background border-secondary/30 text-sm h-10"
                      />
                      {dateFilter && (
                        <button
                          onClick={() => setDateFilter("")}
                          className="text-muted-foreground hover:text-foreground transition-colors p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Active Filters & Clear */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {(!profile || profile.role !== "producer") && (
            <div className="mb-8">
              <AdBanner format="horizontal" variant="placeholder" />
            </div>
          )}

          {/* Results Count & View Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              {loading
                ? "Loading..."
                : `${filteredShows.length} ${filteredShows.length === 1 ? "production" : "productions"} found`}
            </div>

            <div className="flex items-center gap-2 bg-card border border-secondary/30 rounded-lg p-1 order-1 sm:order-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-secondary/20 text-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-secondary/20 text-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Shows Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredShows.length === 0 ? (
            <div className="max-w-md mx-auto py-12">
              <PremiumEmptyState
                title="No Productions Found"
                description="We couldn't find any shows matching your current filters. Try adjusting your search or check back later for new productions."
                icon={Ticket}
                action={
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-secondary/30 text-secondary hover:bg-secondary/10 hover:text-secondary"
                  >
                    Clear All Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <motion.div
                layout
                className={viewMode === 'grid'
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                  : "flex flex-col gap-4 max-w-3xl mx-auto"
                }
              >
                <AnimatePresence mode="popLayout">
                  {filteredShows.map((show, index) => (
                    viewMode === 'grid' ? (
                      <ShowCard key={show.id} show={show} index={index} />
                    ) : (
                      <ShowListItem key={show.id} show={show} />
                    )
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() => fetchShows(page + 1)}
                    variant="outline"
                    disabled={loadingMore}
                    className="min-w-[150px] border-secondary/30 text-secondary hover:bg-secondary/10"
                  >
                    {loadingMore ? (
                      <>
                        <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </PullToRefresh>
      <Footer />
    </div>
  );
};

export default Shows;
