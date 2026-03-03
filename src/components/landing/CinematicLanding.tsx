import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import heroTheater from "@/assets/landing/hero-theater.jpg";
import TheaterMarquee from "@/components/ui/theater-marquee";
import { Button } from "@/components/ui/button";

const quickSections = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

export const CinematicLanding = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pb-20 pt-24 sm:pt-28">
      <div className="absolute inset-0 z-0">
        <img src={heroTheater} alt="Theater Stage" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/75 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--secondary)/0.3),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--primary)/0.22),_transparent_45%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-30 [background-image:linear-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="fixed bottom-0 left-0 z-30 w-full">
        <TheaterMarquee />
      </div>

      <div className="container relative z-10 mx-auto w-full px-4 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-background/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-secondary backdrop-blur sm:text-xs">
                Manila Theater Network
              </span>
              <h1 className="mb-4 mt-4 text-4xl font-serif font-bold leading-tight text-foreground drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
                The Stage <br />
                <span className="bg-gradient-to-r from-secondary via-yellow-100 to-secondary bg-clip-text text-transparent">
                  Is Yours.
                </span>
              </h1>
              <p className="mx-auto mb-6 max-w-lg text-base font-medium leading-relaxed text-muted-foreground/90 drop-shadow-md sm:text-lg lg:mx-0">
                Discover nearby productions, track upcoming shows, and support local theater in minutes.
              </p>

              <div className="mb-6 flex flex-wrap justify-center gap-2.5 text-xs font-medium text-secondary/85 sm:text-sm lg:justify-start">
                <span className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  University Groups
                </span>
                <span className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Community Shows
                </span>
                <span className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Instant Ticket Links
                </span>
              </div>

              <div className="mx-auto flex w-full max-w-md flex-wrap justify-center gap-2 lg:hidden">
                {quickSections.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-secondary/30 bg-background/65 px-4 py-2 text-xs font-semibold text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
                <Link to="/shows">
                  <Button size="sm" className="h-8 rounded-full px-4 text-xs">Browse Shows</Button>
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-secondary via-primary to-secondary opacity-40 blur-md" />

              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-card/60 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-secondary/25 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
                <AuthForm />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
