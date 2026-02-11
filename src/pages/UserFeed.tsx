import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import Navbar from "@/components/layout/Navbar";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
}

// Interface for Suggested Producers
interface Producer {
  id: string;
  group_name: string | null;
  avatar_url: string | null;
  niche: string | null;
}

// Dummy placeholder shows for empty state
const dummyShows: Show[] = [
  {
    id: "dummy-1",
    title: "Hamlet - University Edition",
    description: "A classic tale of revenge and tragedy, reimagined for the modern stage. Experience the intensity of Shakespeare's masterpiece in an intimate setting.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "University Theater",
    city: "Manila",
    poster_url: null,
    created_at: new Date().toISOString(),
    profiles: { group_name: "Sample Theater Group", id: "dummy", avatar_url: null }
  },
  {
    id: "dummy-2",
    title: "The Phantom of Manila",
    description: "A local adaptation of the beloved musical classic. Featuring original compositions and a cast of talented local performers.",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "Cultural Center",
    city: "Makati",
    poster_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    profiles: { group_name: "Metro Arts Collective", id: "dummy", avatar_url: null }
  },
  {
    id: "dummy-3",
    title: "Rizal: The Musical",
    description: "The life and legacy of our national hero brought to life on stage. A powerful tribute to the man who sparked a revolution.",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "National Theater",
    city: "Quezon City",
    poster_url: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    profiles: { group_name: "Heritage Players", id: "dummy", avatar_url: null }
  }
];

const UserFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { isPro } = useSubscription();
  const [shows, setShows] = useState<Show[]>([]);
  const [suggestedProducers, setSuggestedProducers] = useState<Producer[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch approved shows
  useEffect(() => {
    const fetchShows = async () => {
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
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setShows(data as Show[]);
      }
      setLoadingShows(false);
    };

    fetchShows();
  }, []);

  // Fetch suggested producers
  useEffect(() => {
    const fetchProducers = async () => {
      // Fetch random producers (simulated by fetching first 5)
      // Ideally we'd use a random function in SQL, but this is simple enough for now
      const { data, error } = await supabase
        .from("profiles")
        .select("id, group_name, avatar_url, niche")
        .eq("role", "producer")
        .limit(5);

      if (!error && data) {
        setSuggestedProducers(data);
      }
    };

    fetchProducers();
  }, []);

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
  const displayShows = shows.length === 0 ? dummyShows : shows;

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Calendar, label: "Upcoming Shows", path: `/shows?date=${new Date().toLocaleDateString('en-CA')}` },
    { icon: Search, label: "Directory", path: "/directory" },
    { icon: Heart, label: "Favorites", path: "/favorites" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-6 xl:gap-8">

          {/* Left Sidebar - Navigation */}
          <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)]">
            <nav className="space-y-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = item.path.includes('?')
                  ? (location.pathname + location.search) === item.path
                  : location.pathname === item.path;

                return (
                  <Link
                    to={item.path}
                    key={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-lg px-4 py-6 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-secondary/10 text-secondary font-semibold"
                          : "text-muted-foreground hover:bg-secondary/5 hover:text-foreground hover:pl-6"
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mr-4 ${isActive ? "text-secondary" : "text-muted-foreground"}`} />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 px-4">
               {profile?.role === "producer" ? (
                  <Link to="/dashboard">
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-[0_0_20px_hsl(43_72%_52%/0.3)]">
                       <PlusSquare className="w-5 h-5 mr-2" />
                       Manage Shows
                    </Button>
                  </Link>
               ) : (
                  <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 text-center">
                     <p className="text-sm text-muted-foreground mb-3">Are you a theater group?</p>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProducerRequestModal(true)}
                        className="w-full border-secondary/50 text-secondary hover:bg-secondary hover:text-secondary-foreground"
                     >
                        Producer Access
                     </Button>
                  </div>
               )}
            </div>

            <div className="mt-auto absolute bottom-0 w-full px-4 text-xs text-muted-foreground">
               <p>© 2026 StageLink</p>
               <div className="flex gap-2 mt-1">
                  <Link to="/privacy" className="hover:underline">Privacy</Link>
                  <span>•</span>
                  <Link to="/terms" className="hover:underline">Terms</Link>
               </div>
            </div>
          </aside>

          {/* Center Column - Feed */}
          <main className="min-h-screen pb-20">
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
                      <div key={show.id}>
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

                   <div className="text-center py-8 text-muted-foreground">
                      <p>You've reached the end of the feed.</p>
                      <Link to="/shows">
                         <Button variant="link" className="text-secondary">Explore all shows</Button>
                      </Link>
                   </div>
                </div>
             )}
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] space-y-6">
             {!isPro && (
                <AdBanner format="box" />
             )}

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
                      suggestedProducers.map(producer => (
                         <div key={producer.id} className="flex items-center justify-between">
                            <Link to={`/group/${producer.id}`} className="flex items-center gap-3 group">
                               <Avatar className="h-9 w-9 border border-secondary/20">
                                  <AvatarImage src={producer.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">{producer.group_name?.[0]}</AvatarFallback>
                               </Avatar>
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium group-hover:text-secondary transition-colors line-clamp-1">{producer.group_name}</span>
                                  <span className="text-xs text-muted-foreground capitalize">{producer.niche || "Theater Group"}</span>
                               </div>
                            </Link>
                            <Tooltip>
                               <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-secondary" asChild>
                                     <Link to={`/group/${producer.id}`} aria-label={`View ${producer.group_name || 'group'} profile`}>
                                        <ExternalLink className="w-4 h-4" />
                                     </Link>
                                  </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                  <p>View Profile</p>
                               </TooltipContent>
                            </Tooltip>
                         </div>
                      ))
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
                   <h3 className="font-serif font-bold text-lg mb-2">Promote your show</h3>
                   <p className="text-sm text-muted-foreground mb-4">
                      Get your production featured on the main stage and reach thousands of theater enthusiasts.
                   </p>
                   <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                      Contact Us
                   </Button>
                </CardContent>
             </Card>
          </aside>

        </div>
      </div>

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
