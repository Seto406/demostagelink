import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
// Import all posters
import posterElBimbo from "@/assets/posters/ang-huling-el-bimbo.jpg";
import posterMulaSaBuwan from "@/assets/posters/mula-sa-buwan.jpg";
import posterRent from "@/assets/posters/rent-manila.jpg";
import posterHamilton from "@/assets/posters/hamilton.jpg";
import posterPhantom from "@/assets/posters/the-phantom.jpg";
import posterDekada from "@/assets/posters/dekada-70.jpg";
import posterRakOfAegis from "@/assets/posters/rak-of-aegis.jpg";
import posterSpringAwakening from "@/assets/posters/spring-awakening.jpg";
import posterOrosman from "@/assets/posters/orosman-at-zafira.jpg";
import posterBatangRizal from "@/assets/posters/batang-rizal.jpg";

interface Show {
  id: string;
  title: string;
  poster_url: string | null;
  profiles: {
    group_name: string | null;
  } | null;
}

// Map titles to local poster images
const posterMap: Record<string, string> = {
  "Ang Huling El Bimbo": posterElBimbo,
  "Mula sa Buwan": posterMulaSaBuwan,
  "Rent": posterRent,
  "Hamilton": posterHamilton,
  "The Phantom of the Opera": posterPhantom,
  "Dekada '70": posterDekada,
  "Rak of Aegis": posterRakOfAegis,
  "Spring Awakening": posterSpringAwakening,
  "Orosman at Zafira": posterOrosman,
  "Batang Rizal": posterBatangRizal,
};

// Featured shows with generated posters (fallback when no approved shows exist)
const fallbackShows = [
  { id: "fallback-1", title: "Ang Huling El Bimbo", groupName: "RTU Drama Ensemble", posterUrl: posterElBimbo },
  { id: "fallback-2", title: "Mula sa Buwan", groupName: "Manila Repertory", posterUrl: posterMulaSaBuwan },
  { id: "fallback-3", title: "Rent", groupName: "Makati Arts Guild", posterUrl: posterRent },
  { id: "fallback-4", title: "Hamilton", groupName: "QC Theater Company", posterUrl: posterHamilton },
  { id: "fallback-5", title: "The Phantom of the Opera", groupName: "Taguig Players", posterUrl: posterPhantom },
  { id: "fallback-6", title: "Dekada '70", groupName: "Mandaluyong Arts", posterUrl: posterDekada },
];

const ShowCardSkeleton = () => (
  <div className="aspect-[2/3] border border-secondary/30 bg-card overflow-hidden">
    <div className="w-full h-full shimmer-loading" />
  </div>
);

const ShowCard = ({
  show,
  index,
  isFallback = false,
}: {
  show: Show | (typeof fallbackShows)[0];
  index: number;
  isFallback?: boolean;
}) => {
  const title = "title" in show ? show.title : "";
  const groupName = isFallback
    ? (show as (typeof fallbackShows)[0]).groupName
    : (show as Show).profiles?.group_name || "Theater Group";

  // Use local poster if available, fallback to database URL or default
  let posterUrl: string | null = null;
  if (isFallback) {
    posterUrl = (show as (typeof fallbackShows)[0]).posterUrl;
  } else {
    const dbShow = show as Show;
    posterUrl = posterMap[dbShow.title] || dbShow.poster_url;
  }

  const showId = show.id;

  const CardContent = (
    <TiltCard tiltAmount={8} glareEnabled={true} scale={1.02}>
      <div
        className="relative aspect-[2/3] border border-secondary/50 overflow-hidden transition-all duration-500 group-hover:border-secondary group-hover:shadow-[0_0_50px_hsl(0_100%_25%/0.35)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Poster image */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <span className="text-6xl opacity-30">🎭</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Content */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
          style={{ transform: "translateZ(15px)" }}
        >
          <h3 className="font-serif text-sm sm:text-lg text-foreground mb-1 line-clamp-2 drop-shadow-lg group-hover:text-secondary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-secondary/80 drop-shadow-lg">{groupName}</p>
        </div>

        {/* Corner accent */}
        <div 
          className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 overflow-hidden"
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="absolute top-0 right-0 w-14 h-14 sm:w-16 sm:h-16 bg-secondary/30 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-primary/50 transition-colors duration-300" />
        </div>

        {/* View indicator on hover */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ transform: "translateZ(25px)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="bg-secondary/90 text-secondary-foreground px-4 py-2 text-sm font-medium uppercase tracking-wider"
          >
            View Show
          </motion.div>
        </div>
      </div>
    </TiltCard>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      {isFallback ? <div>{CardContent}</div> : <Link to={`/show/${showId}`}>{CardContent}</Link>}
    </motion.div>
  );
};

const UpcomingShows = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedShows = async () => {
      const { data, error } = await supabase
        .from("shows")
        .select(
          `
          id,
          title,
          poster_url,
          profiles:producer_id (
            group_name
          )
        `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching shows:", error);
      } else {
        setShows(data as Show[]);
      }
      setLoading(false);
    };

    fetchApprovedShows();
  }, []);

  const displayShows = shows.length > 0 ? shows : [];
  const useFallback = shows.length === 0 && !loading;

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/2 -right-1/2 w-full h-full opacity-5 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 w-96 h-96 border border-secondary/50 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] border border-secondary/30 rounded-full" />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 sm:mb-12"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-secondary uppercase tracking-[0.2em] text-xs sm:text-sm font-medium">
                Now Showing
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground">
              Upcoming Shows
            </h2>
          </div>
          <Link
            to="/shows"
            className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors text-sm uppercase tracking-wider group"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <ShowCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {useFallback
              ? // Show fallback posters when no approved shows exist
                fallbackShows.map((show, index) => (
                  <ShowCard key={show.id} show={show} index={index} isFallback={true} />
                ))
              : // Show real approved shows
                displayShows.map((show, index) => (
                  <ShowCard key={show.id} show={show} index={index} isFallback={false} />
                ))}
          </div>
        )}

        {useFallback && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-xs sm:text-sm mt-8"
          >
            Featured productions • Real shows coming soon
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default UpcomingShows;
