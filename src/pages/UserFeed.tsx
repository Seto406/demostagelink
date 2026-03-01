import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { AdBanner } from "@/components/ads/AdBanner";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  LayoutDashboard,
  CalendarPlus,
  PenLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FeedPost } from "@/components/feed/FeedPost";
import { FeedUpdate } from "@/components/feed/FeedUpdate";
import { CreateUpdateModal } from "@/components/feed/CreateUpdateModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { useTour } from "@/contexts/TourContext";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

// Interfaces
export interface FeedShow {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  status?: string;
  is_premium?: boolean;
  created_at?: string;
  ticket_link?: string | null;
  producer_id?: {
    group_name: string | null;
    id: string;
    avatar_url: string | null;
    group_logo_url: string | null;
  };
  show_likes?: { count: number }[];
}

interface FeedPostType {
  id: string;
  content: string;
  media_urls: string[] | null;
  created_at: string;
  profile_id: string;
  profiles: {
    id: string;
    user_id?: string | null;
    username: string | null;
    group_name: string | null;
    avatar_url: string | null;
    group_logo_url: string | null;
  };
  post_likes?: { count: number }[];
}

type FeedItem =
  | { type: 'show'; data: FeedShow; created_at: string }
  | { type: 'post'; data: FeedPostType; created_at: string };

type AudienceFeedFilter = "all" | "shows" | "updates";

interface Producer {
  id: string;
  group_name: string | null;
  avatar_url: string | null;
  niche: string | null;
  group_logo_url: string | null;
}

interface ExtendedProfile {
  group_logo_url?: string | null;
  avatar_url?: string | null;
  group_name?: string | null;
  role?: string;
}

const UserFeed = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const extendedProfile = profile as unknown as ExtendedProfile;
  const { isPro } = useSubscription();
  const { startTour } = useTour();
  const [audienceFilter, setAudienceFilter] = useState<AudienceFeedFilter>("all");

  // Modals
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form State
  const [groupName, setGroupName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const observerTarget = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch Feed Items (Shows + Posts)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingFeed,
    refetch
  } = useInfiniteQuery({
    queryKey: ['feed-mixed'],
    queryFn: async ({ pageParam }) => {
      // pageParam is the ISO timestamp cursor
      const cursor = pageParam as string; // defaults to current time in initialPageParam
      const limit = 10;

      // Fetch Shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select(`
          id,
          title,
          description,
          date,
          venue,
          city,
          poster_url,
          status,
          is_premium,
          created_at,
          price,
          producer_id:profiles!producer_id (
            group_name,
            id,
            avatar_url,
            group_logo_url
          )
        `)
        .eq("status", "approved")
        .lt("created_at", cursor)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (showsError) throw showsError;

      // Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          media_urls,
          created_at,
          profile_id,
          profiles:profile_id (
            id,
            user_id,
            username,
            group_name,
            avatar_url,
            group_logo_url
          )
        `)
        .lt("created_at", cursor)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (postsError) throw postsError;

      // Combine and Sort
      const mixedItems: FeedItem[] = [];

      showsData?.forEach((show) => {
        mixedItems.push({
          type: 'show',
          data: show as FeedShow,
          created_at: show.created_at
        });
      });

      postsData?.forEach((post) => {
        mixedItems.push({
          type: 'post',
          data: post as FeedPostType,
          created_at: post.created_at
        });
      });

      // Sort desc by created_at
      mixedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Slice to limit
      // This ensures we have a consistent page size and the cursor for the next page
      // is the oldest item in THIS page, preventing skipping of items in the "denser" list.
      return mixedItems.slice(0, limit);
    },
    initialPageParam: new Date().toISOString(),
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      // Cursor is the created_at of the very last item in the page
      return lastPage[lastPage.length - 1].created_at;
    },
  });

  const feedItems = useMemo(() => data?.pages.flat() || [], [data]);
  const visibleFeedItems = useMemo(() => {
    if (audienceFilter === "shows") {
      return feedItems.filter((item) => item.type === "show");
    }
    if (audienceFilter === "updates") {
      return feedItems.filter((item) => item.type === "post");
    }
    return feedItems;
  }, [feedItems, audienceFilter]);

  // Fetch producer's recent shows (Sidebar)
  const { data: recentShows } = useQuery({
    queryKey: ['producer-recent-shows', profile?.id],
    queryFn: async () => {
       if (!user || !profile?.id) return [];
       const { data } = await supabase
         .from('shows')
         .select('id, title, status')
         .eq('producer_id', profile.id)
         .order('created_at', { ascending: false })
         .limit(3);
       return data || [];
    },
    enabled: !!user && !!profile?.id && profile?.role === 'producer'
  });

  // Fetch suggested producers (Sidebar)
  const { data: suggestedProducers = [] } = useQuery({
    queryKey: ['suggested-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, group_name, avatar_url, niche, group_logo_url")
        .eq("role", "producer")
        .not("group_name", "is", null)
        .neq("group_name", "")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Producer[];
    },
  });

  // Start Tour Effect
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("stagelink_has_seen_tour");
    if (!loading && !hasSeenTour && suggestedProducers.length > 0) {
      localStorage.setItem("stagelink_tour_target_producer", suggestedProducers[0].id);
      const timer = setTimeout(() => {
        startTour();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, suggestedProducers, startTour]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleProducerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("producer_requests").insert({
      user_id: user?.id,
      group_name: groupName,
      portfolio_link: portfolioLink,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted", description: "Admin will review your request." });
      setProducerRequestModal(false);
    }
    setSubmitting(false);
  };

  const handlePostSuccess = () => {
      refetch();
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><BrandedLoader /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pt-8 container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row justify-center gap-8">

          {/* Feed (Center) */}
        <main className="w-full max-w-2xl pb-24">

          {profile?.role !== "producer" && (
            <Card className="mb-4 border-secondary/20 bg-card/40 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All", value: "all" as const },
                    { label: "Shows", value: "shows" as const },
                    { label: "Updates", value: "updates" as const },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      size="sm"
                      variant={audienceFilter === filter.value ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setAudienceFilter(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Creation Area - Visible only to Producers */}
          {profile?.role === "producer" && (
            <Card className="mb-6 border-secondary/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar>
                    <AvatarImage src={extendedProfile?.group_logo_url || profile.avatar_url || undefined} />
                    <AvatarFallback>{profile.group_name?.[0] || "P"}</AvatarFallback>
                  </Avatar>
                  <div
                    className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-muted-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => setShowUpdateModal(true)}
                  >
                    Share an update with your audience...
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-secondary/10">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                        onClick={() => setShowProductionModal(true)}
                    >
                        <CalendarPlus className="w-5 h-5 text-secondary" />
                        <span className="text-sm font-medium">New Production</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                        onClick={() => setShowUpdateModal(true)}
                    >
                        <PenLine className="w-5 h-5 text-[#3b82f6]" />
                        <span className="text-sm font-medium">Post Update</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feed Items */}
          {loadingFeed && feedItems.length === 0 ? (
            <div className="flex justify-center py-12"><BrandedLoader size="md" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-6 w-full">
              {visibleFeedItems.map((item, index) => (
                <div key={`${item.type}-${item.data.id}`} data-tour={index === 0 ? "feed-post" : undefined}>
                  {item.type === 'show' ? (
                      <FeedPost
                        show={item.data as FeedShow}
                        dataTour={index === 0 ? "feed-interaction" : undefined}
                      />
                  ) : (
                      <FeedUpdate post={item.data as FeedPostType} onDelete={() => refetch()} />
                  )}

                  {index === 1 && !isPro && <AdBanner format="horizontal" adClient="ca-pub-xxx" adSlot="xxx" />}
                </div>
              ))}

              {visibleFeedItems.length === 0 && (
                <Card className="border-secondary/20 bg-card/30">
                  <CardContent className="py-12 text-center">
                    <p className="font-medium">No {audienceFilter === "shows" ? "shows" : audienceFilter === "updates" ? "updates" : "items"} in this section yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try switching filters or pull down to refresh.</p>
                  </CardContent>
                </Card>
              )}

              <div ref={observerTarget} className="py-8 text-center text-muted-foreground text-sm">
                {isFetchingNextPage ? <BrandedLoader size="sm" /> : hasNextPage ? "Scroll for more" : "End of the stage."}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar (Right) */}
        <aside className="hidden lg:block w-[300px] shrink-0 space-y-6 sticky top-24 h-fit" data-tour="sidebar-suggestions">
          {/* Group Suggestions */}
          <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif flex items-center justify-between">
                <span>Suggested Groups</span>
                <TrendingUp className="w-4 h-4 text-secondary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {suggestedProducers.map(producer => (
                <Tooltip key={producer.id}>
                  <TooltipTrigger asChild>
                    <Link to={`/producer/${producer.id}`}>
                      <Avatar className="h-10 w-10 border-2 border-transparent hover:border-secondary transition-all">
                        <AvatarImage src={producer.group_logo_url || producer.avatar_url || undefined} />
                        <AvatarFallback>{(producer.group_name?.[0] || 'T').toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent><p>{producer.group_name}</p></TooltipContent>
                </Tooltip>
              ))}
            </CardContent>
          </Card>

          {/* Role-Based CTA Card */}
          {profile?.role === "producer" ? (
            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  My Productions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentShows?.map(show => (
                    <div key={show.id} className="flex justify-between items-center text-sm">
                      <span className="truncate max-w-[120px]" title={show.title}>{show.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${
                        show.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        show.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-muted/50 text-muted-foreground border-muted'
                      }`}>
                        {show.status === 'approved' ? 'Live' : show.status}
                      </span>
                    </div>
                  ))}
                  {(!recentShows || recentShows.length === 0) && (
                    <p className="text-muted-foreground text-xs">No shows yet.</p>
                  )}
                </div>
                <Link to="/dashboard">
                  <Button className="w-full mt-4 bg-secondary text-white hover:bg-secondary/90" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent">
              <CardContent className="p-6">
                <h3 className="font-serif font-bold text-lg mb-2">Join 20+ Groups</h3>
                <p className="text-sm text-muted-foreground mb-4">Start posting your own productions on StageLink today.</p>
                <Button variant="outline" className="w-full border-secondary text-secondary" onClick={() => setProducerRequestModal(true)}>
                  Start Your Group
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      </PullToRefresh>

      <Footer />

      {/* Modals */}
      <ProductionModal open={showProductionModal} onOpenChange={setShowProductionModal} showToEdit={null} />

      <CreateUpdateModal
          open={showUpdateModal}
          onOpenChange={setShowUpdateModal}
          onSuccess={handlePostSuccess}
      />

      <Dialog open={producerRequestModal} onOpenChange={setProducerRequestModal}>
        <DialogContent className="bg-card border-secondary/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Become a Producer</DialogTitle>
            <DialogDescription>Apply to start posting theater shows.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProducerRequest} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Portfolio/Link *</Label>
              <Input type="url" value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)} required />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary">{submitting ? "Submitting..." : "Apply Now"}</Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default UserFeed;
