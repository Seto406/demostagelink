import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.profiles?.group_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === "All" || show.city === selectedCity;
    
    const matchesGenre = selectedGenre === "All" || 
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

  const hasActiveFilters = selectedCity !== "All" || selectedGenre !== "All" || dateFilter || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              All Shows
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover theatrical productions across Metro Manila
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 space-y-6"
          >
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search shows or theater groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card border-secondary/30 focus:border-secondary"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap justify-center gap-6">
              {/* City Filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> City:
                </span>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 text-sm border transition-all duration-300 ${
                      selectedCity === city
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-secondary/30 text-muted-foreground hover:border-secondary/60"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {/* Genre Filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Type:
                </span>
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 text-sm border transition-all duration-300 ${
                      selectedGenre === genre
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-secondary/30 text-muted-foreground hover:border-secondary/60"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> From:
                </span>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40 bg-card border-secondary/30 focus:border-secondary text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="text-center">
                <button
                  onClick={clearFilters}
                  className="text-secondary hover:text-secondary/80 text-sm underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>

          {/* Results Count */}
          <div className="mb-6 text-center text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredShows.length} ${filteredShows.length === 1 ? "show" : "shows"} found`}
          </div>

          {/* Shows Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading shows...</div>
          ) : filteredShows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No shows found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="text-secondary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredShows.map((show, index) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link 
                    to={`/show/${show.id}`}
                    className="block bg-card border border-secondary/20 overflow-hidden group hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(0_100%_25%/0.2)] transition-all duration-300"
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] relative overflow-hidden">
                      {show.poster_url ? (
                        <img 
                          src={show.poster_url} 
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-6xl opacity-30">🎭</span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2">
                          {show.title}
                        </h3>
                        <Link 
                          to={`/producer/${show.profiles?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-secondary hover:underline"
                        >
                          {show.profiles?.group_name || "Theater Group"}
                        </Link>
                        
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shows;
