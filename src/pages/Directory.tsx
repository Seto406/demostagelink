import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProducerListSkeleton } from "@/components/ui/skeleton-loaders";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Group logos
import artistangArtletsLogo from "@/assets/groups/artistang-artlets.png";
import rtuDulaangRizaliaLogo from "@/assets/groups/rtu-dulaang-rizalia.png";
import starTcuLogo from "@/assets/groups/star-tcu.jpg";
import culturaUmakLogo from "@/assets/groups/cultura-umak.png";
import genesisToJesusLogo from "@/assets/groups/genesis-to-jesus.jpg";
import pupTanghalangMolaveLogo from "@/assets/groups/pup-tanghalang-molave.jpg";
import feuTheaterGuildLogo from "@/assets/groups/feu-theater-guild.jpg";
import pnuThespianLogo from "@/assets/groups/pnu-thespian.jpg";
import dulaangUpLogo from "@/assets/groups/dulaang-up.jpg";

const cities = ["All", "Mandaluyong", "Taguig", "Manila", "Quezon City", "Makati"];
const niches = ["All", "Local/Community-based", "University Theater Group"];

interface TheaterGroup {
  id: string;
  group_name: string;
  description: string | null;
  niche: "local" | "university" | null;
  city?: string;
  logo?: string;
}

// Demo theater groups for display when no real data
const demoGroups: TheaterGroup[] = [
  {
    id: "demo-1",
    group_name: "Artistang Artlets",
    description: "The long-standing theatre guild of the Faculty of Arts and Letters of the University of Santo Tomas, built upon the virtues of respect and hierarchy, fueled by passion for theatre and the performing arts.",
    niche: "university",
    city: "Manila",
    logo: artistangArtletsLogo
  },
  {
    id: "demo-2",
    group_name: "RTU Dulaang Rizalia",
    description: "The official theater arts group of Rizal Technological University, beaming with masterful storytelling, dedicated preparation, and high-caliber theatrical artistry.",
    niche: "university",
    city: "Mandaluyong",
    logo: rtuDulaangRizaliaLogo
  },
  {
    id: "demo-3",
    group_name: "Trick Creative Production",
    description: "A theater production group that presents stage plays and musicals, making works include original Filipino musicals and plays, and unconventional theatre performances.",
    niche: "local",
    city: "Quezon City"
  },
  {
    id: "demo-4",
    group_name: "Student Theater Artist Repertory (STAR)",
    description: "Student theatre guild composed of passionate and creative university students at TCU, ready to bring stories to life on stage and behind the scenes.",
    niche: "university",
    city: "Taguig",
    logo: starTcuLogo
  },
  {
    id: "demo-5",
    group_name: "Cultura Performing Arts Guild (UMAK)",
    description: "Theater guild from the University of Makati that aims to inspire and provide artistic and intellectual capabilities through dance, music, and variety of performing-arts works.",
    niche: "university",
    city: "Makati",
    logo: culturaUmakLogo
  },
  {
    id: "demo-6",
    group_name: "Genesis To Jesus Productions Inc.",
    description: "A local theatre production from the City of Mandaluyong that produces plays or performances with a religious or evangelistic orientation.",
    niche: "local",
    city: "Mandaluyong",
    logo: genesisToJesusLogo
  },
  {
    id: "demo-7",
    group_name: "PUP Tanghalang Molave",
    description: "Student theatre organization of Polytechnic University of the Philippines (PUP) that stages Filipino plays (both classical/commentary works) in student-led productions, engaging with social issues, history, and contemporary themes.",
    niche: "university",
    city: "Manila",
    logo: pupTanghalangMolaveLogo
  },
  {
    id: "demo-8",
    group_name: "FEU Theater Guild (FTG)",
    description: "The theater organization of Far Eastern University, known for a history going back decades, mixing traditional and experimental theater.",
    niche: "university",
    city: "Manila",
    logo: feuTheaterGuildLogo
  },
  {
    id: "demo-9",
    group_name: "PNU The Thespian Society",
    description: "A non-stock, non-profit, university-based theatre organization based at Philippine National University (PNU) using theatre and the arts as a means of education and expression.",
    niche: "university",
    city: "Manila",
    logo: pnuThespianLogo
  },
  {
    id: "demo-10",
    group_name: "Dulaang UP (DUP)",
    description: "The official theatre group of University of the Philippines – Diliman that stages both classics and Filipino plays, often by established and emerging playwrights.",
    niche: "university",
    city: "Quezon City",
    logo: dulaangUpLogo
  }
];

const ITEMS_PER_PAGE = 9;

const Directory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All");
  const [selectedNiche, setSelectedNiche] = useState(searchParams.get("niche") || "All");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [groups, setGroups] = useState<TheaterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, selectedNiche, debouncedSearchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCity !== "All") params.set("city", selectedCity);
    if (selectedNiche !== "All") params.set("niche", selectedNiche);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [selectedCity, selectedNiche, currentPage, setSearchParams]);

  // Fetch producer profiles
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);

      // If a city is selected, we cannot filter by it on server, and real data doesn't have city.
      // So we assume no real data matches. We clear groups so demoGroups can take over (or show empty).
      if (selectedCity !== "All") {
        setGroups([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("profiles")
        .select("id, group_name, description, niche", { count: "exact" })
        .eq("role", "producer")
        .not("group_name", "is", null);

      // Apply filters
      if (selectedNiche !== "All") {
        if (selectedNiche === "Local/Community-based") {
          query = query.eq("niche", "local");
        } else if (selectedNiche === "University Theater Group") {
          query = query.eq("niche", "university");
        }
      }

      if (debouncedSearchQuery) {
        query = query.ilike("group_name", `%${debouncedSearchQuery}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.error("Error fetching groups:", error);
        setGroups([]);
        setTotalPages(1);
      } else {
        setGroups(data as TheaterGroup[]);
        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        } else {
          setTotalPages(1);
        }
      }
      setLoading(false);
    };

    fetchGroups();
  }, [selectedNiche, debouncedSearchQuery, currentPage, selectedCity]);

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
                      <Link 
                        to={`/group/${group.id}`}
                        className="block bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full overflow-hidden border-2 border-secondary/30 transition-all duration-200 group-hover:scale-105 group-hover:border-secondary/50 shadow-sm">
                            {group.logo ? (
                              <img 
                                src={group.logo} 
                                alt={`${group.group_name} logo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">🎭</span>
                            )}
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
                        <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-secondary transition-colors">
                          {group.group_name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {group.description || "A theater group in Metro Manila."}
                        </p>
                      </Link>
                    ) : (
                      <Link 
                        to={`/producer/${group.id}`}
                        className="block bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full overflow-hidden border-2 border-secondary/30 transition-all duration-200 group-hover:scale-105 group-hover:border-secondary/50 shadow-sm">
                            {group.logo ? (
                              <img 
                                src={group.logo} 
                                alt={`${group.group_name} logo`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">🎭</span>
                            )}
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

              {!isUsingDemo && totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage((p) => p - 1);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage((p) => p + 1);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
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
