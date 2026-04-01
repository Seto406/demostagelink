import { motion } from "framer-motion";
import { CheckCircle2, Lightbulb, Sparkles, Users } from "lucide-react";

const proofPoints = [
  {
    metric: "End-to-End",
    label: "Ticketing + Discovery + Producer Dashboard",
  },
  {
    metric: "Real-time",
    label: "Notifications and booking status updates",
  },
  {
    metric: "Mobile-first",
    label: "Optimized for campus and on-the-go users",
  },
];

const judgeSignals = [
  {
    icon: Lightbulb,
    title: "Clear Problem-Solution Fit",
    description:
      "Highlights how StageLink solves discoverability and audience-building challenges for student and community theater groups.",
  },
  {
    icon: Users,
    title: "Stakeholder-Centered Design",
    description:
      "Frames the experience for three key users: audiences, producers, and admins—with obvious value for each.",
  },
  {
    icon: CheckCircle2,
    title: "Production-Ready Foundation",
    description:
      "Shows reliability through role-based access, analytics, and operational tooling for real events.",
  },
];

const CapstoneHighlightsSection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-12"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary mb-4">
            <Sparkles className="h-4 w-4" />
            Capstone Demo Advantage
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Make Your Presentation Feel
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200"> Competition-Ready</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Judges typically look for strong impact, technical depth, and polish. This section surfaces those strengths before your live walkthrough even starts.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {proofPoints.map((item, index) => (
            <motion.div
              key={item.metric}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-xl border border-border/50 bg-card/40 backdrop-blur p-6 text-center"
            >
              <p className="text-2xl font-bold text-foreground mb-2">{item.metric}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {judgeSignals.map((signal, index) => (
            <motion.article
              key={signal.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card/60 p-6"
            >
              <signal.icon className="h-7 w-7 text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{signal.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{signal.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapstoneHighlightsSection;
