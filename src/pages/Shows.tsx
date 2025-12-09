import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Filter, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShowCardSkeleton as SkeletonCard } from "@/components/ui/skeleton-loaders";
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

const cities = ["All", "Mandaluyong", "Taguig", "Manila", "Quezon City", "Makati"];
const genres = ["All", "Local/Community", "University"];

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  poster_url: string | null;
  profiles: {
    id: string;
    group_name: string | null;
  } | null;
}

// Enhanced Show Card component
const ShowCard = ({ show, index }: { show: Show; index: number }) => {
  const posterUrl = posterMap[show.title] || show.poster_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      layout
    >
      <Link
        to={`/show/${show.id}`}
        className="block bg-card border border-secondary/20 overflow-hidden group hover-lift card-glow relative"
      >
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden">
          {posterUrl ? (
            <motion.img
              src={posterUrl}
              alt={show.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl opacity-30">🎭</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

          {/* Niche badge */}
          {show.niche && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3"
            >
              <span className="px-2 py-1 text-xs uppercase tracking-wider bg-secondary/20 border border-secondary/40 text-secondary backdrop-blur-sm">
                {show.niche === "university" ? "University" : "Local"}
              </span>
            </motion.div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2 group-hover:text-secondary transition-colors duration-300">
              {show.title}
            </h3>
            <Link
              to={`/producer/${show.profiles?.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-secondary/80 hover:text-secondary hover:underline transition-colors"
            >
              {show.profiles?.group_name || "Theater Group"}
            </Link>

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
          </div>

          {/* Hover overlay effect */}
          <div className="absolute inset-0 border-2 border-secondary/0 group-hover:border-secondary/50 transition-colors duration-300" />
        </div>
      </Link>
    </motion.div>
  );
};

const Shows = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "All");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCity !== "All") params.set("city", selectedCity);
    if (selectedGenre !== "All") params.set("genre", selectedGenre);
    if (dateFilter) params.set("date", dateFilter);
    setSearchParams(params, { replace: true });
  }, [selectedCity, selectedGenre, dateFilter, setSearchParams]);

  // Fetch approved shows
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shows")
        .select(`
          id,
          title,
          description,
          date,
          venue,
          city,
          niche,
          poster_url,
          profiles:producer_id (
            id,
            group_name
          )
        `)
        .eq("status", "approved")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching shows:", error);
      } else {
        setShows(data as Show[]);
      }
      setLoading(false);
    };

    fetchShows();
  }, []);

  const filteredShows = shows.filter((show) => {
    const matchesSearch =
      show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.profiles?.group_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = selectedCity === "All" || show.city === selectedCity;

    const matchesGenre =
      selectedGenre === "All" ||
      (selectedGenre === "Local/Community" && show.niche === "local") ||
      (selectedGenre === "University" && show.niche === "university");

    const matchesDate = !dateFilter || (show.date && show.date >= dateFilter);

    return matchesSearch && matchesCity && matchesGenre && matchesDate;
  });

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
      <Navbar />
      <main className="pt-20 sm:pt-24 pb-16">
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
              All Shows
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
                placeholder="Search shows or theater groups..."
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

            {/* Filter Pills - Scrollable on mobile */}
            <div className="space-y-4">
              {/* City Filter */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <span className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 mr-2">
                  <MapPin className="w-3 h-3" /> City:
                </span>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
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
                  {genres.map((genre) => (
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

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-center text-sm text-muted-foreground"
          >
            {loading
              ? "Loading..."
              : `${filteredShows.length} ${filteredShows.length === 1 ? "show" : "shows"} found`}
          </motion.div>

          {/* Shows Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredShows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4 opacity-30">🎭</div>
              <p className="text-muted-foreground mb-4">
                No shows found matching your criteria.
              </p>
              <button
                onClick={clearFilters}
                className="text-secondary hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredShows.map((show, index) => (
                  <ShowCard key={show.id} show={show} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shows;
