import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const defaultCities = [
  { name: "Mandaluyong", icon: "🏙️" },
  { name: "Taguig", icon: "🌆" },
  { name: "Manila", icon: "🏛️" },
  { name: "Quezon City", icon: "🎭" },
  { name: "Makati", icon: "🌃" },
];

const CityBrowser = () => {
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCityCounts = async () => {
      // Get counts of approved shows grouped by city via server-side aggregation
      const { data, error } = await supabase.rpc("get_city_show_counts");

      if (error) {
        console.error("Error fetching city counts:", error);
        return;
      }

      // Transform array to Record<city, count>
      const counts: Record<string, number> = {};

      // Type assertion needed as RPC return type might be inferred as any or generic
      (data as unknown as Array<{ city: string; count: number }>)?.forEach((row) => {
        if (row.city) {
          counts[row.city] = row.count;
        }
      });

      setCityCounts(counts);
    };

    fetchCityCounts();
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-muted/10 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="text-secondary uppercase tracking-[0.2em] text-xs sm:text-sm font-medium">
              Explore
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Browse by City
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Discover theater groups in your area and support local productions
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {defaultCities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/shows?city=${encodeURIComponent(city.name)}`}
                className="group flex flex-col items-center gap-2 sm:gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 border-secondary/50 bg-card flex items-center justify-center text-2xl sm:text-3xl md:text-4xl transition-all duration-300 group-hover:border-secondary group-hover:shadow-[0_0_30px_hsl(43_72%_52%/0.4)] overflow-hidden"
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      background: [
                        "linear-gradient(0deg, hsl(43 72% 52% / 0.2), hsl(0 100% 25% / 0.2))",
                        "linear-gradient(360deg, hsl(43 72% 52% / 0.2), hsl(0 100% 25% / 0.2))",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <span className="relative z-10">{city.icon}</span>
                </motion.div>
                <div className="text-center">
                  <span className="block text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-secondary transition-colors duration-300 whitespace-nowrap">
                    {city.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground/60 group-hover:text-secondary/60 transition-colors">
                    {cityCounts[city.name] || 0} {cityCounts[city.name] === 1 ? 'show' : 'shows'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors text-sm uppercase tracking-wider group"
          >
            View All Cities
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CityBrowser;
