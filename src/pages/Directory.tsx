import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserPlus, LayoutGrid, List } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProducerListSkeleton } from "@/components/ui/skeleton-loaders";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";

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

// Toggle to control visibility of demo placeholder groups
const SHOW_DEMO_GROUPS = true;
const ITEMS_PER_PAGE = 12;

const cities = ["All", "Mandaluyong", "Taguig", "Manila", "Quezon City", "Makati"];
const niches = ["All", "Local/Community-based", "University Theater Group"];

interface TheaterGroup {
  id: string;
  group_name: string;
  description: string | null;
  niche: "local" | "university" | null;
  city?: string;
  logo?: string;
  address?: string | null;
}

// Demo theater groups for display when no real data
// Helper for niche labels
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

const DirectoryListItem = ({
  group,
  isUsingDemo,
}: {
  group: TheaterGroup;
  isUsingDemo: boolean;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex h-[120px] bg-card border border-secondary/20 rounded-xl overflow-hidden hover:border-secondary/50 transition-colors group"
    >
      {/* Logo */}
      <div className="w-[80px] sm:w-[100px] h-full relative shrink-0 bg-black/5 p-2 flex items-center justify-center">
         <div className="w-14 h-14 bg-primary/10 flex items-center justify-center rounded-xl overflow-hidden border border-secondary/30 bg-background relative">
            {group.logo ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                  style={{ backgroundImage: `url(${group.logo})` }}
                />
                <img
                  src={group.logo}
                  alt={`${group.group_name} logo`}
                  className="relative z-10 w-full h-full object-contain"
                />
              </>
            ) : (
              <span className="text-xl font-serif text-secondary font-bold">{(group.group_name?.[0] || 'T').toUpperCase()}</span>
            )}
         </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
        <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif font-bold text-base sm:text-lg text-foreground truncate group-hover:text-secondary transition-colors">
                {group.group_name}
            </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1 mb-2">
             <span className="text-secondary uppercase tracking-wider">
                 {getNicheLabel(group.niche)}
             </span>
             {group.city && (
                 <span>• {group.city}</span>
             )}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
          {group.description || "No description available."}
        </p>
      </div>

      {/* Action */}
      <div className="flex items-center px-4 border-l border-white/5 bg-muted/5 shrink-0">
        <Link to={isUsingDemo ? `/group/${group.id}` : `/producer/${group.id}`}>
          <Button size="sm" variant="secondary" className="h-8 text-xs font-medium whitespace-nowrap">
            View
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

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

const Directory = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All");
  const [selectedNiche, setSelectedNiche] = useState(searchParams.get("niche") || "All");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [groups, setGroups] = useState<TheaterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCity !== "All") params.set("city", selectedCity);
    if (selectedNiche !== "All") params.set("niche", selectedNiche);
    setSearchParams(params, { replace: true });
  }, [selectedCity, selectedNiche, setSearchParams]);

  // Fetch producer profiles
  const fetchGroups = useCallback(async (currentPage: number, isLoadMore: boolean) => {
    if (isLoadMore) {
        setIsFetchingMore(true);
    } else {
        setLoading(true);
    }

    try {
        let query = supabase
            .from("profiles")
            .select("id, group_name, description, niche, address, group_logo_url")
            .eq("role", "producer")
            .not("group_name", "is", null);

        // Server-side filtering
        if (debouncedSearchQuery) {
            query = query.ilike("group_name", `%${debouncedSearchQuery}%`);
        }

        if (selectedNiche !== "All") {
             if (selectedNiche === "Local/Community-based") {
                query = query.eq("niche", "local");
             } else if (selectedNiche === "University Theater Group") {
                query = query.eq("niche", "university");
             }
        }

        // Apply City filter if available on server side (via address)
        if (selectedCity !== "All") {
             query = query.ilike("address", `%${selectedCity}%`);
        }

        // Pagination
        const from = currentPage * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE; // Fetch one extra to check hasMore

        const { data, error } = await query.range(from, to);

        if (error) {
            console.error("Error fetching groups:", error);
            if (!isLoadMore) setGroups([]);
        } else {
            const mappedData = (data || []).map(p => ({
                ...p,
                city: p.address || undefined,
                logo: p.group_logo_url
            })) as TheaterGroup[];

            const hasNextPage = mappedData.length > ITEMS_PER_PAGE;
            const newGroups = hasNextPage ? mappedData.slice(0, ITEMS_PER_PAGE) : mappedData;

            setHasMore(hasNextPage);

            if (isLoadMore) {
                setGroups(prev => [...prev, ...newGroups]);
            } else {
                setGroups(newGroups);
            }
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    } finally {
        setLoading(false);
        setIsFetchingMore(false);
    }
  }, [debouncedSearchQuery, selectedNiche, selectedCity]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    // Don't clear groups here to avoid flash, but handle in fetch
    // fetchGroups will be called with page=0 because page reset or direct call?
    // We'll rely on the fetchGroups call.
    fetchGroups(0, false);
  }, [fetchGroups]);

  const loadMore = () => {
    if (!loading && !isFetchingMore && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGroups(nextPage, true);
    }
  };

  const handleJoinRequest = async (e: React.MouseEvent, group: TheaterGroup) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast.error("Please login to join a group.");
        return;
    }

    setJoiningGroupId(group.id);
    try {
      // Check for existing membership/application
      const { data: existingMember, error: fetchError } = await supabase
        .from('group_members' as any)
        .select('status')
        .eq('user_id', user.id)
        .eq('group_id', group.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingMember) {
        if (existingMember.status === 'pending') {
          toast.info("You already have a pending application.");
          setJoiningGroupId(null);
          return;
        } else if (existingMember.status === 'active') {
          toast.info("You are already a member of this group.");
          setJoiningGroupId(null);
          return;
        }
      }

      const { error } = await supabase
        .from('group_members' as any)
        .insert([{
          user_id: user.id,
          group_id: group.id,
          member_name: profile?.username || 'Unknown User',
          role_in_group: 'member',
          status: 'pending'
        }]);

      if (error) throw error;

      await createNotification({
        userId: group.id,
        actorId: user.id,
        type: 'membership_application',
        title: 'New Member Application',
        message: `${profile?.group_name || profile?.username || 'Someone'} wants to join your group.`,
        link: `/dashboard/members`
      });

      toast.success(`Application sent to ${group.group_name}!`);
    } catch (error: any) {
      console.error("Error sending membership application:", error);
      toast.error(error.message || "Failed to send application");
    } finally {
      setJoiningGroupId(null);
    }
  };

  // Logic for Demo Groups Fallback
  // If we have real groups, we use them.
  // If we have NO real groups (after loading), AND show demo is on, we use demo groups.
  // IMPORTANT: If we use Demo Groups, we must apply CLIENT-SIDE filtering to them,
  // because the server-side filters obviously returned nothing (since we are here).

  const isUsingDemo = groups.length === 0 && !loading && SHOW_DEMO_GROUPS;

  const displayGroups = isUsingDemo ? demoGroups.filter((group) => {
    const matchesSearch = group.group_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesCity = selectedCity === "All" || group.city === selectedCity;
    const matchesNiche = selectedNiche === "All" || 
      (selectedNiche === "Local/Community-based" && group.niche === "local") ||
      (selectedNiche === "University Theater Group" && group.niche === "university");
    return matchesSearch && matchesCity && matchesNiche;
  }) : groups;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-8 pb-16">
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

          {/* Results Count & View Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              {loading
                ? "Loading..."
                : `${displayGroups.length} ${displayGroups.length === 1 ? "group" : "groups"} found`}
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

          {/* Groups Grid/List */}
          {loading ? (
            <ProducerListSkeleton count={6} />
          ) : (
            <>
              <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {displayGroups.map((group, index) => (
                  viewMode === 'list' ? (
                     <DirectoryListItem
                        key={group.id}
                        group={group}
                        isUsingDemo={isUsingDemo}
                     />
                  ) : (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      {isUsingDemo ? (
                        <Link
                          to={`/group/${group.id}`}
                          className="block bg-card border border-secondary/20 p-6 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-xl overflow-hidden border-2 border-secondary/30 transition-all duration-200 group-hover:scale-105 group-hover:border-secondary/50 shadow-sm relative">
                              {group.logo ? (
                                <>
                                  <div
                                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                                    style={{ backgroundImage: `url(${group.logo})` }}
                                  />
                                  <img
                                    src={group.logo}
                                    alt={`${group.group_name} logo`}
                                    className="relative z-10 w-full h-full object-contain"
                                  />
                                </>
                              ) : (
                                <span className="text-2xl font-serif text-secondary font-bold">{(group.group_name?.[0] || 'T').toUpperCase()}</span>
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
                        <div className="block bg-card border border-secondary/20 transition-all duration-300 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(43_72%_52%/0.1)] group rounded-xl overflow-hidden h-full flex flex-col">
                          <Link
                            to={`/producer/${group.id}`}
                            className="block p-6 flex-1"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-xl overflow-hidden border-2 border-secondary/30 transition-all duration-200 group-hover:scale-105 group-hover:border-secondary/50 shadow-sm relative">
                                {group.logo ? (
                                  <>
                                    <div
                                      className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                                      style={{ backgroundImage: `url(${group.logo})` }}
                                    />
                                    <img
                                      src={group.logo}
                                      alt={`${group.group_name} logo`}
                                      className="relative z-10 w-full h-full object-contain"
                                    />
                                  </>
                                ) : (
                                <span className="text-2xl font-serif text-secondary font-bold">{(group.group_name?.[0] || 'T').toUpperCase()}</span>
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
                          {(!user || (profile?.role !== 'producer' && profile?.role !== 'admin')) && (
                              <div className="px-6 pb-6 pt-0 mt-auto">
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={(e) => handleJoinRequest(e, group)}
                                      disabled={joiningGroupId === group.id}
                                  >
                                      {joiningGroupId === group.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                          <>
                                              <UserPlus className="w-4 h-4 mr-2" />
                                              Join as Member
                                          </>
                                      )}
                                  </Button>
                              </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                ))}
              </div>
              
              {/* Load More Button */}
              {!isUsingDemo && hasMore && (
                <div className="mt-12 text-center">
                    <Button
                        onClick={loadMore}
                        disabled={isFetchingMore}
                        variant="outline"
                        className="min-w-[150px]"
                    >
                        {isFetchingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                </div>
              )}

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

          {!loading && displayGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No theater groups found matching your criteria.</p>
              <p className="text-sm text-muted-foreground">
                Are you a theater group? <Link to="/login" className="text-secondary hover:underline">Join StageLink</Link> to be listed here.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Directory;
