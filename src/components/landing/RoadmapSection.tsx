import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Clock, Rocket, Ticket, BarChart3, Bell, CreditCard } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "live",
    timeline: "Now Live",
    features: [
      "Show listings & management",
      "Group profiles & directory",
      "Team member showcase",
      "City-based discovery",
      "Favorites & watchlist",
      "Social links integration"
    ]
  },
  {
    phase: "Phase 2",
    title: "Growth",
    status: "upcoming",
    timeline: "Q1 2025",
    features: [
      "Ticket link integration",
      "Real-time analytics",
      "Email notifications",
      "Enhanced profiles",
      "Social login (Google)"
    ]
  },
  {
    phase: "Phase 3",
    title: "Scale",
    status: "planned",
    timeline: "Q2 2025",
    features: [
      "Mobile app (iOS & Android)",
      "Pro subscriptions",
      "Calendar sync",
      "Audience reviews",
      "National expansion"
    ]
  }
];

const statusConfig = {
  live: { icon: Check, color: "bg-green-500", text: "Live" },
  upcoming: { icon: Clock, color: "bg-secondary", text: "Next" },
  planned: { icon: Rocket, color: "bg-muted", text: "Planned" }
};

const RoadmapSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="roadmap" ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            What's <span className="text-secondary">Next</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We're building StageLink in phases to deliver value quickly while planning for the future.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="grid md:grid-cols-3 gap-8">
          {phases.map((phase, index) => {
            const StatusIcon = statusConfig[phase.status as keyof typeof statusConfig].icon;
            const statusColor = statusConfig[phase.status as keyof typeof statusConfig].color;
            
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                className={`relative rounded-2xl p-6 border ${
                  phase.status === "live"
                    ? "bg-card border-green-500/30"
                    : phase.status === "upcoming"
                    ? "bg-card border-secondary/30"
                    : "bg-card/50 border-border"
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {phase.phase}
                  </span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor} ${
                    phase.status === "planned" ? "text-muted-foreground" : "text-white"
                  }`}>
                    <StatusIcon className="w-3 h-3" />
                    {phase.timeline}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {phase.title}
                </h3>

                {/* Features */}
                <ul className="space-y-2.5">
                  {phase.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                        phase.status === "live" ? "bg-green-500/20" : "bg-muted"
                      }`}>
                        {phase.status === "live" ? (
                          <Check className="w-2.5 h-2.5 text-green-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        )}
                      </div>
                      <span className={phase.status === "planned" ? "text-muted-foreground/70" : "text-muted-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-muted-foreground text-sm mt-10"
        >
          Roadmap is subject to change based on user feedback and priorities.
        </motion.p>
      </div>
    </section>
  );
};

export default RoadmapSection;
