import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Import posters
import posterElBimbo from "@/assets/posters/ang-huling-el-bimbo.jpg";
import posterMulaSaBuwan from "@/assets/posters/mula-sa-buwan.jpg";
import posterRent from "@/assets/posters/rent-manila.jpg";
import posterHamilton from "@/assets/posters/hamilton.jpg";
import posterPhantom from "@/assets/posters/the-phantom.jpg";
import posterDekada from "@/assets/posters/dekada-70.jpg";

interface Show {
  id: string;
  title: string;
  groupName: string;
  posterUrl: string;
}

// Featured shows with generated posters (these will be replaced by DB data when shows are approved)
const featuredShows: Show[] = [
  {
    id: "1",
    title: "Ang Huling El Bimbo",
    groupName: "RTU Drama Ensemble",
    posterUrl: posterElBimbo,
  },
  {
    id: "2",
    title: "Mula sa Buwan",
    groupName: "Manila Repertory",
    posterUrl: posterMulaSaBuwan,
  },
  {
    id: "3",
    title: "Rent: Manila",
    groupName: "Makati Arts Guild",
    posterUrl: posterRent,
  },
  {
    id: "4",
    title: "Hamilton",
    groupName: "QC Theater Company",
    posterUrl: posterHamilton,
  },
  {
    id: "5",
    title: "The Phantom",
    groupName: "Taguig Players",
    posterUrl: posterPhantom,
  },
  {
    id: "6",
    title: "Dekada '70",
    groupName: "Mandaluyong Arts",
    posterUrl: posterDekada,
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
      <div className="relative aspect-[2/3] border border-secondary/50 overflow-hidden transition-all duration-500 group-hover:border-secondary group-hover:shadow-[0_0_40px_hsl(0_100%_25%/0.3)] group-hover:scale-105">
        {/* Poster image */}
        <img 
          src={show.posterUrl} 
          alt={show.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2 drop-shadow-lg">
            {show.title}
          </h3>
          <p className="text-sm text-secondary drop-shadow-lg">{show.groupName}</p>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/30 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-primary/50 transition-colors duration-300" />
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
          {featuredShows.map((show, index) => (
            <ShowCard key={show.id} show={show} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingShows;
