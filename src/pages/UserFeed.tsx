import { useState, useEffect, useRef } from "react";
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
  ExternalLink, 
  LayoutDashboard 
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
import { ProductionModal } from "@/components/dashboard/ProductionModal";

// Interface for Feed Shows (includes joined data)
export interface FeedShow {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  status?: string;
  created_at?: string;
  ticket_link?: string | null;
  profiles?: {
    group_name: string | null;
    id: string;
    avatar_url: string | null;
    group_logo_url: string | null;
  };
  favorites?: { count: number }[];
}

interface Producer {
  id: string;
  group_name: string | null;
  avatar_url: string | null;
  group_logo_url: string | null;
  niche: string | null;
}

const UserFeed = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { isPro } = useSubscription();
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
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
          status,
          created_at,
          price,
          profiles:producer_id (
            group_name,
            id,
            avatar_url,
            group_logo_url
          ),
          favorites(count)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as FeedShow[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage && lastPage.length === 20 ? allPages.length : undefined;
    },
  });

  const shows = data?.pages.flat() || [];

  // Fetch producer's recent shows
  const { data: recentShows } = useQuery({
    queryKey: ['producer-recent-shows', user?.id],
    queryFn: async () => {
       if (!user) return [];
       const { data } = await supabase
         .from('shows')
         .select('id, title, status')
         .eq('producer_id', user.id)
         .order('created_at', { ascending: false })
         .limit(3);
       return data || [];
    },
    enabled: !!user && profile?.role === 'producer'
  });

  // Fetch suggested producers
  const { data: suggestedProducers = [] } = useQuery({
    queryKey: ['suggested-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, group_name, avatar_url, group_logo_url, niche")
        .eq("role", "producer")
        .limit(5);
      if (error) throw error;
      return data as Producer[];
    },
  });

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

  if (loading) return <div className="h-screen flex items-center justify-center"><BrandedLoader /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="pt-24 container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row justify-center gap-8">
        
        {/* Feed (Center) */}
        <main className="w-full max-w-2xl pb-24">
          {/* Post Production Bar - Visible only to Producers */}
          {profile?.role === "producer" && (
            <Card className="mb-6 border-secondary/20 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-secondary/40 transition-all" onClick={() => setShowProductionModal(true)}>
              <CardContent className="p-4 flex gap-4 items-center">
                <Avatar>
                  <AvatarImage src={profile.group_logo_url || profile.avatar_url || undefined} />
                  <AvatarFallback>{profile.group_name?.[0] || "P"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-muted-foreground text-sm">
                  Post a new production...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show List */}
          {loadingShows && shows.length === 0 ? (
            <div className="flex justify-center py-12"><BrandedLoader size="md" /></div>
          ) : (
            <div className="space-y-6">
              {shows.map((show, index) => (
                <div key={show.id}>
                  <FeedPost show={show} />
                  {index === 1 && !isPro && <AdBanner format="horizontal" adClient="ca-pub-xxx" adSlot="xxx" />}
                </div>
              ))}
              <div ref={observerTarget} className="py-8 text-center text-muted-foreground text-sm">
                {isFetchingNextPage ? <BrandedLoader size="sm" /> : hasNextPage ? "Scroll for more" : "End of the stage."}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar (Right) */}
        <aside className="hidden lg:block w-[300px] shrink-0 space-y-6 sticky top-24 h-fit">
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
                    <Link to={`/group/${producer.id}`}>
                      <Avatar className="h-10 w-10 border-2 border-transparent hover:border-secondary transition-all">
                        <AvatarImage src={producer.group_logo_url || producer.avatar_url || undefined} />
                        <AvatarFallback>{producer.group_name?.[0]}</AvatarFallback>
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

      <Footer />

      {/* Modals */}
      <ProductionModal open={showProductionModal} onOpenChange={setShowProductionModal} />

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
