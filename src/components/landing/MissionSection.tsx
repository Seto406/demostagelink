import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Users, Sparkles } from "lucide-react";

const MissionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main Image Container */}
              <div className="absolute inset-4 bg-landing-surface rounded-3xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-landing-primary/5 to-landing-gold/5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🎭</div>
                    <p className="text-landing-muted font-medium">Connecting Artists & Audiences</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-24 h-24 border-l-4 border-t-4 border-landing-gold rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 border-r-4 border-b-4 border-landing-primary rounded-br-3xl" />
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block text-landing-primary font-semibold text-sm uppercase tracking-wider mb-4">
              Why StageLink?
            </span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-landing-text mb-6 leading-tight">
              Bridging the Gap Between{" "}
              <span className="text-landing-primary">Stage & Screen</span>
            </h2>
            
            <p className="text-lg text-landing-muted mb-8 leading-relaxed">
              We believe every local theater production deserves to be discovered. 
              StageLink connects passionate theater groups with audiences eager to 
              experience the magic of live performance, creating a thriving 
              community that celebrates the arts.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: Heart,
                  title: "Support Local Arts",
                  description: "Help local theater groups thrive by connecting them with their audience."
                },
                {
                  icon: Users,
                  title: "Build Community",
                  description: "Join a network of theater enthusiasts, performers, and creators."
                },
                {
                  icon: Sparkles,
                  title: "Discover Magic",
                  description: "Find unique productions you won't see anywhere else."
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-landing-primary/10 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-landing-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-landing-text mb-1">{item.title}</h3>
                    <p className="text-landing-muted">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
