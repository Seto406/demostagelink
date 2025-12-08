import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const cities = [
  { name: "Mandaluyong", icon: "🏙️" },
  { name: "Taguig", icon: "🌆" },
  { name: "Manila", icon: "🏛️" },
  { name: "Quezon City", icon: "🎭" },
  { name: "Makati", icon: "🌃" },
];

const CityBrowser = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Browse by City
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover theater groups in your area and support local productions
          </p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {cities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="snap-center flex-shrink-0"
            >
              <Link
                to={`/directory?city=${encodeURIComponent(city.name)}`}
                className="group flex flex-col items-center gap-3"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-secondary/50 bg-card flex items-center justify-center text-3xl md:text-4xl transition-all duration-300 group-hover:border-secondary group-hover:shadow-[0_0_30px_hsl(43_72%_52%/0.3)] group-hover:scale-105">
                  {city.icon}
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-secondary transition-colors duration-300 whitespace-nowrap">
                  {city.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CityBrowser;
