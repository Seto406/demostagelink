import { motion } from "framer-motion";
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
              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">Our Mission</h2>
                <p className="leading-relaxed">
                  StageLink is a visibility platform dedicated to connecting audiences with the vibrant 
                  world of local and university theater across Metro Manila. We believe every story 
                  deserves to be told, and every theater group deserves to be seen.
                </p>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">What We Do</h2>
                <p className="leading-relaxed">
                  We provide a centralized platform where theater enthusiasts can discover upcoming 
                  productions, explore theater groups by city or category, and connect with the 
                  passionate people behind every curtain call.
                </p>
              </div>

              <div className="border-l-2 border-secondary/50 pl-6">
                <h2 className="text-2xl font-serif text-foreground mb-4">For Theater Groups</h2>
                <p className="leading-relaxed">
                  Are you part of a theater group? StageLink offers you a platform to showcase your 
                  productions, reach new audiences, and become part of a growing community of 
                  Filipino theatrical artists. Submit your group and start connecting with theater 
                  lovers today.
                </p>
              </div>

              <div className="bg-card border border-secondary/20 p-8 text-center">
                <h3 className="text-xl font-serif text-foreground mb-4">
                  "The theater is a spiritual and social X-ray of its time."
                </h3>
                <p className="text-secondary text-sm">— Stella Adler</p>
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
