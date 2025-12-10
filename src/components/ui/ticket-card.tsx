import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  id: string;
  title: string;
  groupName: string;
  posterUrl?: string | null;
  date?: string | null;
  venue?: string | null;
  city?: string | null;
  niche?: "local" | "university" | null;
  index?: number;
  isFallback?: boolean;
}

export const TicketCard = ({
  id,
  title,
  groupName,
  posterUrl,
  date,
  venue,
  city,
  niche,
  index = 0,
  isFallback = false,
}: TicketCardProps) => {
  const CardWrapper = isFallback ? "div" : Link;
  const wrapperProps = isFallback ? {} : { to: `/show/${id}` };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
    >
      <CardWrapper {...(wrapperProps as any)} className="block">
        <div className="relative">
          {/* Main ticket body */}
          <div className="relative bg-card border border-secondary/30 overflow-hidden transition-all duration-500 group-hover:border-secondary group-hover:shadow-[0_0_40px_hsl(0_100%_25%/0.3)]">
            {/* Velvet texture overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='velvet'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23velvet)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Poster section */}
            <div className="aspect-[3/4] relative overflow-hidden">
              {posterUrl ? (
                <motion.img
                  src={posterUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-6xl opacity-30">🎭</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

              {/* Niche badge */}
              {niche && (
                <div className="absolute top-3 right-3 z-20">
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-secondary/20 border border-secondary/40 text-secondary backdrop-blur-sm">
                    {niche === "university" ? "University" : "Local"}
                  </span>
                </div>
              )}

              {/* Spotlight effect on hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)",
                }}
              />
            </div>

            {/* Perforated tear line */}
            <div className="relative h-6 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-secondary/30" />
              {/* Circular notches */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30" />
            </div>

            {/* Ticket stub - info section */}
            <div className="p-4 pt-2 relative">
              {/* Velvet texture on stub */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='velvet2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23velvet2)'/%3E%3C/svg%3E")`,
                }}
              />

              <h3 className="font-serif text-base sm:text-lg text-foreground mb-1 line-clamp-2 group-hover:text-secondary transition-colors duration-300">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                {groupName}
              </p>

              {/* Date and venue info */}
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-muted-foreground">
                {date && (
                  <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-sm">
                    <Calendar className="w-3 h-3 text-secondary" />
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {city && (
                  <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-sm">
                    <MapPin className="w-3 h-3 text-secondary" />
                    {city}
                  </span>
                )}
              </div>

              {/* Ticket number styling */}
              <div className="absolute bottom-2 right-3 text-[8px] text-muted-foreground/50 font-mono uppercase tracking-widest">
                #{String(index + 1).padStart(3, "0")}
              </div>
            </div>

            {/* Gold corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary/40 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary/40 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary/40 group-hover:border-secondary transition-colors duration-300" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary/40 group-hover:border-secondary transition-colors duration-300" />
          </div>

          {/* Shadow underneath for depth */}
          <div className="absolute -bottom-2 left-2 right-2 h-4 bg-gradient-to-b from-black/20 to-transparent blur-sm -z-10 group-hover:from-primary/30 transition-colors duration-300" />
        </div>
      </CardWrapper>
    </motion.div>
  );
};

export default TicketCard;
