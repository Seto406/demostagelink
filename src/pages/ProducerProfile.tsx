import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Facebook, Instagram, UserPlus, UserCheck, Handshake } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Producer {
  id: string;
  group_name: string | null;
  description: string | null;
  founded_year: number | null;
  niche: "local" | "university" | null;
  avatar_url: string | null;
  group_logo_url: string | null;
  group_banner_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  map_screenshot_url: string | null;
  university: string | null;
}

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
  production_status: string | null;
}

const ProducerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Collab State
  const [collabLoading, setCollabLoading] = useState(false);

  useEffect(() => {
    const fetchProducerData = async () => {
      if (!id) return;

      // Track profile view
      trackEvent('profile_view', id);

      // Fetch producer profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, group_name, description, founded_year, niche, avatar_url, group_logo_url, group_banner_url, facebook_url, instagram_url, map_screenshot_url, university")
        .eq("id", id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching producer:", profileError);
      } else if (profileData) {
        setProducer(profileData as Producer);
      }

      // Fetch producer's approved shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("id, title, description, date, venue, city, poster_url, production_status")
        .eq("producer_id", id)
        .eq("status", "approved")
        .neq("production_status", "draft") // Exclude draft shows from public profile
        .order("date", { ascending: false });

      if (showsError) {
        console.error("Error fetching shows:", showsError);
      } else {
        setShows(showsData as Show[]);
      }

      // Fetch Follower Count
      const { count, error: countError } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", id);

      if (!countError && count !== null) {
        setFollowerCount(count);
      }

      // Check if current user is following
      if (user) {
        const { data: followData, error: followError } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", id)
            .maybeSingle();

        if (!followError && followData) {
            setIsFollowing(true);
        }
      }

      setLoading(false);
    };

    fetchProducerData();
  }, [id, user]);

  const getNicheLabel = (niche: string | null, university: string | null) => {
    if (niche === "university" && university) {
      return `${university} Theater Group`;
    }
    switch (niche) {
      case "local":
        return "Local/Community Theater";
      case "university":
        return "University Theater Group";
      default:
        return "Theater Group";
    }
  };

  const handleFollow = async () => {
    if (!user) {
        toast.error("Please login to follow this group");
        return;
    }
    if (!producer) return;

    setFollowLoading(true);

    if (isFollowing) {
        // Unfollow
        const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", producer.id);

        if (error) {
            console.error("Error unfollowing:", error);
            toast.error("Failed to unfollow");
        } else {
            setIsFollowing(false);
            setFollowerCount(prev => Math.max(0, prev - 1));
            toast.success("Unfollowed group");
        }
    } else {
        // Follow
        const { error } = await supabase
            .from("follows")
            .insert({
                follower_id: user.id,
                following_id: producer.id
            });

        if (error) {
            console.error("Error following:", error);
            toast.error("Failed to follow group");
        } else {
            setIsFollowing(true);
            setFollowerCount(prev => prev + 1);
            toast.success("Following group");
        }
    }

    setFollowLoading(false);
  };

  const handleCollabRequest = async () => {
    if (!user || !profile || !producer) return;

    setCollabLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-collab-proposal', {
        body: { recipient_profile_id: producer.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Collaboration request sent successfully!");
    } catch (error: any) {
      console.error("Error sending collaboration request:", error);
      toast.error(error.message || "Failed to send request");
    } finally {
      setCollabLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 flex items-center justify-center min-h-[50vh]">
            <BrandedLoader size="lg" text="Loading producer profile..." />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-3xl font-serif text-foreground mb-4">Producer Not Found</h1>
            <p className="text-muted-foreground mb-6">This producer profile doesn't exist.</p>
            <Link to="/directory" className="text-secondary hover:underline">
              ← Back to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{producer.group_name ? `${producer.group_name} on StageLink` : "Producer on StageLink"}</title>
        <meta name="description" content={producer.description ? producer.description.substring(0, 150) : "Check out this theater producer on StageLink."} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={producer.group_name ? `${producer.group_name} on StageLink` : "Producer on StageLink"} />
        <meta property="og:description" content={producer.description ? producer.description.substring(0, 150) : "Check out this theater producer on StageLink."} />
        {/* Note: cover_image is not available in the database schema, so we use avatar_url as the best available fallback for OG image. */}
        {producer.avatar_url && <meta property="og:image" content={producer.avatar_url} />}
      </Helmet>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Producer Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link to="/directory" className="text-secondary hover:text-secondary/80 text-sm mb-4 inline-block">
              ← Back to Directory
            </Link>
            
            <div className="bg-card border border-secondary/20 rounded-2xl overflow-hidden">
              {/* Group Banner */}
              <div className="h-32 md:h-48 bg-secondary/10 relative">
                {producer.group_banner_url ? (
                  <img
                    src={producer.group_banner_url}
                    alt="Group Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-secondary/5 to-secondary/20" />
                )}
              </div>

              <div className="p-8 md:p-12 pt-0 md:pt-0 relative">
                <div className="flex flex-col md:flex-row gap-8 items-start -mt-12 md:-mt-16">
                  {/* Avatar */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-background flex items-center justify-center text-5xl md:text-6xl shrink-0 border-4 border-card shadow-sm z-10">
                    {(producer.group_logo_url || producer.avatar_url) ? (
                      <img
                        src={producer.group_logo_url || producer.avatar_url || ""}
                        alt={producer.group_name || "Producer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="bg-primary/20 w-full h-full flex items-center justify-center">🎭</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-full mt-4 md:mt-16">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                          <span className="text-secondary text-xs uppercase tracking-wider mb-2 block">
                            {getNicheLabel(producer.niche, producer.university)}
                          </span>
                          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                            {producer.group_name || "Unnamed Group"}
                          </h1>
                      </div>

                      {/* Follow Button */}
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? "outline" : "default"}
                        className={isFollowing ? "border-secondary/50 text-secondary hover:bg-secondary/10" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"}
                      >
                        {followLoading ? (
                            "Processing..."
                        ) : isFollowing ? (
                            <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Following
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Follow
                            </>
                        )}
                      </Button>

                      {/* Collab Button */}
                      {user && profile && (profile.role === 'producer' || profile.role === 'admin') && producer && profile.id !== producer.id && (
                        <Button
                          onClick={handleCollabRequest}
                          disabled={collabLoading}
                          variant="outline"
                          className="border-primary/50 text-primary hover:bg-primary/10 ml-2"
                        >
                          {collabLoading ? (
                            "Sending..."
                          ) : (
                            <>
                              <Handshake className="w-4 h-4 mr-2" />
                              Request Collab
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                  
                  {producer.description && (
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      {producer.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-6 text-sm">
                    {producer.founded_year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <span>Founded {producer.founded_year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-secondary" />
                      <span>{followerCount} {followerCount === 1 ? "Follower" : "Followers"}</span>
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  {(producer.facebook_url || producer.instagram_url) && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-secondary/20">
                      {producer.facebook_url && (
                        <a 
                          href={producer.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <Facebook className="w-5 h-5" />
                          <span className="text-sm">Facebook</span>
                        </a>
                      )}
                      {producer.instagram_url && (
                        <a 
                          href={producer.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </motion.div>

          {/* Location Section */}
          {producer.map_screenshot_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Location
              </h2>
              <div className="bg-card border border-secondary/20 rounded-xl overflow-hidden shadow-sm">
                {producer.map_screenshot_url.startsWith("<iframe") ? (
                   <div
                     className="w-full aspect-video [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                     dangerouslySetInnerHTML={{ __html: producer.map_screenshot_url }}
                   />
                ) : (
                  <div className="w-full h-64 md:h-80 bg-muted relative">
                    <img
                      src={producer.map_screenshot_url}
                      alt="Location Map"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium border border-secondary/20 shadow-sm flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-secondary" />
                      View Location
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Shows Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {shows.length === 0 ? (
              <div className="bg-card border border-secondary/20 p-12 text-center">
                <p className="text-muted-foreground">No approved productions yet.</p>
              </div>
            ) : (
              <>
                {/* Current/Upcoming Productions */}
                {shows.some(s => s.production_status !== "completed") && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                      Current Productions
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {shows
                        .filter(s => s.production_status !== "completed")
                        .map((show, index) => (
                          <motion.div
                            key={show.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          >
                            <Link
                              to={`/show/${show.id}`}
                              className="block bg-card border border-secondary/20 overflow-hidden group hover:border-secondary/50 transition-all duration-300"
                            >
                              {/* Poster */}
                              <div className="aspect-[3/2] relative overflow-hidden">
                                {show.poster_url ? (
                                  <img
                                    src={show.poster_url}
                                    alt={show.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <span className="text-4xl opacity-30">🎭</span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-secondary transition-colors">
                                  {show.title}
                                </h3>

                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                            </Link>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Past Productions */}
                {shows.some(s => s.production_status === "completed") && (
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                      Past Productions
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {shows
                        .filter(s => s.production_status === "completed")
                        .map((show, index) => (
                          <motion.div
                            key={show.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          >
                            <Link
                              to={`/show/${show.id}`}
                              className="block bg-card border border-secondary/20 overflow-hidden group hover:border-secondary/50 transition-all duration-300 opacity-80 hover:opacity-100"
                            >
                              {/* Poster */}
                              <div className="aspect-[3/2] relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                                {show.poster_url ? (
                                  <img
                                    src={show.poster_url}
                                    alt={show.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                    <span className="text-4xl opacity-30">🎭</span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-secondary transition-colors">
                                  {show.title}
                                </h3>

                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                            </Link>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProducerProfile;
