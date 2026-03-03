import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";
import heroTheater from "@/assets/landing/hero-theater.jpg";
import TheaterMarquee from "@/components/ui/theater-marquee";

export const CinematicLanding = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Parallax-like effect */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroTheater}
          alt="Theater Stage"
          className="w-full h-full object-cover"
        />
        {/* Gradients/Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--secondary)/0.3),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--primary)/0.22),_transparent_45%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-30 [background-image:linear-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:60px_60px]" />

      {/* Live Ticker */}
      <div className="fixed bottom-0 left-0 w-full z-30">
        <TheaterMarquee />
      </div>

      <div className="container relative z-10 px-4 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 pt-20">

        {/* Left Side: Typography */}
        <div className="text-center md:text-left max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-background/50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-secondary backdrop-blur">
              Manila Theater Network
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight drop-shadow-lg">
              The Stage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-yellow-100 to-secondary">
                Is Yours.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground/90 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0 drop-shadow-md font-medium">
              Connect with local theater groups, discover upcoming productions, and find your audience in Metro Manila.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm font-medium text-secondary/80">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                University Theater
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Community Groups
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Local Productions
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="relative">
            {/* Glow Effect behind card */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-secondary via-primary to-secondary rounded-2xl blur-md opacity-40" />

            <div className="relative overflow-hidden bg-card/55 backdrop-blur-xl border border-white/15 p-8 rounded-2xl shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-secondary/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
              <AuthForm />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
