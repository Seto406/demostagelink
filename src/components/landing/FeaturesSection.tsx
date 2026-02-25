import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Users, MapPin, Search, Star, Shield, UserPlus, Ticket } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Show Listings Management",
    description: "Create, edit, and manage your productions with our intuitive dashboard. Track approval status and update details anytime.",
    color: "bg-primary"
  },
  {
    icon: Ticket,
    title: "Ticket Link Integration",
    description: "Add ticket purchase links directly to your show pages. Audiences can find and buy tickets in one click.",
    color: "bg-secondary"
  },
  {
    icon: Users,
    title: "Group Profiles",
    description: "Showcase your theater group with dedicated pages featuring history, social links, avatars, and contact info.",
    color: "bg-purple-500"
  },
  {
    icon: UserPlus,
    title: "Team Member Showcase",
    description: "Add and display your cast and crew members with roles and photos. Let audiences know who's behind the magic.",
    color: "bg-indigo-500"
  },
  {
    icon: MapPin,
    title: "City-Based Discovery",
    description: "Help audiences find shows near them with location browsing across Metro Manila venues and real show counts.",
    color: "bg-orange-500"
  },
  {
    icon: Search,
    title: "Theater Directory",
    description: "Browse and discover local and university theater groups. Explore group profiles and their complete production catalogs.",
    color: "bg-blue-500"
  },
  {
    icon: Star,
    title: "Favorites",
    description: "Audiences can save shows they're interested in for easy access.",
    color: "bg-yellow-500"
  },
  {
    icon: Shield,
    title: "Curated Quality",
    description: "All shows go through an admin approval process to ensure quality listings for audiences.",
    color: "bg-green-500"
  }
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-secondary">Shine</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed specifically for theater groups and audiences alike.
          </p>
        </motion.div>

        {/* Features Grid - Centered */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="bg-card rounded-2xl p-8 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/10 w-full max-w-sm"
            >
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
