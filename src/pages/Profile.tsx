import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
  group_name?: string | null;
  niche?: string | null;
}

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
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [counts, setCounts] = useState({ passes: 0, following: 0, reviews: 0 });

  const isOwnProfile = !id || (currentUserProfile && id === currentUserProfile.id);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let profileId = id || currentUserProfile?.id;
      if (profileId) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
        if (profileData) {
          setProfile(profileData as unknown as ProfileData);
          const { data: tix } = await supabase.from("tickets").select(`id, show_id, status, shows (id, title, poster_url, date, venue, city, profiles (group_name))`).eq("user_id", profileId);
          if (tix) setTickets(tix as unknown as TicketData[]);
          
          try {
            const { data: folls } = await supabase.from("follows").select(`id, following_id, profiles!follows_following_id_fkey (id, group_name, avatar_url, niche)`).eq("follower_id", profileId);
            if (folls) setFollowing(folls as unknown as FollowData[]);
          } catch (e) { console.log(e); }

          try {
            const { data: revs } = await supabase.from("reviews").select(`id, rating, comment, created_at, shows (id, title, poster_url)`).eq("user_id", profileId).order("created_at", { ascending: false });
            if (revs) setReviews(revs as unknown as ReviewData[]);
          } catch (e) { console.log(e); }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id, currentUserProfile]);

  useEffect(() => {
    setCounts({ passes: tickets.length, following: following.length, reviews: reviews.length });
  }, [tickets, following, reviews]);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="h-screen flex items-center justify-center"><BrandedLoader /></div></div>;
  if (!profile) return <div className="min-h-screen bg-background flex flex-col"><Navbar /><div className="flex-1 flex flex-col items-center justify-center p-4"><h2 className="text-2xl font-serif mb-2 text-foreground">Profile not found</h2><Link to="/feed"><Button>Go Home</Button></Link></div><Footer /></div>;

  const isProducer = profile.role === "producer";
  const displayName = profile.group_name || profile.username || (isOwnProfile && user?.email?.split('@')[0]) || "Anonymous User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border border-secondary/20 rounded-2xl p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-2xl bg-secondary/20 text-secondary">{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left z-10 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-serif font-bold text-foreground">{displayName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center w-fit mx-auto md:mx-0 ${profile.role === 'producer' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                  {profile.role === 'producer' ? 'Theater Group' : 'Audience Member'}
                </span>
              </div>
              <div className="flex flex-col gap-2 justify-center md:justify-start text-sm text-muted-foreground mb-4">
                {isOwnProfile && user?.email && <div className="flex items-center gap-1.5 justify-center md:justify-start"><Mail className="w-4 h-4" />{user.email}</div>}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  {profile.niche && <div className="flex items-center gap-1.5 capitalize"><MapPin className="w-4 h-4" />{profile.niche}</div>}
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-6 text-sm mb-6 border-t border-b border-secondary/10 py-3 w-full md:w-fit px-4 md:px-0">
                <div className="flex items-center gap-2"><span className="font-bold text-foreground">{counts.passes}</span><span className="text-muted-foreground">Passes</span></div>
                <div className="w-[1px] h-4 bg-secondary/20"></div>
                <div className="flex items-center gap-2"><span className="font-bold text-foreground">{counts.following}</span><span className="text-muted-foreground">Following</span></div>
                <div className="w-[1px] h-4 bg-secondary/20"></div>
                <div className="flex items-center gap-2"><span className="font-bold text-foreground">{counts.reviews}</span><span className="text-muted-foreground">Reviews</span></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {isOwnProfile && (
                  <>
                    <Button variant="outline" size="sm" className="border-secondary/30" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-2" />Edit Profile</Button>
                    <Link to="/settings"><Button variant="ghost" size="sm"><Settings className="w-4 h-4 mr-2" />Settings</Button></Link>
                  </>
                )}
                {isProducer && <Link to={`/producer/${profile.id}`}><Button variant="default" size="sm" className="bg-secondary text-secondary-foreground"><Building2 className="w-4 h-4 mr-2" />View Group Page</Button></Link>}
              </div>
            </div>
          </div>
          <div>
            <Tabs defaultValue="passes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-card border border-secondary/20 h-auto p-1">
                <TabsTrigger value="passes" className="flex items-center gap-2 py-3"><TicketIcon className="w-4 h-4" />My Passes</TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2 py-3"><Users className="w-4 h-4" />Following</TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2 py-3"><Star className="w-4 h-4" />Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="passes">
                {tickets.length > 0 ? <div className="grid gap-6">{tickets.map((t) => <DigitalPass key={t.id} ticketId={t.id} id={t.shows?.id || ""} title={t.shows?.title || "Unknown"} groupName={t.shows?.profiles?.group_name || "Unknown"} posterUrl={t.shows?.poster_url} date={t.shows?.date} venue={t.shows?.venue} city={t.shows?.city} status={t.status || undefined} />)}</div> : <div className="text-center py-12 bg-card/50 rounded-2xl"><TicketIcon className="w-12 h-12 mx-auto mb-4 opacity-50" /><h3>No Passes Yet</h3><Link to="/shows"><Button className="mt-4">Browse Shows</Button></Link></div>}
              </TabsContent>
              <TabsContent value="following">
                {following.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{following.map((f) => <Link key={f.id} to={`/producer/${f.following_id}`}><div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-secondary/10"><Avatar><AvatarImage src={f.profiles?.avatar_url || undefined} /><AvatarFallback>?</AvatarFallback></Avatar><div><h4 className="font-medium">{f.profiles?.group_name}</h4></div></div></Link>)}</div> : <div className="text-center py-12 bg-card/50 rounded-2xl"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><h3>Not Following Anyone</h3><Link to="/directory"><Button variant="outline" className="mt-4">Find Groups</Button></Link></div>}
              </TabsContent>
              <TabsContent value="reviews">
                {reviews.length > 0 ? <div className="space-y-4">{reviews.map((r) => <div key={r.id} className="p-4 rounded-xl bg-card border border-secondary/10 flex gap-4"><div className="w-16 h-20 bg-muted rounded overflow-hidden">{r.shows?.poster_url && <img src={r.shows.poster_url} className="w-full h-full object-cover" />}</div><div className="flex-1"><h4>{r.shows?.title}</h4><StarRating rating={r.rating} readOnly size={14} /><p className="text-sm text-muted-foreground mt-2 italic">"{r.comment}"</p></div></div>)}</div> : <div className="text-center py-12 bg-card/50 rounded-2xl"><Star className="w-12 h-12 mx-auto mb-4 opacity-50" /><h3>No Reviews Yet</h3></div>}
              </TabsContent>
            </Tabs>
          </div>
          {isOwnProfile && <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Profile;