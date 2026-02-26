import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Facebook, Instagram, UserPlus, UserCheck, Handshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { EditProducerProfileDialog } from "@/components/producer/EditProducerProfileDialog";
import { Pencil } from "lucide-react";

interface TheaterGroup {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_id: string;
}

interface Producer {
  id: string;
  user_id: string;
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
  producer_role: string | null;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  producer?: any;
}

interface GroupMember {
  id: string;
  user_id: string;
  role_in_group: string | null;
  profile?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

const ProducerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [theaterGroup, setTheaterGroup] = useState<TheaterGroup | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showToEdit, setShowToEdit] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Collab State
  const [collabLoading, setCollabLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchProducerData = async () => {
      if (!id) return;

      trackEvent('profile_view', id);

      const { data: groupData, error: groupError } = await supabase
        .from("theater_groups")
        .select("*")
        .eq("owner_id", id)
        .maybeSingle();

      if (groupError) {
        console.error("Error fetching theater group:", groupError);
      } else {
        setTheaterGroup(groupData as unknown as TheaterGroup | null);
      }

      if (user) {
        const { data: applicationData } = await supabase
          .from("group_members")
          .select("status")
          .eq("user_id", user.id)
          .eq("group_id", id)
          .maybeSingle();

        if (applicationData) {
          setHasApplied(true);
          setApplicationStatus(applicationData.status);
        }
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, group_name, description, founded_year, niche, avatar_url, group_logo_url, group_banner_url, facebook_url, instagram_url, map_screenshot_url, university, producer_role")
        .eq("id", id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching producer:", profileError);
      } else if (profileData) {
        setProducer(profileData as Producer);
      }

      let query = supabase
        .from("shows")
        .select("id, title, description, date, venue, city, poster_url, production_status, producer:profiles!producer_id(*)")
        .eq("status", "approved")
        .neq("production_status", "draft")
        .order("date", { ascending: false });

      if (groupData) {
         query = query.or(`producer_id.eq.${id},theater_group_id.eq.${groupData.id}`);
      } else {
         query = query.eq("producer_id", id);
      }

      const { data: showsData, error: showsError } = await query;

      if (showsError) {
        console.error("Error fetching shows:", showsError);
      } else {
        setShows(showsData as Show[]);
      }

      // Fetch Active Members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("id, user_id, role_in_group")
        .eq("group_id", id)
        .eq("status", "active")
        .not("user_id", "is", null);

      if (membersError) {
        console.error("Error fetching members:", membersError);
      } else if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: memberProfiles, error: memberProfilesError } = await supabase
          .from("profiles")
          .select("id, user_id, username, avatar_url")
          .in("user_id", userIds);

        if (!memberProfilesError && memberProfiles) {
           const membersWithProfiles = membersData.map(member => ({
             ...member,
             profile: memberProfiles.find(p => p.user_id === member.user_id)
           }));
           setMembers(membersWithProfiles);
        }
      }

      const { count, error: countError } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", id);

      if (!countError && count !== null) {
        setFollowerCount(count);
      }

      // Fetch following count
      if (profileData?.user_id) {
          const { count: followingCountData, error: followingCountError } = await supabase
            .from("follows")
            .select("*", { count: 'exact', head: true })
            .eq("follower_id", profileData.user_id);

          if (!followingCountError && followingCountData !== null) {
              setFollowingCount(followingCountData);
          }
      }

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
  }, [id, user, authLoading, refreshKey]);

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

            if (profile?.id) {
              const link = profile.role === 'producer'
                  ? `/producer/${profile.id}`
                  : `/profile/${profile.id}`;

              await createNotification({
                userId: producer.id,
                actorId: profile.id,
                type: 'follow',
                title: 'New Follower',
                message: `${profile?.group_name || profile?.username || 'Someone'} started following your group.`,
                link
              });
            }
        }
    }

    setFollowLoading(false);
  };

  const handleJoinRequest = async () => {
    if (!user || !profile || !producer) return;

    setJoinLoading(true);
    try {
      const { data: existingMember, error: fetchError } = await supabase
        .from('group_members')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('group_id', producer.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingMember) {
        if (existingMember.status === 'pending') {
          toast.info("You already have a pending application.");
          setHasApplied(true);
          setApplicationStatus('pending');
          return;
        } else if (existingMember.status === 'active') {
          toast.info("You are already a member of this group.");
          setHasApplied(true);
          setApplicationStatus('active');
          return;
        }
      }

      const { error } = await supabase
        .from('group_members')
        .insert([{
          user_id: user.id,
          group_id: producer.id,
          member_name: profile.username || 'Unknown User',
          status: 'pending',
          role_in_group: 'member'
        }]);

      if (error) throw error;

      await createNotification({
        userId: producer.id, // Use Profile ID for notifications
        actorId: profile.id, // Use Profile ID for actor
        type: 'membership_application',
        title: 'New Member Application',
        message: `${profile.group_name || profile.username || 'Someone'} wants to join your group.`,
        link: `/dashboard`
      });

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipient_id: producer.user_id,
          type: 'membership_application',
          data: {
            applicant_name: profile.group_name || profile.username || 'Someone',
            group_name: producer.group_name,
            link: `${window.location.origin}/dashboard`
          }
        }
      });

      if (emailError) {
        console.error("Failed to send email notification:", emailError);
        // We don't block the UI flow for email failure
      }

      toast.success("Membership application sent successfully!");
      setHasApplied(true);
      setApplicationStatus('pending');
    } catch (error: unknown) {
      console.error("Error sending membership application:", error);
      const message = error instanceof Error ? error.message : "Failed to send application";
      toast.error(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCollabRequest = async () => {
    if (!user || !profile || !producer) return;

    setCollabLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-collab-proposal', {
        body: { recipient_profile_id: producer.id }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      } else if (data?.success) {
        toast.success(data.message || "Collaboration request sent successfully!");
      }
    } catch (error: unknown) {
      console.error("Error sending collaboration request:", error);
      const message = error instanceof Error ? error.message : "Failed to send request";
      toast.error(message || "Failed to send request");
    } finally {
      setCollabLoading(false);
    }
  };

  const handleEditShow = (show: Show) => {
    setShowToEdit(show);
    setShowProductionModal(true);
  };

  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // This variable checks if the logged-in user owns the profile
  const isOwnProfile = user?.id === producer?.id;

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

  const displayLogo = theaterGroup?.logo_url || producer.group_logo_url;
  const displayBanner = theaterGroup?.banner_url || producer.group_banner_url;
  const displayName = theaterGroup?.name || producer.group_name || "Unnamed Group";
  const displayDescription = theaterGroup?.description || producer.description;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{displayName ? `${displayName} on StageLink` : "Producer on StageLink"}</title>
        <meta name="description" content={displayDescription ? displayDescription.substring(0, 150) : "Check out this theater producer on StageLink."} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={displayName ? `${displayName} on StageLink` : "Producer on StageLink"} />
        <meta property="og:description" content={displayDescription ? displayDescription.substring(0, 150) : "Check out this theater producer on StageLink."} />
        {producer.avatar_url && <meta property="og:image" content={producer.avatar_url} />}
      </Helmet>
      <Navbar />
      <main className="pt-24 pb-16">
        {displayBanner && (
          <div className="w-full h-48 md:h-64 lg:h-80 relative mb-8">
            <img
              src={displayBanner}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-r from-secondary/10 to-transparent border-l-4 border-secondary p-6 rounded-r-xl"
          >
            {shows.length > 0 ? (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                   <span className="text-secondary text-xs uppercase tracking-wider font-bold mb-1 block">Featured Production</span>
                   <h3 className="text-xl md:text-2xl font-serif font-bold">{shows[0].title}</h3>
                   <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {shows[0].date && (
                        <div className="flex items-center gap-1">
                           <Calendar className="w-4 h-4 text-secondary" />
                           <span>{new Date(shows[0].date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {shows[0].venue && (
                        <div className="flex items-center gap-1">
                           <MapPin className="w-4 h-4 text-secondary" />
                           <span>{shows[0].venue}</span>
                        </div>
                      )}
                   </div>
                   {shows[0].description && (
                     <p className="text-muted-foreground text-sm mt-3 line-clamp-2 max-w-2xl">
                       {shows[0].description}
                     </p>
                   )}
                </div>
                <Link to={`/show/${shows[0].id}`}>
                  <Button variant="outline" className="border-secondary/50 hover:bg-secondary/10 text-foreground whitespace-nowrap">
                    View Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-secondary text-xs uppercase tracking-wider font-bold mb-1 block">Featured Production</span>
                  <h3 className="text-xl md:text-2xl font-serif font-bold">New Season Coming Soon</h3>
                  <p className="text-muted-foreground text-sm mt-1">Stay tuned for our upcoming announcements.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link to="/directory" className="text-secondary hover:text-secondary/80 text-sm mb-4 inline-block">
              ← Back to Directory
            </Link>
            
            <div className="bg-card border border-secondary/20 p-8 md:p-12 rounded-2xl" data-tour="profile-header">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-2 border-secondary/30">
                  {displayLogo ? (
                    <img 
                      src={displayLogo}
                      alt={displayName || "Producer"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-600 flex items-center justify-center text-white text-5xl md:text-6xl font-serif">
                      {(displayName?.[0] || "P").toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                          <span className="text-secondary text-xs uppercase tracking-wider mb-2 block">
                            {getNicheLabel(producer.niche, producer.university)}
                          </span>
                          <div className="flex items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                              {displayName || "Unnamed Group"}
                            </h1>
                            {isOwnProfile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-secondary"
                                onClick={() => setIsEditOpen(true)}
                                aria-label="Edit Profile"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {producer.producer_role && (
                            <p className="text-muted-foreground mt-1 text-lg font-medium">{producer.producer_role}</p>
                          )}
                      </div>

                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? "outline" : "default"}
                        className={isFollowing ? "border-secondary/50 text-secondary hover:bg-secondary/10" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"}
                        data-tour="profile-follow"
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

                      {user && profile && producer && profile.id !== producer.id && (
                        profile.role === 'producer' ? (
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
                        ) : profile.role === 'audience' ? (
                          <Button
                            onClick={handleJoinRequest}
                            disabled={joinLoading || hasApplied}
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/10 ml-2"
                          >
                            {joinLoading ? (
                              "Sending..."
                            ) : hasApplied ? (
                              applicationStatus === 'active' ? (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Member
                                </>
                              ) : (
                                `Application ${applicationStatus ? applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1) : 'Pending'}`
                              )
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Join as Member
                              </>
                            )}
                          </Button>
                        ) : null
                      )}
                  </div>
                  
                  {displayDescription && (
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      {displayDescription}
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="w-4 h-4 text-secondary" />
                      <span>{followingCount} Following</span>
                    </div>
                  </div>
                  
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
          </motion.div>

          {producer.map_screenshot_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
              data-tour="profile-location"
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

          {members.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-12"
              data-tour="profile-ensemble"
            >
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Ensemble
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    to={member.profile ? `/profile/${member.profile.id}` : '#'}
                    className={`block bg-card border border-secondary/20 rounded-xl p-4 transition-all ${member.profile ? 'hover:border-secondary/50 hover:bg-secondary/5' : 'cursor-default opacity-80'}`}
                  >
                     <div className="flex items-center gap-3">
                       <Avatar className="w-10 h-10 border border-secondary/30">
                         <AvatarImage src={member.profile?.avatar_url || undefined} />
                         <AvatarFallback>{member.profile?.username?.[0]?.toUpperCase() || "M"}</AvatarFallback>
                       </Avatar>
                       <div className="overflow-hidden">
                         <p className="font-medium text-sm text-foreground truncate">
                           {member.profile?.username || "Unknown Member"}
                         </p>
                         <p className="text-xs text-muted-foreground capitalize truncate">
                           {member.role_in_group || "Member"}
                         </p>
                       </div>
                     </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

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
                            data-tour={index === 0 ? "profile-show-card" : undefined}
                          >
                            <Link
                              to={`/show/${show.id}`}
                              className="block bg-card border border-secondary/20 overflow-hidden group hover:border-secondary/50 transition-all duration-300"
                              data-tour={index === 0 ? "profile-ticket-btn" : undefined}
                            >
                              <div className="aspect-[3/2] relative overflow-hidden rounded-xl bg-black/5">
                                {show.poster_url ? (
                                  <>
                                    <div
                                      className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-50"
                                      style={{ backgroundImage: `url(${show.poster_url})` }}
                                    />
                                    <img
                                      src={show.poster_url}
                                      alt={show.title}
                                      className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <span className="text-4xl opacity-30">🎭</span>
                                  </div>
                                )}
                              </div>

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
                            {isOwnProfile && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setShowToEdit(show);
                                    setShowProductionModal(true);
                                  }}
                                >
                                  Edit Show
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

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
                              <div className="aspect-[3/2] relative overflow-hidden rounded-xl bg-black/5 grayscale group-hover:grayscale-0 transition-all duration-500">
                                {show.poster_url ? (
                                  <>
                                    <div
                                      className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-50"
                                      style={{ backgroundImage: `url(${show.poster_url})` }}
                                    />
                                    <img
                                      src={show.poster_url}
                                      alt={show.title}
                                      className="w-full h-full object-contain relative z-10"
                                    />
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                    <span className="text-4xl opacity-30">🎭</span>
                                  </div>
                                )}
                              </div>

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
                            {isOwnProfile && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setShowToEdit(show);
                                    setShowProductionModal(true);
                                  }}
                                >
                                  Edit Show
                                </Button>
                              </div>
                            )}
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
      <EditProducerProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        producer={producer}
        theaterGroup={theaterGroup}
        onSuccess={handleEditSuccess}
      />
      {showProductionModal && (
        <ProductionModal
          open={showProductionModal}
          onOpenChange={setShowProductionModal}
          showToEdit={showToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ProducerProfile;
