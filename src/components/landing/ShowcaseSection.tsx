import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Import poster images
import angHulingElBimbo from "@/assets/posters/ang-huling-el-bimbo.jpg";
import batangRizal from "@/assets/posters/batang-rizal.jpg";
import dekada70 from "@/assets/posters/dekada-70.jpg";
import hamilton from "@/assets/posters/hamilton.jpg";
import mulaSaBuwan from "@/assets/posters/mula-sa-buwan.jpg";
import orosmanAtZafira from "@/assets/posters/orosman-at-zafira.jpg";
import rakOfAegis from "@/assets/posters/rak-of-aegis.jpg";
import rentManila from "@/assets/posters/rent-manila.jpg";
import springAwakening from "@/assets/posters/spring-awakening.jpg";
import thePhantom from "@/assets/posters/the-phantom.jpg";

const posters = [
  angHulingElBimbo,
  hamilton,
  mulaSaBuwan,
  rakOfAegis,
  springAwakening,
  thePhantom,
  batangRizal,
  dekada70,
  orosmanAtZafira,
  rentManila
];

const ShowcaseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="showcase" ref={ref} className="py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Recent{" "}
            <span className="text-secondary">Productions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A glimpse of the amazing theater productions featured on StageLink.
          </p>
        </motion.div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

        {/* First Row - Moving Right */}
        <div className="flex gap-6 mb-6 animate-marquee-right">
          {[...posters, ...posters].map((poster, index) => (
            <motion.div
              key={`row1-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
              className="flex-shrink-0 w-48 h-72 rounded-2xl overflow-hidden shadow-lg border border-secondary/20 hover:border-secondary/50 transition-all group"
            >
              <img
                src={poster}
                alt="Theater production poster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </div>

        {/* Second Row - Moving Left */}
        <div className="flex gap-6 animate-marquee-left">
          {[...posters.slice(5), ...posters.slice(0, 5), ...posters.slice(5), ...posters.slice(0, 5)].map((poster, index) => (
            <motion.div
              key={`row2-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
              className="flex-shrink-0 w-48 h-72 rounded-2xl overflow-hidden shadow-lg border border-secondary/20 hover:border-secondary/50 transition-all group"
            >
              <img
                src={poster}
                alt="Theater production poster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
