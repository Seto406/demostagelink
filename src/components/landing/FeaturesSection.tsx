import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Ticket, Users, BarChart3, MapPin, Bell } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Seamless Show Management",
    description: "Create, edit, and manage your productions with our intuitive dashboard. Schedule shows and track submissions effortlessly.",
    color: "bg-blue-500"
  },
  {
    icon: Ticket,
    title: "Digital Ticketing",
    description: "Connect your ticket links directly to your show pages. Audiences can find and purchase tickets in one click.",
    color: "bg-primary"
  },
  {
    icon: Users,
    title: "Group Profiles",
    description: "Showcase your theater group with dedicated profile pages featuring your history, productions, and team.",
    color: "bg-purple-500"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track views, engagement, and discover insights about your audience to grow your reach.",
    color: "bg-green-500"
  },
  {
    icon: MapPin,
    title: "Location Discovery",
    description: "Help audiences find shows near them with city-based browsing and venue information.",
    color: "bg-orange-500"
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Keep producers updated on approval status and notify audiences about upcoming shows.",
    color: "bg-pink-500"
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
