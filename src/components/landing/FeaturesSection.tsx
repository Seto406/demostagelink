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
    <section id="features" ref={ref} className="relative overflow-hidden bg-muted/30 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--secondary)/0.14),_transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_hsl(var(--primary)/0.12),_transparent_35%)]" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-16"
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-secondary sm:mb-4">
            Features
          </span>
          <h2 className="mb-4 text-3xl font-serif font-bold text-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
            Everything You Need to <span className="text-secondary">Shine</span>
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            Mobile-first tools for audiences and producers—tap, discover, and buy in just a few steps.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:hidden">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="relative overflow-hidden rounded-2xl border border-secondary/25 bg-card/90 p-5 shadow-lg"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="hidden justify-items-center gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="group relative w-full max-w-sm overflow-hidden rounded-2xl border border-secondary/20 bg-card/85 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-xl hover:shadow-primary/15"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="relative mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="relative leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
