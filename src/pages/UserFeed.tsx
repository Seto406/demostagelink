import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users } from "lucide-react";
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

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  profiles?: {
    group_name: string | null;
    id: string;
    avatar_url: string | null;
  };
}

// Dummy placeholder shows for empty state
const dummyShows: Show[] = [
  {
    id: "dummy-1",
    title: "Hamlet - University Edition",
    description: "A classic tale of revenge and tragedy, reimagined for the modern stage.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "University Theater",
    city: "Manila",
    poster_url: null,
    profiles: { group_name: "Sample Theater Group", id: "dummy", avatar_url: null }
  },
  {
    id: "dummy-2",
    title: "The Phantom of Manila",
    description: "A local adaptation of the beloved musical classic.",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "Cultural Center",
    city: "Makati",
    poster_url: null,
    profiles: { group_name: "Metro Arts Collective", id: "dummy", avatar_url: null }
  },
  {
    id: "dummy-3",
    title: "Rizal: The Musical",
    description: "The life and legacy of our national hero brought to life on stage.",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    venue: "National Theater",
    city: "Quezon City",
    poster_url: null,
    profiles: { group_name: "Heritage Players", id: "dummy", avatar_url: null }
  }
];

const UserFeed = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [shows, setShows] = useState<Show[]>([]);
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
          profiles:producer_id (
            group_name,
            id,
            avatar_url
          )
        `)
        .eq("status", "approved")
        .order("date", { ascending: true })
        .limit(12);

      if (!error && data) {
        setShows(data as Show[]);
      }
      setLoadingShows(false);
    };

    fetchShows();
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
    try {
      const { error } = await supabase
        .from("producer_requests")
        .insert({
          user_id: user.id,
          group_name: groupName,
          portfolio_link: portfolioLink,
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your request to become a producer has been submitted for review.",
      });
      setProducerRequestModal(false);
      setExistingRequest({ status: "pending" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. You may already have a pending request.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
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
  const showingDummyData = shows.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
              Welcome back{profile?.group_name ? `, ${profile.group_name}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Discover the latest theater productions across Metro Manila.
            </p>

            {/* Producer Request Button for Audience */}
            {profile?.role === "audience" && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {existingRequest ? (
                  <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${
                    existingRequest.status === "pending" 
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                      : existingRequest.status === "approved"
                      ? "bg-green-500/10 text-green-500 border border-green-500/30"
                      : "bg-red-500/10 text-red-500 border border-red-500/30"
                  }`}>
                    <Users className="w-4 h-4" />
                    Producer Request: {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setProducerRequestModal(true)}
                    className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-6 py-3 h-auto rounded-xl shadow-[0_0_20px_hsl(43_72%_52%/0.2)] hover:shadow-[0_0_30px_hsl(43_72%_52%/0.4)] transition-all"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    🎭 Request to become a Producer
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Upcoming Shows */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Upcoming Productions
              </h2>
              <Link to="/shows">
                <Button variant="ghost" className="text-secondary">
                  View All →
                </Button>
              </Link>
            </div>

            {loadingShows ? (
              <div className="flex justify-center py-12">
                <BrandedLoader size="md" text="Loading productions..." />
              </div>
            ) : (
              <>
                {/* Empty State Notice */}
                {showingDummyData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-secondary/10 border border-secondary/30 rounded-xl text-center"
                  >
                    <p className="text-muted-foreground text-sm">
                      🎭 No live productions yet! Here are some samples to show you what's coming.
                    </p>
                  </motion.div>
                )}
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayShows.map((show, index) => (
                    <motion.div
                      key={show.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {showingDummyData ? (
                        // Dummy cards are not clickable
                        <div className="bg-card border border-secondary/20 rounded-xl overflow-hidden opacity-60 cursor-not-allowed">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-4xl">🎭</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            <div className="absolute top-2 right-2 bg-secondary/90 text-secondary-foreground text-xs px-2 py-1 rounded-full">
                              Sample
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-serif font-semibold text-foreground mb-1 line-clamp-1">
                              {show.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                🎭
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {show.profiles?.group_name || "Unknown Group"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                      ) : (
                        // Real show cards are clickable
                        <div className="relative">
                          <Link to={`/show/${show.id}`}>
                            <div className="bg-card border border-secondary/20 rounded-xl overflow-hidden hover:border-secondary/50 transition-all group">
                              <div className="aspect-[3/4] relative overflow-hidden">
                                {show.poster_url ? (
                                  <img
                                    src={show.poster_url}
                                    alt={show.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-4xl">🎭</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                              </div>
                              <div className="p-4">
                                <h3 className="font-serif font-semibold text-foreground mb-1 line-clamp-1">
                                  {show.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                  {show.profiles?.avatar_url ? (
                                    <img 
                                      src={show.profiles.avatar_url} 
                                      alt={show.profiles.group_name || "Producer"} 
                                      className="w-5 h-5 rounded-full object-cover border border-secondary/30"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                      🎭
                                    </div>
                                  )}
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {show.profiles?.group_name || "Unknown Group"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                          <FavoriteButton
                            isFavorited={isFavorited(show.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(show.id);
                            }}
                            className="absolute top-3 right-3 z-10"
                            size="sm"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
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
              <p className="text-xs text-muted-foreground">
                Provide a link to your Facebook page, website, or portfolio as proof.
              </p>
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