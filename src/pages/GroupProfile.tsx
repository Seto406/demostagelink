import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Users, Calendar, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// Group logos
import artistangArtletsLogo from "@/assets/groups/artistang-artlets.png";
import rtuDulaangRizaliaLogo from "@/assets/groups/rtu-dulaang-rizalia.png";
import starTcuLogo from "@/assets/groups/star-tcu.jpg";
import culturaUmakLogo from "@/assets/groups/cultura-umak.png";
import genesisToJesusLogo from "@/assets/groups/genesis-to-jesus.jpg";
import pupTanghalangMolaveLogo from "@/assets/groups/pup-tanghalang-molave.jpg";
import feuTheaterGuildLogo from "@/assets/groups/feu-theater-guild.jpg";
import pnuThespianLogo from "@/assets/groups/pnu-thespian.jpg";
import dulaangUpLogo from "@/assets/groups/dulaang-up.jpg";

interface GroupData {
  id: string;
  group_name: string;
  description: string;
  niche: "local" | "university";
  city: string;
  logo?: string;
  founded?: string;
  facebook?: string;
  instagram?: string;
}

const groupsData: Record<string, GroupData> = {
  "demo-1": {
    id: "demo-1",
    group_name: "Artistang Artlets",
    description: "The long-standing theatre guild of the Faculty of Arts and Letters of the University of Santo Tomas, built upon the virtues of respect and hierarchy, fueled by passion for theatre and the performing arts. Artistang Artlets has been a cornerstone of university theater in the Philippines, nurturing talented performers and creating impactful productions that resonate with audiences across generations.",
    niche: "university",
    city: "Manila",
    logo: artistangArtletsLogo,
    founded: "1970s"
  },
  "demo-2": {
    id: "demo-2",
    group_name: "RTU Dulaang Rizalia",
    description: "The official theater arts group of Rizal Technological University, beaming with masterful storytelling, dedicated preparation, and high-caliber theatrical artistry. RTU Dulaang Rizalia continues to push boundaries in university theater, combining traditional Filipino narratives with contemporary theatrical techniques to create memorable performances.",
    niche: "university",
    city: "Mandaluyong",
    logo: rtuDulaangRizaliaLogo
  },
  "demo-3": {
    id: "demo-3",
    group_name: "Trick Creative Production",
    description: "A theater production group that presents stage plays and musicals, making works include original Filipino musicals and plays, and unconventional theatre performances. Trick Creative Production is known for pushing creative boundaries and presenting thought-provoking works that challenge audiences while entertaining them.",
    niche: "local",
    city: "Quezon City"
  },
  "demo-4": {
    id: "demo-4",
    group_name: "Student Theater Artist Repertory (STAR)",
    description: "Student theatre guild composed of passionate and creative university students at TCU, ready to bring stories to life on stage and behind the scenes. STAR embodies the spirit of collaborative theater-making, where every member contributes to the magic of live performance.",
    niche: "university",
    city: "Taguig",
    logo: starTcuLogo
  },
  "demo-5": {
    id: "demo-5",
    group_name: "Cultura Performing Arts Guild (UMAK)",
    description: "Theater guild from the University of Makati that aims to inspire and provide artistic and intellectual capabilities through dance, music, and variety of performing-arts works. Cultura has established itself as a multidisciplinary arts organization that celebrates Filipino culture through various performance mediums.",
    niche: "university",
    city: "Makati",
    logo: culturaUmakLogo
  },
  "demo-6": {
    id: "demo-6",
    group_name: "Genesis To Jesus Productions Inc.",
    description: "A local theatre production from the City of Mandaluyong that produces plays or performances with a religious or evangelistic orientation. Genesis To Jesus Productions creates meaningful theatrical experiences that inspire faith and spiritual reflection through the power of storytelling.",
    niche: "local",
    city: "Mandaluyong",
    logo: genesisToJesusLogo
  },
  "demo-7": {
    id: "demo-7",
    group_name: "PUP Tanghalang Molave",
    description: "Student theatre organization of Polytechnic University of the Philippines (PUP) that stages Filipino plays (both classical/commentary works) in student-led productions, engaging with social issues, history, and contemporary themes. Tanghalang Molave is committed to using theater as a platform for social awareness and cultural preservation.",
    niche: "university",
    city: "Manila",
    logo: pupTanghalangMolaveLogo
  },
  "demo-8": {
    id: "demo-8",
    group_name: "FEU Theater Guild (FTG)",
    description: "The theater organization of Far Eastern University, known for a history going back decades, mixing traditional and experimental theater. FEU Theater Guild has produced countless talented actors and theater practitioners who have gone on to make significant contributions to Philippine theater and entertainment.",
    niche: "university",
    city: "Manila",
    logo: feuTheaterGuildLogo
  },
  "demo-9": {
    id: "demo-9",
    group_name: "PNU The Thespian Society",
    description: "A non-stock, non-profit, university-based theatre organization based at Philippine National University (PNU) using theatre and the arts as a means of education and expression. The Thespian Society believes in the transformative power of theater to educate, enlighten, and empower both performers and audiences.",
    niche: "university",
    city: "Manila",
    logo: pnuThespianLogo
  },
  "demo-10": {
    id: "demo-10",
    group_name: "Dulaang UP (DUP)",
    description: "The official theatre group of University of the Philippines – Diliman that stages both classics and Filipino plays, often by established and emerging playwrights. Dulaang UP is one of the most prestigious university theater organizations in the Philippines, known for its high production values and commitment to developing Filipino theatrical literature.",
    niche: "university",
    city: "Quezon City",
    logo: dulaangUpLogo
  }
};

const GroupProfile = () => {
  const { id } = useParams<{ id: string }>();
  const group = id ? groupsData[id] : null;

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-3xl font-serif text-foreground mb-4">Group Not Found</h1>
            <p className="text-muted-foreground mb-8">The theater group you're looking for doesn't exist.</p>
            <Link to="/directory">
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Directory
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/directory"
              className="inline-flex items-center text-muted-foreground hover:text-secondary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Link>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-secondary/20 p-8 md:p-12 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Logo */}
              <div className="w-32 h-32 bg-primary/10 flex items-center justify-center rounded-xl overflow-hidden border-2 border-secondary/30 shrink-0">
                {group.logo ? (
                  <img 
                    src={group.logo} 
                    alt={`${group.group_name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">🎭</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-xs uppercase tracking-wider border ${
                    group.niche === "university" 
                      ? "border-secondary text-secondary" 
                      : "border-primary text-primary"
                  }`}>
                    {group.niche === "university" ? "University" : "Local/Community"}
                  </span>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {group.city}
                  </div>
                  {group.founded && (
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Est. {group.founded}
                    </div>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                  {group.group_name}
                </h1>

                <p className="text-muted-foreground leading-relaxed">
                  {group.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card border border-secondary/20 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-secondary" />
                <h2 className="font-serif text-xl text-foreground">About the Group</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                {group.niche === "university" 
                  ? `${group.group_name} is a university-based theater organization dedicated to fostering theatrical talent and creating meaningful productions for the academic community and beyond.`
                  : `${group.group_name} is a community-based theater production company committed to bringing quality theatrical experiences to local audiences.`
                }
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-secondary/20 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <ExternalLink className="w-5 h-5 text-secondary" />
                <h2 className="font-serif text-xl text-foreground">Connect</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Stay updated with {group.group_name}'s latest productions and announcements.
              </p>
              <p className="text-muted-foreground/60 text-xs italic">
                Social links coming soon
              </p>
            </motion.div>
          </div>

          {/* Shows Section Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 bg-card border border-secondary/20 p-8 text-center"
          >
            <h2 className="font-serif text-2xl text-foreground mb-4">Upcoming Shows</h2>
            <p className="text-muted-foreground mb-6">
              No shows announced yet. Check back soon for {group.group_name}'s upcoming productions.
            </p>
            <Link to="/shows">
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                Browse All Shows
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GroupProfile;
