import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Play } from "lucide-react";

const LandingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-landing-surface to-landing-accent/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-landing-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-landing-gold/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-landing-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-landing-primary/10 text-landing-primary px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">The Future of Theater Discovery</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-landing-text mb-6 leading-tight"
          >
            Your Stage,{" "}
            <span className="relative">
              <span className="text-landing-primary">Connected</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-landing-gold rounded-full origin-left"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-landing-muted max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            The ultimate platform for theater groups to showcase their work and for audiences 
            to discover the magic of local productions across Metro Manila.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/login">
              <Button 
                size="lg" 
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full px-8 py-6 text-lg group shadow-lg shadow-landing-primary/25"
              >
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/shows">
              <Button 
                size="lg" 
                variant="outline"
                className="border-landing-border text-landing-text hover:bg-landing-surface rounded-full px-8 py-6 text-lg group"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-landing-text/10 border border-landing-border overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-landing-surface border-b border-landing-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-full px-4 py-1 text-sm text-landing-muted text-center">
                    stagelink.app
                  </div>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="aspect-video bg-gradient-to-br from-landing-surface to-white flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🎭</div>
                  <p className="text-landing-muted text-lg">Discover Amazing Productions</p>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-lg p-4 border border-landing-border hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-landing-gold/20 rounded-full flex items-center justify-center text-xl">
                  ⭐
                </div>
                <div>
                  <p className="font-semibold text-landing-text">50+ Groups</p>
                  <p className="text-sm text-landing-muted">Active theaters</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute -right-8 bottom-1/4 bg-white rounded-xl shadow-lg p-4 border border-landing-border hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-landing-primary/10 rounded-full flex items-center justify-center text-xl">
                  🎪
                </div>
                <div>
                  <p className="font-semibold text-landing-text">100+ Shows</p>
                  <p className="text-sm text-landing-muted">Productions listed</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
