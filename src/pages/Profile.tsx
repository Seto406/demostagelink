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
import { Settings, MapPin, Calendar, Building2, Pencil, Mail, Star, Users, Ticket as TicketIcon } from "lucide-react";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalPass } from "@/components/profile/DigitalPass";
import { StarRating } from "@/components/ui/star-rating";

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: "audience" | "producer" | "admin";
  rank: string | null;
  xp: number | null;
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
  shows: {
    id: string;
    title: string;
    poster_url: string | null;
    date: string | null;
    venue: string | null;
    city: string | null;
    price: number | null;
    reservation_fee: number | null;
    seo_metadata: Json | null;
    profiles: {
      group_name: string | null;
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

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Stats & Data
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [counts, setCounts] = useState({ passes: 0, following: 0, reviews: 0 });

  // Check if viewing own profile
  const isOwnProfile = !id || (currentUserProfile && id === currentUserProfile.id);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let profileId = id;

      if (!profileId && currentUserProfile) {
        profileId = currentUserProfile.id;
      }

      if (profileId) {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as unknown as ProfileData);

          // Fetch Tickets (Passes)
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("tickets")
            .select(`
              id,
              show_id,
              status,
              shows (
                id,
                title,
                poster_url,
                date,
                venue,
                city,
                price,
                reservation_fee,
                seo_metadata,
                profiles (
                  group_name
                )
              )
            `)
            .eq("user_id", profileId);

          if (!ticketsError && ticketsData) {
             // Cast to unknown first because 'shows' is array or object depending on relationship,
             // but here it's singular foreign key.
             setTickets(ticketsData as unknown as TicketData[]);
          }

          // Fetch Following
          // Try-catch block in case 'follows' table doesn't exist yet or permissions issue
          try {
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
              .eq("follower_id", profileId);

            if (!followsError && followsData) {
              setFollowing(followsData as unknown as FollowData[]);
            }
          } catch (e) {
            console.log("Could not fetch follows", e);
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

            if (!reviewsError && reviewsData) {
              setReviews(reviewsData as unknown as ReviewData[]);
            }
          } catch (e) {
             console.log("Could not fetch reviews", e);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id, currentUserProfile]);

  // Update counts when data changes
  useEffect(() => {
    setCounts({
      passes: tickets.length,
      following: following.length,
      reviews: reviews.length,
    });
  }, [tickets, following, reviews]);


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
      <Navbar />
      <main className="pt-24 pb-16">
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
                 <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center w-fit mx-auto md:mx-0 ${
                   profile.role === 'producer'
                     ? 'bg-secondary/10 text-secondary border-secondary/20'
                     : 'bg-primary/10 text-primary border-primary/20'
                 }`}>
                   {profile.role === 'producer' ? 'Theater Group' : 'Audience Member'}
                 </span>
               </div>

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
             <Tabs defaultValue="passes" className="w-full">
               <TabsList className="grid w-full grid-cols-3 mb-6 bg-card border border-secondary/20 h-auto p-1">
                 <TabsTrigger value="passes" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <TicketIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">My Passes</span>
                    <span className="sm:hidden">Passes</span>
                 </TabsTrigger>
                 <TabsTrigger value="following" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <Users className="w-4 h-4" />
                    Following
                 </TabsTrigger>
                 <TabsTrigger value="reviews" className="flex items-center gap-2 py-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary">
                    <Star className="w-4 h-4" />
                    Reviews
                 </TabsTrigger>
               </TabsList>

               <TabsContent value="passes" className="mt-0">
                 {tickets.length > 0 ? (
                    <div className="grid gap-6">
                        {tickets.map((ticket) => (
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
                                ticketPrice={ticket.shows?.price}
                                reservationFee={ticket.shows?.reservation_fee}
                                paymentInstructions={(ticket.shows?.seo_metadata as { payment_instructions?: string } | null)?.payment_instructions}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-card/80 to-card/40 border border-secondary/20 rounded-2xl shadow-sm">
                        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TicketIcon className="w-8 h-8 text-secondary" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-foreground mb-3">Your Ticket Wallet is Empty</h3>
                        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                            Discover your next theater experience and keep your passes here.
                        </p>
                        <Link to="/shows">
                            <Button size="lg" className="font-medium px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                                Browse Shows
                            </Button>
                        </Link>
                    </div>
                 )}
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
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
