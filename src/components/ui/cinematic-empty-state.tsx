import { Button } from "@/components/ui/button";
import { Film, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

interface CinematicEmptyStateProps {
  action?: React.ReactNode;
}

export const CinematicEmptyState = ({ action }: CinematicEmptyStateProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-secondary/20 bg-card p-8 md:p-12 text-center shadow-2xl">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/50 z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-secondary/20">
          <Film className="w-10 h-10 md:w-12 md:h-12 text-secondary animate-pulse-slow" />
        </div>

        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
          Your Collection is Empty
        </h2>

        <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
          The stage is set, but the seats are empty. Explore our curated selection of theatrical productions and save your favorites here.
        </p>

        {action || (
          <Link to="/shows">
            <Button size="lg" className="font-serif px-8 shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all hover:scale-105">
              <Ticket className="w-4 h-4 mr-2" />
              Browse Shows
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
