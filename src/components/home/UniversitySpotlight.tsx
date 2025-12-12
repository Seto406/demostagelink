import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import rtuDulaangRizaliaLogo from "@/assets/groups/rtu-dulaang-rizalia.png";

const UniversitySpotlight = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium mb-4 block">
              Featured Spotlight
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
              University Theater
            </h2>
            <div className="border-l-2 border-secondary/50 pl-6 mb-8">
              <h3 className="text-2xl font-serif text-foreground mb-2">
                RTU Dulaang Rizalia
              </h3>
              <p className="text-muted-foreground">
                The official theater arts group of Rizal Technological University, 
                beaming with masterful storytelling, dedicated preparation, and 
                high-caliber theatrical artistry.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="border border-secondary/30 px-4 py-2">
                <span className="text-secondary text-lg font-bold">15+</span>
                <p className="text-xs text-muted-foreground">Productions</p>
              </div>
              <div className="border border-secondary/30 px-4 py-2">
                <span className="text-secondary text-lg font-bold">200+</span>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="border border-secondary/30 px-4 py-2">
                <span className="text-secondary text-lg font-bold">Est.</span>
                <p className="text-xs text-muted-foreground">Mandaluyong</p>
              </div>
            </div>
            <Link to="/directory?niche=University%20Theater%20Group">
              <Button variant="outline" size="lg">
                Explore University Groups
              </Button>
            </Link>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-card to-muted border border-secondary/30 relative overflow-hidden">
              {/* Logo display */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img 
                  src={rtuDulaangRizaliaLogo} 
                  alt="RTU Dulaang Rizalia Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-transparent">
                <p className="text-secondary text-sm uppercase tracking-wider mb-1">RTU Dulaang Rizalia</p>
                <p className="text-foreground font-serif text-xl">Masterful Storytelling & High-Caliber Artistry</p>
              </div>
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-secondary/50" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-secondary/50" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-secondary/50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-secondary/50" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default UniversitySpotlight;
