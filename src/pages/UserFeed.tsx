import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { AdBanner } from "@/components/ads/AdBanner";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Home,
  Calendar,
  Search,
  Heart,
  User,
  Settings,
  PlusSquare,
  TrendingUp,
  ExternalLink
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { dummyShows as importedDummyShows } from "@/data/dummyShows";

// Interface for Shows
export interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  created_at?: string;
  profiles?: {
    group_name: string | null;
    id: string;
    avatar_url: string | null;
  };
  favorites?: { count: number }[];
}

// Interface for Suggested Producers
interface Producer {
  id: string;
  group_name: string | null;
  avatar_url: string | null;
  niche: string | null;
}

const UserFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, isAdmin } = useAuth();
  const { isPro } = useSubscription();
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);

  const observerTarget = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch approved shows with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingShows
  } = useInfiniteQuery({
    queryKey: ['approved-shows'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * 20;
      const to = from + 19;

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
          created_at,
          profiles:producer_id (
            group_name,
            id,
            avatar_url
          ),
          favorites(count)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Show[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage && lastPage.length === 20 ? allPages.length : undefined;
    },
  });

  const shows = data?.pages.flat() || [];

  // Implement intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch suggested producers
  const { data: suggestedProducers = [] } = useQuery({
    queryKey: ['suggested-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, group_name, avatar_url, niche")
        .eq("role", "producer")
        .limit(5);

      if (error) throw error;
      return data as Producer[];
    },
  });

  // Check for existing producer request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("producer_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
      }
    };

    checkExistingRequest();
  }, [user]);

  const handleProducerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Create a timeout promise (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Request timed out")), 15000);
      });

      // Create the insert promise
      const insertPromise = supabase
        .from("producer_requests")
        .insert({
          user_id: user.id,
          group_name: groupName,
          portfolio_link: portfolioLink,
        });

      // Race the request against the timeout
      type InsertResponse = Awaited<ReturnType<typeof insertPromise>>;
      const result = await Promise.race([insertPromise, timeoutPromise]) as InsertResponse;
      const { error } = result;

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your request to become a producer has been submitted for review.",
      });
      setProducerRequestModal(false);
      setExistingRequest({ status: "pending" });
    } catch (error: unknown) {
      console.error("Producer request error:", error);
      const errorMessage = (error as { message?: string })?.message || "Unknown error";
      toast({
        title: "Error",
        description: errorMessage === "Request timed out"
          ? "The request is taking longer than expected. Please check your internet connection."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

  // Determine which shows to display
  // Using importedDummyShows as fallback/append for demo purposes if needed, but primarily relying on real data
  const displayShows = [...shows, ...(importedDummyShows as unknown as Show[])];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-7xl flex-1">
        <div className="flex justify-center gap-8">

          {/* Center Column - Feed */}
          <main className="w-full max-w-2xl pb-24">
             {/* Mobile Welcome */}
             <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-serif font-bold">Home</h1>
             </div>

             {/* Create Post Placeholder (Producer Only) */}
             {profile?.role === "producer" && (
                <Card className="mb-6 border-secondary/20 bg-card/50 backdrop-blur-sm">
                   <CardContent className="p-4 flex gap-4 items-center">
                      <Avatar>
                         <AvatarImage src={profile.avatar_url || undefined} />
                         <AvatarFallback>{profile.group_name?.[0] || "P"}</AvatarFallback>
                      </Avatar>
                      <Link to="/dashboard" className="flex-1">
                         <div className="bg-muted/50 hover:bg-muted text-muted-foreground rounded-full px-4 py-3 cursor-pointer transition-colors text-sm">
                            Post a new show...
                         </div>
                      </Link>
                   </CardContent>
                </Card>
             )}

             {/* Feed List */}
             {loadingShows ? (
                <div className="flex justify-center py-12">
                   <BrandedLoader size="md" />
                </div>
             ) : (
                <div className="space-y-6">
                   {displayShows.map((show, index) => (
                      <div key={show.id || index}>
                        <FeedPost show={show} />
                        {index === 1 && !isPro && (
                           <AdBanner
                             format="horizontal"
                             variant="adsense"
                             adClient="ca-pub-4021944125309456"
                             adSlot="5015577702"
                           />
                        )}
                      </div>
                   ))}

                   {/* Infinite Scroll Trigger & Loader */}
                   <div ref={observerTarget} className="py-8 text-center text-muted-foreground">
                      {isFetchingNextPage ? (
                         <div className="flex justify-center">
                            <BrandedLoader size="sm" text="Loading more shows..." />
                         </div>
                      ) : hasNextPage ? (
                         <p>Scroll for more</p>
                      ) : (
                         <p>You've reached the end of the feed.</p>
                      )}
                   </div>
                </div>
             )}
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="hidden lg:block w-[300px] shrink-0 space-y-6 sticky top-24 h-fit">
             {/* Suggested Producers Widget */}
             <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                   <CardTitle className="text-lg font-serif flex items-center justify-between">
                      <span>Suggested Groups</span>
                      <TrendingUp className="w-4 h-4 text-secondary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {suggestedProducers.length > 0 ? (
                      <div className="flex flex-wrap gap-4 justify-center">
                        {suggestedProducers.map(producer => (
                           <Tooltip key={producer.id}>
                              <TooltipTrigger asChild>
                                <Link to={`/group/${producer.id}`} className="group relative">
                                   <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-secondary transition-all">
                                      <AvatarImage src={producer.avatar_url || undefined} />
                                      <AvatarFallback>{producer.group_name?.[0]}</AvatarFallback>
                                   </Avatar>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{producer.group_name}</p>
                              </TooltipContent>
                           </Tooltip>
                        ))}
                      </div>
                   ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                         No suggestions available.
                      </div>
                   )}
                   <Link to="/directory">
                      <Button variant="ghost" className="w-full text-secondary text-sm mt-2">
                         View All Groups
                      </Button>
                   </Link>
                </CardContent>
             </Card>

             {/* Upcoming Widget (Static for now or reusing shows) */}
             <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent">
                <CardContent className="p-6">
                   {/* ID: MARKETING_DEMO_PLACEHOLDER */}
                   <h3 className="font-serif font-bold text-lg mb-2">Join {/* DEMO_ONLY */}20+ Local Arts Groups already on StageLink.</h3>
                   <p className="text-sm text-muted-foreground mb-4">
                      Get your production featured on the main stage and reach thousands of theater enthusiasts.
                   </p>
                   <Button
                      variant="outline"
                      className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                      onClick={() => setProducerRequestModal(true)}
                   >
                      Start Your Group
                   </Button>
                </CardContent>
             </Card>
          </aside>

        </div>
      </div>

       <Footer />

       {/* Producer Request Modal */}
       <Dialog open={producerRequestModal} onOpenChange={setProducerRequestModal}>
        <DialogContent className="bg-card border-secondary/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Request Producer Access</DialogTitle>
            <DialogDescription>
              Submit your theater group information for admin review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProducerRequest} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Theater Group Name *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter your theater group name"
                required
                className="bg-background border-secondary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolioLink">Portfolio/Social Link *</Label>
              <Input
                id="portfolioLink"
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://facebook.com/yourgroup"
                required
                className="bg-background border-secondary/30"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProducerRequestModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !groupName || !portfolioLink}
                className="flex-1 bg-primary"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserFeed;
