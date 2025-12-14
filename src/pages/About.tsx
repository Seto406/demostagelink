import { motion } from "framer-motion";
import { Mail, Facebook, Instagram, Twitter } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8 text-center">
              About <span className="text-secondary">StageLink</span>
            </h1>

            <div className="space-y-8 text-muted-foreground">
              {/* Our Story - La Creneurs */}
              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">Our Story</h2>
                <p className="leading-relaxed text-lg">
                  We are <span className="text-secondary font-semibold">La Creneurs</span>, a startup team driven by a shared passion for theater and innovation. What began as a simple question — "Why was such a great play almost empty?" — became a mission to strengthen the visibility of independent and university theater groups.
                </p>
                <p className="leading-relaxed text-lg mt-4">
                  At La Creneurs, we believe that <span className="text-foreground font-medium">every performance deserves an audience</span>. We started our journey after seeing talented productions struggle to reach people, not because they lacked quality, but because they lacked visibility.
                </p>
                <p className="leading-relaxed text-lg mt-4">
                  This inspired us to create <span className="text-secondary font-semibold">StageLink</span>.
                </p>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">Our Mission</h2>
                <p className="leading-relaxed">
                  StageLink is a centralized digital platform that connects audiences with small, local, and university theater productions. It consolidates all independent and campus theater events in one place, making shows easily discoverable and boosting attendance for theater groups across Metro Manila.
                </p>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">Our Vision</h2>
                <p className="leading-relaxed">
                  To become the leading platform for theater discovery in the Philippines, where every local and university production can reach its intended audience. We envision a thriving theater community where no performance goes unnoticed, and every story finds its stage.
                </p>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">What's Available Now</h2>
                <p className="leading-relaxed mb-4">
                  StageLink is currently in <span className="text-secondary font-semibold">Phase 1</span> — our foundation release. Here's what you can do today:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Browse and discover local & university theater productions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Explore the Theater Directory with group profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Search shows by city, genre, and theater group
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Save your favorite shows to a personal watchlist
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Theater groups can submit and manage their show listings
                  </li>
                </ul>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">For Theater Groups</h2>
                <p className="leading-relaxed">
                  Are you part of a theater group? StageLink offers you a platform to showcase your 
                  productions, reach new audiences, and become part of a growing community of 
                  Filipino theatrical artists. Sign up as a producer and start connecting with theater 
                  lovers today — it's free to get started.
                </p>
              </div>

              <div className="bg-card border border-secondary/20 p-8 text-center rounded-2xl">
                <h3 className="text-xl font-serif text-foreground mb-4">
                  "The theater is a spiritual and social X-ray of its time."
                </h3>
                <p className="text-secondary text-sm">— Stella Adler</p>
              </div>

              {/* Contact Us Section */}
              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">Contact Us</h2>
                <div className="space-y-4">
                  <a 
                    href="mailto:connect.stagelink@gmail.com" 
                    className="flex items-center gap-3 text-muted-foreground hover:text-secondary transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>connect.stagelink@gmail.com</span>
                  </a>
                  
                  <div className="pt-4">
                    <p className="text-foreground font-medium mb-3">Follow Us</p>
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href="https://www.facebook.com/stagelinkonfb/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                        <span>Facebook</span>
                      </a>
                      <a 
                        href="https://www.instagram.com/stagelinkonig?igsh=MXQzbnZnZWJvM3V0NA==" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        <span>Instagram</span>
                      </a>
                      <a 
                        href="https://www.tiktok.com/@stagelinkontiktok?_r=1&_t=ZS-91vyeb8pn8M" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        <span>TikTok</span>
                      </a>
                      <a 
                        href="https://x.com/stagelinkonx" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                        <span>X (Twitter)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;