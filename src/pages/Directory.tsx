import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProducerListSkeleton } from "@/components/ui/skeleton-loaders";

const cities = ["All", "Mandaluyong", "Taguig", "Manila", "Quezon City", "Makati"];
const niches = ["All", "Local/Community-based", "University Theater Group"];

interface TheaterGroup {
  id: string;
  group_name: string;
  description: string | null;
  niche: "local" | "university" | null;
  city?: string;
}

// Demo theater groups for display when no real data
const demoGroups: TheaterGroup[] = [
  {
    id: "demo-1",
    group_name: "Tanghalang Pilipino",
    description: "The resident theater company of the Cultural Center of the Philippines, dedicated to producing Filipino plays and musicals.",
    niche: "local",
    city: "Manila"
  },
  {
    id: "demo-2",
    group_name: "Manila Repertory",
    description: "One of the leading theater companies in the Philippines, known for innovative productions of both Filipino and international plays.",
    niche: "local",
    city: "Manila"
  },
  {
    id: "demo-3",
    group_name: "Ateneo Blue Repertory",
    description: "The premier student theater organization of Ateneo de Manila University, producing quality musicals and plays since 1993.",
    niche: "university",
    city: "Quezon City"
  },
  {
    id: "demo-4",
    group_name: "UP Repertory Company",
    description: "The official theater group of the University of the Philippines, dedicated to Filipino drama and experimental theater.",
    niche: "university",
    city: "Quezon City"
  },
  {
    id: "demo-5",
    group_name: "PETA",
    description: "Asia's largest theater company, committed to community-based and educational theater for social change since 1967.",
    niche: "local",
    city: "Quezon City"
  },
  {
    id: "demo-6",
    group_name: "Trumpets Inc.",
    description: "A Manila-based theater company known for world-class productions and family-friendly musicals.",
    niche: "local",
    city: "Makati"
  },
  {
    id: "demo-7",
    group_name: "RTU Drama Ensemble",
    description: "The theater arm of Rizal Technological University, nurturing young Filipino theater talents.",
    niche: "university",
    city: "Mandaluyong"
  },
  {
    id: "demo-8",
    group_name: "De La Salle Theater Guild",
    description: "The official theater organization of De La Salle University Manila, producing original Filipino works.",
    niche: "university",
    city: "Manila"
  },
  {
    id: "demo-9",
    group_name: "Repertory Philippines",
    description: "One of the longest-running theater companies in Asia, bringing Broadway and West End productions to Manila.",
    niche: "local",
    city: "Makati"
  }
];

const Directory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All");
  const [selectedNiche, setSelectedNiche] = useState(searchParams.get("niche") || "All");
  const [groups, setGroups] = useState<TheaterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCity !== "All") params.set("city", selectedCity);
    if (selectedNiche !== "All") params.set("niche", selectedNiche);
    setSearchParams(params, { replace: true });
  }, [selectedCity, selectedNiche, setSearchParams]);

  // Fetch producer profiles
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, group_name, description, niche")
        .eq("role", "producer")
        .not("group_name", "is", null);

      if (error) {
        console.error("Error fetching groups:", error);
        setGroups([]);
      } else {
        setGroups(data as TheaterGroup[]);
      }
      setLoading(false);
    };

    fetchGroups();
  }, []);

  // Use demo groups if no real groups exist
  const displayGroups = groups.length > 0 ? groups : demoGroups;
  const isUsingDemo = groups.length === 0 && !loading;

  const filteredGroups = displayGroups.filter((group) => {
    const matchesSearch = group.group_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "All" || group.city === selectedCity;
    const matchesNiche = selectedNiche === "All" || 
      (selectedNiche === "Local/Community-based" && group.niche === "local") ||
      (selectedNiche === "University Theater Group" && group.niche === "university");
    return matchesSearch && matchesCity && matchesNiche;
  });

  const getNicheLabel = (niche: string | null) => {
    switch (niche) {
      case "local":
        return "Local/Community";
      case "university":
        return "University";
      default:
        return "Theater Group";
    }
  };

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
              Theater Directory
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore theater groups across Metro Manila
              {selectedCity !== "All" && <span className="text-secondary"> in {selectedCity}</span>}
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
                placeholder="Search theater groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card border-secondary/30 focus:border-secondary"
              />
            </div>

            {/* Filter Buttons - City */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-muted-foreground text-sm mr-2">City:</span>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 text-sm border transition-all duration-300 ${
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

            {/* Filter Buttons - Niche */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-muted-foreground text-sm mr-2 self-center">Type:</span>
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-4 py-2 text-sm border transition-all duration-300 ${
                    selectedNiche === niche
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-secondary/30 text-muted-foreground hover:border-secondary/60"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Groups Grid */}
          {loading ? (
            <ProducerListSkeleton count={6} />
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    {isUsingDemo ? (
                      <div className="block bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group cursor-default">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-primary/20 flex items-center justify-center text-2xl">
                            🎭
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-secondary uppercase tracking-wider">
                              {getNicheLabel(group.niche)}
                            </span>
                            {group.city && (
                              <span className="text-xs text-muted-foreground">
                                {group.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-serif text-xl text-foreground mb-2">
                          {group.group_name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {group.description || "A theater group in Metro Manila."}
                        </p>
                      </div>
                    ) : (
                      <Link 
                        to={`/producer/${group.id}`}
                        className="block bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-primary/20 flex items-center justify-center text-2xl">
                            🎭
                          </div>
                          <span className="text-xs text-secondary uppercase tracking-wider">
                            {getNicheLabel(group.niche)}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-secondary transition-colors">
                          {group.group_name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {group.description || "A theater group in Metro Manila."}
                        </p>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {isUsingDemo && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground text-sm mt-8"
                >
                  Featured theater groups • Real listings coming soon
                </motion.p>
              )}
            </>
          )}

          {!loading && filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No theater groups found matching your criteria.</p>
              <p className="text-sm text-muted-foreground">
                Are you a theater group? <Link to="/login" className="text-secondary hover:underline">Join StageLink</Link> to be listed here.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Directory;
