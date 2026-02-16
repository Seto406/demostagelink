import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface DigitalPassProps {
  id: string; // show id
  title: string;
  groupName: string;
  posterUrl?: string | null;
  date?: string | null;
  venue?: string | null;
  city?: string | null;
  status?: string; // e.g., "approved", "pending"
  ticketId: string;
}

export const DigitalPass = ({
  id,
  title,
  groupName,
  posterUrl,
  date,
  venue,
  city,
  ticketId,
}: DigitalPassProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative w-full max-w-md mx-auto"
    >
      <div className="relative bg-card border border-secondary/30 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:border-secondary/50">

        {/* Ticket Header / Main Info */}
        <div className="flex flex-col sm:flex-row">
            {/* Poster Section (Left/Top) */}
            <div className="relative w-full sm:w-1/3 aspect-[3/4] sm:aspect-auto sm:h-auto overflow-hidden bg-muted">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎭</span>
                    </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-black/10" />
            </div>

            {/* Content Section (Right/Bottom) */}
            <div className="flex-1 p-5 flex flex-col justify-between relative bg-card">
                {/* Perforated Edge (Visual separator for mobile, or decoration) */}
                <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-[1px] border-l-2 border-dashed border-secondary/30 -ml-[1px] z-10" />

                <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                            ₱25 Commitment Paid
                        </span>
                    </div>

                    <Link to={`/show/${id}`} className="block group-hover:text-secondary transition-colors">
                        <h3 className="font-serif text-xl font-bold text-foreground mb-1 line-clamp-2">
                            {title}
                        </h3>
                    </Link>

                    <p className="text-sm text-muted-foreground font-medium mb-3">
                        {groupName}
                    </p>

                    <div className="space-y-1.5 text-xs text-muted-foreground/80 mb-4">
                        {date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-secondary" />
                                <span>{new Date(date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                            </div>
                        )}
                        {(venue || city) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-secondary" />
                                <span className="line-clamp-1">{venue ? `${venue}, ${city}` : city}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Section */}
                <div className="mt-auto pt-4 border-t border-dashed border-secondary/20 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Instruction</p>
                        <p className="text-xs text-foreground font-medium leading-tight">
                            Present this at the venue to pay your balance.
                        </p>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="bg-white p-1.5 rounded-md shrink-0 border border-secondary/20">
                        <QrCode className="w-12 h-12 text-black" />
                    </div>
                </div>
            </div>
        </div>

        {/* Decorative Notches (for perforated look) */}
        <div className="hidden sm:block absolute top-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />
        <div className="hidden sm:block absolute bottom-0 left-[33.33%] -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />

      </div>
    </motion.div>
  );
};
