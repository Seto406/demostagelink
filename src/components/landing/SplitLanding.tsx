import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";
import { Sparkles } from "lucide-react";
import heroTheater from "@/assets/landing/hero-theater.jpg";

export const SplitLanding = () => {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row bg-background pt-20 lg:pt-0">
      {/* Left Pane - Showcase */}
      <div className="lg:w-1/2 relative overflow-hidden flex items-center justify-center p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-secondary/20">
        {/* Background Effects for Left Pane */}
        <div className="absolute inset-0 bg-secondary/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 max-w-xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6 border border-secondary/30"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">The Future of Theater Discovery</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight"
          >
            Your Stage,{" "}
            <span className="relative inline-block">
              <span className="text-secondary">Connected</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-primary rounded-full origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
          >
            The ultimate platform for theater groups to showcase their work and for audiences
            to discover the magic of local productions across Metro Manila.
          </motion.p>

          {/* Hero Image Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-2xl shadow-2xl border border-secondary/20 overflow-hidden relative group"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={heroTheater}
                alt="Theater stage with audience applauding"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                 <div className="flex gap-2 mb-2">
                    <span className="px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded-md">Featured</span>
                    <span className="px-2 py-1 bg-secondary/90 text-secondary-foreground text-xs rounded-md">Live Now</span>
                 </div>
                 <p className="text-white font-serif text-lg">Discover 100+ Local Productions</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background/50 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <AuthForm className="w-full" />
        </div>
      </div>
    </section>
  );
};
