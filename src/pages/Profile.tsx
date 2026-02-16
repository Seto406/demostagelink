import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, MapPin, Calendar, Building2, Pencil, Mail } from "lucide-react";
import { RankCard } from "@/components/profile/RankCard";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { motion } from "framer-motion";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

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
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = !id || (currentUserProfile && id === currentUserProfile.id);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (id) {
        // Fetch by profile ID
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (data) setProfile(data as unknown as ProfileData);
      } else {
        // My profile
        if (currentUserProfile) {
          setProfile(currentUserProfile as unknown as ProfileData);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id, currentUserProfile]);


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
  const displayName = profile.group_name || profile.username || (isOwnProfile && user?.email?.split('@')[0]) || "Anonymous User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
           {/* Header */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
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

               <div className="flex flex-col gap-2 justify-center md:justify-start text-sm text-muted-foreground mb-6">
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
                     <Link to="/settings">
                       <Button variant="ghost" size="sm" className="hover:bg-secondary/10 hover:text-secondary">
                         <Settings className="w-4 h-4 mr-2" />
                         Settings
                       </Button>
                     </Link>
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
           </motion.div>

           {/* Stats Grid - Hidden for now as per directive */}
           {/*
           <div className="grid md:grid-cols-2 gap-6 mb-6">
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <RankCard rank={profile.rank || "Newbie"} xp={profile.xp || 0} />
             </motion.div>
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <ActivityFeed userId={profile.id} />
             </motion.div>
           </div>
           */}

           {/* Badges - Hidden for now as per directive */}
           {/*
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
             <BadgeGrid userId={profile.id} />
           </motion.div>
           */}

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
