import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Show {
  id: string;
  title: string;
  date: string | null;
  venue: string | null;
}

const fallbackAnnouncements = [
  "★ Ang Huling El Bimbo — Now Playing ★",
  "★ Mula sa Buwan — Limited Run ★",
  "★ Rent Manila — Get Your Tickets ★",
  "★ Hamilton — Coming Soon ★",
  "★ The Phantom of the Opera — Don't Miss It ★",
];

export const TheaterMarquee = () => {
  const [announcements, setAnnouncements] = useState<string[]>(fallbackAnnouncements);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchShows = async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("id, title, date, venue")
        .eq("status", "approved")
        .order("date", { ascending: true })
        .limit(8);

      if (!error && data && data.length > 0) {
        const formatted = data.map((show: Show) => {
          const dateStr = show.date 
            ? new Date(show.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "";
          return `★ ${show.title}${dateStr ? ` — ${dateStr}` : ""}${show.venue ? ` @ ${show.venue}` : ""} ★`;
        });
        setAnnouncements(formatted);
      }
    };

    fetchShows();
  }, []);

  // Duplicate for seamless loop
  const marqueeContent = [...announcements, ...announcements];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative bg-primary border-y-2 border-secondary overflow-hidden"
        >
          {/* Light bulb border effect */}
          <div className="absolute inset-x-0 top-0 h-0.5 flex">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`top-${i}`}
                className="flex-1 h-full bg-secondary"
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 flex">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`bottom-${i}`}
                className="flex-1 h-full bg-secondary"
                animate={{
                  opacity: [1, 0.3, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Decorative left corner */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-primary via-primary to-transparent z-10 flex items-center justify-center">
            <Star className="w-4 h-4 text-secondary fill-secondary" />
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-primary/80 hover:bg-primary border border-secondary/30 hover:border-secondary transition-all duration-200 group"
            aria-label="Dismiss announcement"
          >
            <X className="w-3 h-3 text-secondary/70 group-hover:text-secondary transition-colors" />
          </button>

          {/* Right fade (adjusted for close button) */}
          <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-l from-primary to-transparent z-10" />

          {/* Scrolling content */}
          <div className="py-2 pl-14 pr-16">
            <motion.div
              className="flex whitespace-nowrap gap-12"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                duration: announcements.length * 6,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {marqueeContent.map((text, index) => (
                <Link
                  key={index}
                  to="/shows"
                  className="inline-flex items-center gap-3 text-secondary-foreground hover:text-secondary transition-colors text-sm font-medium tracking-wide"
                >
                  <Sparkles className="w-3 h-3 text-secondary flex-shrink-0" />
                  <span>{text}</span>
                </Link>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TheaterMarquee;
