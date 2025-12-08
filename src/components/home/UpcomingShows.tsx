import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Show {
  id: string;
  title: string;
  groupName: string;
  posterUrl: string;
}

const mockShows: Show[] = [
  {
    id: "1",
    title: "Ang Larawan",
    groupName: "RTU Drama Ensemble",
    posterUrl: "",
  },
  {
    id: "2",
    title: "Florante at Laura",
    groupName: "Manila Repertory",
    posterUrl: "",
  },
  {
    id: "3",
    title: "Noli Me Tangere",
    groupName: "Makati Arts Guild",
    posterUrl: "",
  },
  {
    id: "4",
    title: "Dekada '70",
    groupName: "QC Theater Company",
    posterUrl: "",
  },
  {
    id: "5",
    title: "Himala",
    groupName: "Taguig Players",
    posterUrl: "",
  },
  {
    id: "6",
    title: "Sino Ka Ba, Jose Rizal?",
    groupName: "Mandaluyong Arts",
    posterUrl: "",
  },
];

const ShowCard = ({ show, index }: { show: Show; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[2/3] bg-gradient-to-br from-card to-muted border border-secondary/20 overflow-hidden transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_40px_hsl(0_100%_25%/0.3)]">
        {/* Placeholder for poster */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <span className="text-6xl opacity-30">🎭</span>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2">
            {show.title}
          </h3>
          <p className="text-sm text-secondary">{show.groupName}</p>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/20 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-primary/40 transition-colors duration-300" />
        </div>
      </div>
    </motion.div>
  );
};

const UpcomingShows = () => {
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
            to="/directory" 
            className="text-secondary hover:text-secondary/80 transition-colors text-sm uppercase tracking-wider"
          >
            View All →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {mockShows.map((show, index) => (
            <ShowCard key={show.id} show={show} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingShows;
