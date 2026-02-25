import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Building2, Pencil, Mail, Star, Users, Ticket as TicketIcon, History, Clock } from "lucide-react";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalPass } from "@/components/profile/DigitalPass";
import { StarRating } from "@/components/ui/star-rating";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { calculateReservationFee } from "@/lib/pricing";
import { toast } from "sonner";
import { GroupMemberBadge, ShowCredit } from "@/components/profile/GroupMemberBadge";

interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  role: "audience" | "producer" | "admin";
  created_at: string;
  group_name?: string | null;
  niche?: string | null;
  producer_role?: string | null;
}

// Interfaces for fetched data
interface TicketData {
  id: string;
  show_id: string;
  status: string | null;
  access_code: string | null;
  shows: {
    id: string;
    title: string;
    poster_url: string | null;
    date: string | null; // This is actually 'show_time' in DB usually, aliased or assumed 'date'
    show_time?: string | null; // Adding optional field if query returns it directly
    venue: string | null;
    city: string | null;
    price: number | null;
    reservation_fee: number | null;
    seo_metadata: Json | null;
    profiles: {
      group_name: string | null;
      niche: string | null;
    } | null;
  } | null;
}

interface FollowData {
  id: string;
  following_id: string;
  profiles: {
    id: string;
    group_name: string | null;
    avatar_url: string | null;
    niche: string | null;
  } | null;
}

interface FollowerData {
  id: string;
  follower_id: string;
  profiles: {
    id: string;
    username: string | null;
    group_name: string | null;
    avatar_url: string | null;
    role: "audience" | "producer" | "admin";
    niche: string | null;
  } | null;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  shows: {
    id: string;
    title: string;
    poster_url: string | null;
  } | null;
}

interface GroupMembership {
  id: string;
  group_id: string;
  group_name: string;
  group_logo_url: string | null;
  role_in_group: string;
  credits: ShowCredit[];
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Stats & Data
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [followers, setFollowers] = useState<FollowerData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [memberships, setMemberships] = useState<GroupMembership[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [counts, setCounts] = useState({ passes: 0, following: 0, reviews: 0, followers: 0 });

  // Check if viewing own profile
  const isOwnProfile = !id || (currentUserProfile && id === currentUserProfile.id);

  useEffect(() => {
    const loadData = async () => {
      if (!profile) setLoading(true);
      let profileId = id;

      if (!profileId && currentUserProfile) {
        profileId = currentUserProfile.id;
      }

      if (profileId) {
        // Attempt to claim guest tickets if this is the user's own profile
        if (isOwnProfile && user) {
          try {
            const { error: claimError } = await supabase.functions.invoke('claim-tickets');
            if (claimError) {
              console.error("Background sync failed: Failed to claim guest tickets.", claimError);
            }
          } catch (err) {
            console.error("Failed to claim guest tickets:", err);
          }
        }

        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as unknown as ProfileData);

          // Fetch Group Memberships if not a producer
          if (profileData.role === 'audience') {
            const { data: membersData } = await supabase
              .from('group_members' as any)
              .select(`
                id,
                group_id,
                role_in_group,
                member_name,
                profiles:group_id (
                  id,
                  group_name,
                  group_logo_url
                )
              `)
              .eq('user_id', profileId)
              .eq('status', 'active');

            if (membersData && membersData.length > 0) {
              const membershipsWithCredits = await Promise.all(membersData.map(async (m: any) => {
                const groupId = m.group_id || m.profiles?.id;
                // Fetch approved shows for this group
                const { data: showsData } = await supabase
                  .from('shows')
                  .select('id, title, poster_url, cast_members')
                  .eq('producer_id', groupId)
                  .eq('status', 'approved');

                // Determine the name to match against credits
                const memberName = m.member_name || profileData.username;

                // Filter shows where the user is credited
                const credits = (showsData || []).filter((show: any) => {
                  const cast = show.cast_members as any[] || [];
                  // Check if cast contains memberName (case insensitive)
                  return cast.some((c: any) => c.name?.toLowerCase() === memberName?.toLowerCase());
                }).map((show: any) => {
                  const role = (show.cast_members as any[]).find((c: any) => c.name?.toLowerCase() === memberName?.toLowerCase())?.role || 'Cast';
                  return {
                    id: show.id,
                    title: show.title,
                    poster_url: show.poster_url,
                    role: role
                  };
                });

                return {
                  id: m.id,
                  group_id: groupId,
                  group_name: m.profiles?.group_name || 'Unknown Group',
                  group_logo_url: m.profiles?.group_logo_url,
                  role_in_group: m.role_in_group || 'Member',
                  credits: credits
                };
              }));

              setMemberships(membershipsWithCredits.slice(0, 2)); // Limit to 2 for display safety
            }
          }

          // Fetch Followers
          try {
            const { data: followersData, error: followersError, count } = await supabase
              .from("follows")
              .select(`
                id,
                follower_id,
                profiles!follows_follower_id_fkey (
                  id,
                  username,
                  group_name,
                  avatar_url,
                  role,
                  niche
                )
              `, { count: 'exact' })
              .eq("following_id", profileId);

            if (followersError) {
              console.error("Error fetching followers:", followersError);
              toast.error("Failed to load followers.");
            } else {
              if (followersData) {
                setFollowers(followersData as unknown as FollowerData[]);
              }
              setFollowerCount(count || 0);
            }
          } catch (e) {
            console.error("Could not fetch followers", e);
            toast.error("Failed to load followers.");
          }

          // Fetch Tickets (Passes)
          // We fetch all non-cancelled tickets. Separation logic happens in render or state processing.
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("tickets")
            .select(`
              id,
              show_id,
              status,
              access_code,
              shows (
                id,
                title,
                poster_url,
                show_time,
                venue,
                ticket_link,
                price,
                reservation_fee,
                seo_metadata,
                profiles (
                  group_name,
                  niche
                )
              )
            `)
            .eq("user_id", profileId)
            .neq("status", "cancelled"); // Filter out cancelled

          if (ticketsError) {
             console.error("Error fetching tickets:", ticketsError);
             toast.error("Failed to load your passes.");
          } else if (ticketsData) {
             // Map shows.show_time to date property to match interface
             const mappedTickets = ticketsData.map((t: any) => ({
                 ...t,
                 shows: t.shows ? {
                     ...t.shows,
                     date: t.shows.show_time // Alias show_time to date
                 } : null
             }));
             setTickets(mappedTickets as unknown as TicketData[]);
          }

          // Fetch Following
          try {
            if (profileData.user_id) {
              const { data: followsData, error: followsError } = await supabase
                .from("follows")
                .select(`
                  id,
                  following_id,
                  profiles!follows_following_id_fkey (
                    id,
                    group_name,
                    avatar_url,
                    niche
                  )
                `)
                .eq("follower_id", profileData.user_id);

              if (followsError) {
                console.error("Error fetching follows:", followsError);
                toast.error("Failed to load following list.");
              } else if (followsData) {
                setFollowing(followsData as unknown as FollowData[]);
              }
            }
          } catch (e) {
            console.error("Could not fetch follows", e);
            toast.error("Failed to load following list.");
          }

          // Fetch Reviews
          try {
             const { data: reviewsData, error: reviewsError } = await supabase
              .from("reviews")
              .select(`
                id,
                rating,
                comment,
                created_at,
                shows (
                  id,
                  title,
                  poster_url
                )
              `)
              .eq("user_id", profileId)
              .order("created_at", { ascending: false });

            if (reviewsError) {
              console.error("Error fetching reviews:", reviewsError);
              toast.error("Failed to load reviews.");
            } else if (reviewsData) {
              setReviews(reviewsData as unknown as ReviewData[]);
            }
          } catch (e) {
             console.error("Could not fetch reviews", e);
             toast.error("Failed to load reviews.");
          }
        }
      }
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUserProfile]);

  // Update counts when data changes
  useEffect(() => {
    setCounts({
      passes: tickets.length,
      following: following.length,
      reviews: reviews.length,
      followers: followerCount,
    });
  }, [tickets, following, reviews, followerCount]);

  // Ticket Filtering Logic
  const now = new Date();
  const upcomingTickets = tickets.filter(t => {
      if (t.status === 'used') return false;
      if (!t.shows?.date) return true; // Keep if no date
      const showDate = new Date(t.shows.date);
      // Keep if show is in future or today (until midnight?)
      // Actually simpler: if show hasn't happened yet.
      return showDate > now;
  });

  const historyTickets = tickets.filter(t => {
      // Includes USED tickets AND missed tickets (past date)
      if (t.status === 'used') return true;
      if (!t.shows?.date) return false;
      const showDate = new Date(t.shows.date);
      return showDate <= now;
  });


  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-screen flex items-center justify-center">
        <BrandedLoader />
      </div>
    </div>
  );

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           <h2 className="text-2xl font-serif mb-2 text-foreground">Profile not found</h2>
           <Link to="/feed"><Button>Go Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isProducer = profile.role === "producer";
  const displayName = profile.username || (isOwnProfile && user?.email?.split('@')[0]) || "Anonymous User";

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
           {/* Header */}
           <div
             className="bg-card border border-secondary/20 rounded-2xl p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden shadow-xl"
           >
             {/* Background decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

             <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl shrink-0">
               <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
               <AvatarFallback className="text-2xl bg-secondary/20 text-secondary">
                 {displayName[0]?.toUpperCase()}
               </AvatarFallback>
             </Avatar>

             <div className="flex-1 text-center md:text-left z-10 w-full">
               <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                 <h1 className="text-3xl font-serif font-bold text-foreground">
                   {displayName}
                 </h1>

                 {/* Role / Memberships Display */}
                 {profile.role === 'producer' ? (
                   <span className="px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center w-fit mx-auto md:mx-0 bg-secondary/10 text-secondary border-secondary/20">
                     Producer Account
                   </span>
                 ) : memberships.length > 0 ? (
                   // Render badges for memberships instead of "Audience Member"
                   <div className="hidden">
                      {/* Hidden here because we will render them below the name for better layout */}
                   </div>
                 ) : (
                   <span className="px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center w-fit mx-auto md:mx-0 bg-primary/10 text-primary border-primary/20">
                     Audience Member
                   </span>
                 )}
               </div>

               {/* Group Memberships Area */}
               {!isProducer && memberships.length > 0 && (
                 <div className="flex flex-col gap-2 mt-2 mb-4 justify-center md:justify-start items-center md:items-start">
                   {memberships.map((membership) => (
                     <GroupMemberBadge
                       key={membership.id}
                       groupId={membership.group_id}
                       groupName={membership.group_name}
                       groupLogoUrl={membership.group_logo_url}
                       memberRole={membership.role_in_group}
                       shows={membership.credits}
                     />
                   ))}
                 </div>
               )}

               {profile.role === "producer" && profile.producer_role && (
                 <p className="text-lg text-muted-foreground font-medium mb-2 text-center md:text-left">
                   {profile.producer_role}
                 </p>
               )}

               <div className="flex flex-col gap-2 justify-center md:justify-start text-sm text-muted-foreground mb-4">
                 {isOwnProfile && user?.email && (
                    <div className="flex items-center gap-1.5 justify-center md:justify-start">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                 )}
                 <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    {profile.niche && (
                      <div className="flex items-center gap-1.5 capitalize">
                        <MapPin className="w-4 h-4" />
                        {profile.niche}
                      </div>
                    )}
                 </div>
               </div>


                {/* Stats Bar */}
                <div className="flex items-center justify-center md:justify-start gap-6 text-sm mb-6 border-t border-b border-secondary/10 py-3 w-full md:w-fit px-4 md:px-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{counts.passes}</span>
                        <span className="text-muted-foreground">Passes</span>
                    </div>
                    <div className="w-[1px] h-4 bg-secondary/20"></div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{counts.followers}</span>
                        <span className="text-muted-foreground">Followers</span>
                    </div>
                    <div className="w-[1px] h-4 bg-secondary/20"></div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{counts.following}</span>
                        <span className="text-muted-foreground">Following</span>
                    </div>
                    <div className="w-[1px] h-4 bg-secondary/20"></div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{counts.reviews}</span>
                        <span className="text-muted-foreground">Reviews</span>
                    </div>
                </div>

               <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                 {isOwnProfile && (
                   <>
                     <Button
                       variant="outline"
                       size="sm"
                       className="border-secondary/30 hover:bg-secondary/10 hover:text-secondary"
                       onClick={() => setEditOpen(true)}
                     >
                       <Pencil className="w-4 h-4 mr-2" />
                       Edit Profile
                     </Button>
                   </>
                 )}
                 {isProducer && (
                   <Link to={`/producer/${profile.id}`}>
                      <Button variant="default" size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <Building2 className="w-4 h-4 mr-2" />
                        View Group Page
                      </Button>
                   </Link>
                 )}
               </div>
             </div>
           </div>

           {/* Tabs Section */}
           <div>
             <Tabs defaultValue={isOwnProfile ? "passes" : "following"} className="w-full">
               <TabsList className={`grid w-full mb-6 bg-card border border-secondary/20 h-auto p-1 ${isOwnProfile ? "grid-cols-4" : "grid-cols-3"}`}>
                 {isOwnProfile && (
                   <TabsTrigger value="passes" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                      <TicketIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">My Passes</span>
                      <span className="sm:hidden">Passes</span>
                   </TabsTrigger>
                 )}
                 <TabsTrigger value="following" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <Users className="w-4 h-4" />
                    Following
                 </TabsTrigger>
                 <TabsTrigger value="followers" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <Users className="w-4 h-4" />
                    Followers
                 </TabsTrigger>
                 <TabsTrigger value="reviews" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <Star className="w-4 h-4" />
                    Reviews
                 </TabsTrigger>
               </TabsList>

               <TabsContent value="passes" className="mt-0">
                 {/* Pass Tabs: Upcoming vs History */}
                 <Tabs defaultValue="upcoming" className="w-full">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-serif font-semibold text-foreground">Your Tickets</h3>
                         <TabsList className="bg-card border border-secondary/10 h-9 p-1">
                             <TabsTrigger value="upcoming" className="text-xs px-3 h-7 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
                                Upcoming ({upcomingTickets.length})
                             </TabsTrigger>
                             <TabsTrigger value="history" className="text-xs px-3 h-7 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
                                History ({historyTickets.length})
                             </TabsTrigger>
                         </TabsList>
                     </div>

                     <TabsContent value="upcoming" className="mt-0 space-y-6">
                        {upcomingTickets.length > 0 ? (
                            <div className="grid gap-6">
                                {upcomingTickets.map((ticket) => (
                                    <DigitalPass
                                        key={ticket.id}
                                        ticketId={ticket.id}
                                        id={ticket.shows?.id || ""}
                                        title={ticket.shows?.title || "Unknown Show"}
                                        groupName={ticket.shows?.profiles?.group_name || "Unknown Group"}
                                        posterUrl={ticket.shows?.poster_url}
                                        date={ticket.shows?.date}
                                        venue={ticket.shows?.venue}
                                        city={ticket.shows?.city}
                                        status={ticket.status || undefined}
                                        accessCode={ticket.access_code}
                                        ticketPrice={ticket.shows?.price}
                                        reservationFee={ticket.shows?.reservation_fee ?? calculateReservationFee(ticket.shows?.price || 0, ticket.shows?.profiles?.niche || null)}
                                        paymentInstructions={(ticket.shows?.seo_metadata as { payment_instructions?: string } | null)?.payment_instructions}
                                    />
                                ))}
                            </div>
                        ) : (
                            <PremiumEmptyState
                                title="No upcoming shows"
                                description="Browse the directory to find your next theater experience."
                                icon={TicketIcon}
                                action={
                                    <Link to="/directory">
                                        <Button>Find Shows</Button>
                                    </Link>
                                }
                            />
                        )}
                     </TabsContent>

                     <TabsContent value="history" className="mt-0">
                        {historyTickets.length > 0 ? (
                             <div className="grid gap-6">
                                {historyTickets.map((ticket) => (
                                    <DigitalPass
                                        key={ticket.id}
                                        ticketId={ticket.id}
                                        id={ticket.shows?.id || ""}
                                        title={ticket.shows?.title || "Unknown Show"}
                                        groupName={ticket.shows?.profiles?.group_name || "Unknown Group"}
                                        posterUrl={ticket.shows?.poster_url}
                                        date={ticket.shows?.date}
                                        venue={ticket.shows?.venue}
                                        city={ticket.shows?.city}
                                        status={ticket.status || undefined}
                                        accessCode={ticket.access_code}
                                        ticketPrice={ticket.shows?.price}
                                        reservationFee={ticket.shows?.reservation_fee ?? calculateReservationFee(ticket.shows?.price || 0, ticket.shows?.profiles?.niche || null)}
                                        paymentInstructions={(ticket.shows?.seo_metadata as { payment_instructions?: string } | null)?.payment_instructions}
                                    />
                                ))}
                             </div>
                        ) : (
                             <div className="text-center py-12 bg-card/50 border border-secondary/10 rounded-xl">
                                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No History Yet</h3>
                                <p className="text-muted-foreground">Past tickets will appear here.</p>
                             </div>
                        )}
                     </TabsContent>
                 </Tabs>
               </TabsContent>

               <TabsContent value="following" className="mt-0">
                 {following.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {following.map((follow) => (
                            <Link to={`/producer/${follow.following_id}`} key={follow.id}>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-secondary/10 hover:border-secondary/30 transition-all hover:bg-secondary/5">
                                    <Avatar className="w-12 h-12 border border-secondary/20">
                                        <AvatarImage src={follow.profiles?.avatar_url || undefined} />
                                        <AvatarFallback>{follow.profiles?.group_name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium text-foreground line-clamp-1">{follow.profiles?.group_name}</h4>
                                        {follow.profiles?.niche && (
                                            <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {follow.profiles.niche}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 bg-card/50 border border-secondary/10 rounded-2xl">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Not Following Anyone</h3>
                        <p className="text-muted-foreground mb-6">Follow theater groups to get updates on their shows.</p>
                        <Link to="/directory">
                            <Button variant="outline">Find Groups</Button>
                        </Link>
                    </div>
                 )}
               </TabsContent>

               <TabsContent value="followers" className="mt-0">
                 {followers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {followers.map((follower) => {
                            const displayName = follower.profiles?.group_name || follower.profiles?.username || "Anonymous";
                            const link = follower.profiles?.role === 'producer'
                              ? `/producer/${follower.follower_id}`
                              : `/profile/${follower.follower_id}`;

                            return (
                                <Link to={link} key={follower.id}>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-secondary/10 hover:border-secondary/30 transition-all hover:bg-secondary/5">
                                        <Avatar className="w-12 h-12 border border-secondary/20">
                                            <AvatarImage src={follower.profiles?.avatar_url || undefined} />
                                            <AvatarFallback>{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-medium text-foreground line-clamp-1">{displayName}</h4>
                                            {follower.profiles?.niche && (
                                                <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {follower.profiles.niche}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                 ) : (
                    <div className="text-center py-12 bg-card/50 border border-secondary/10 rounded-2xl">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Followers Yet</h3>
                        <p className="text-muted-foreground mb-6">Connect with others in the community.</p>
                    </div>
                 )}
               </TabsContent>

               <TabsContent value="reviews" className="mt-0">
                 {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-4 rounded-xl bg-card border border-secondary/10">
                                <div className="flex gap-4">
                                    <div className="shrink-0 w-16 h-20 bg-muted rounded-md overflow-hidden">
                                        {review.shows?.poster_url ? (
                                            <img src={review.shows.poster_url} alt={review.shows.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                                                <span className="text-xs">Poster</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h4 className="font-medium text-foreground">{review.shows?.title || "Unknown Show"}</h4>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <StarRating rating={review.rating} readOnly size={14} className="mb-2" />
                                        {review.comment && (
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                "{review.comment}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 bg-card/50 border border-secondary/10 rounded-2xl">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Reviews Yet</h3>
                        <p className="text-muted-foreground mb-6">Review shows you've watched to help others.</p>
                    </div>
                 )}
               </TabsContent>
             </Tabs>
           </div>

           {isOwnProfile && (
             <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
           )}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
