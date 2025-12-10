import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";
import { TicketCard } from "@/components/ui/ticket-card";
import { StaggerContainer, StaggerItem } from "@/components/ui/entrance-animation";
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
  date: string | null;
  city: string | null;
  niche: "local" | "university" | null;
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
  <div className="border border-secondary/30 bg-card overflow-hidden">
    <div className="aspect-[3/4] shimmer-loading" />
    <div className="h-6" />
    <div className="p-4 space-y-2">
      <div className="h-5 shimmer-loading rounded" />
      <div className="h-4 w-2/3 shimmer-loading rounded" />
    </div>
  </div>
);

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
          date,
          city,
          niche,
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <ShowCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {useFallback
              ? fallbackShows.map((show, index) => (
                  <StaggerItem key={show.id}>
                    <TicketCard
                      id={show.id}
                      title={show.title}
                      groupName={show.groupName}
                      posterUrl={show.posterUrl}
                      index={index}
                      isFallback={true}
                    />
                  </StaggerItem>
                ))
              : shows.map((show, index) => (
                  <StaggerItem key={show.id}>
                    <TicketCard
                      id={show.id}
                      title={show.title}
                      groupName={show.profiles?.group_name || "Theater Group"}
                      posterUrl={posterMap[show.title] || show.poster_url}
                      date={show.date}
                      city={show.city}
                      niche={show.niche}
                      index={index}
                      isFallback={false}
                    />
                  </StaggerItem>
                ))}
          </StaggerContainer>
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
