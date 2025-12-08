import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Import posters for fallback
import posterElBimbo from "@/assets/posters/ang-huling-el-bimbo.jpg";
import posterMulaSaBuwan from "@/assets/posters/mula-sa-buwan.jpg";
import posterRent from "@/assets/posters/rent-manila.jpg";
import posterHamilton from "@/assets/posters/hamilton.jpg";
import posterPhantom from "@/assets/posters/the-phantom.jpg";
import posterDekada from "@/assets/posters/dekada-70.jpg";

interface Show {
  id: string;
  title: string;
  poster_url: string | null;
  profiles: {
    group_name: string | null;
  } | null;
}

// Featured shows with generated posters (fallback when no approved shows exist)
const fallbackShows = [
  { id: "fallback-1", title: "Ang Huling El Bimbo", groupName: "RTU Drama Ensemble", posterUrl: posterElBimbo },
  { id: "fallback-2", title: "Mula sa Buwan", groupName: "Manila Repertory", posterUrl: posterMulaSaBuwan },
  { id: "fallback-3", title: "Rent: Manila", groupName: "Makati Arts Guild", posterUrl: posterRent },
  { id: "fallback-4", title: "Hamilton", groupName: "QC Theater Company", posterUrl: posterHamilton },
  { id: "fallback-5", title: "The Phantom", groupName: "Taguig Players", posterUrl: posterPhantom },
  { id: "fallback-6", title: "Dekada '70", groupName: "Mandaluyong Arts", posterUrl: posterDekada },
];

const ShowCard = ({ 
  show, 
  index, 
  isFallback = false 
}: { 
  show: Show | typeof fallbackShows[0]; 
  index: number; 
  isFallback?: boolean;
}) => {
  const title = 'title' in show ? show.title : '';
  const groupName = isFallback 
    ? (show as typeof fallbackShows[0]).groupName 
    : (show as Show).profiles?.group_name || "Theater Group";
  const posterUrl = isFallback 
    ? (show as typeof fallbackShows[0]).posterUrl 
    : (show as Show).poster_url;
  const showId = show.id;

  const CardContent = (
    <div className="relative aspect-[2/3] border border-secondary/50 overflow-hidden transition-all duration-500 group-hover:border-secondary group-hover:shadow-[0_0_40px_hsl(0_100%_25%/0.3)] group-hover:scale-105">
      {/* Poster image */}
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <span className="text-6xl opacity-30">🎭</span>
        </div>
      )}
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2 drop-shadow-lg">
          {title}
        </h3>
        <p className="text-sm text-secondary drop-shadow-lg">{groupName}</p>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/30 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-primary/50 transition-colors duration-300" />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      {isFallback ? (
        <div>{CardContent}</div>
      ) : (
        <Link to={`/show/${showId}`}>{CardContent}</Link>
      )}
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
        .select(`
          id,
          title,
          poster_url,
          profiles:producer_id (
            group_name
          )
        `)
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
    <section className="py-24 bg-gradient-to-b from-background to-muted/10">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium mb-2 block">
              Now Showing
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Upcoming Shows
            </h2>
          </div>
          <Link 
            to="/shows" 
            className="text-secondary hover:text-secondary/80 transition-colors text-sm uppercase tracking-wider"
          >
            View All →
          </Link>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading shows...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {useFallback ? (
              // Show fallback posters when no approved shows exist
              fallbackShows.map((show, index) => (
                <ShowCard key={show.id} show={show} index={index} isFallback={true} />
              ))
            ) : (
              // Show real approved shows
              displayShows.map((show, index) => (
                <ShowCard key={show.id} show={show} index={index} isFallback={false} />
              ))
            )}
          </div>
        )}

        {useFallback && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-sm mt-8"
          >
            Featured productions • Real shows coming soon
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default UpcomingShows;
