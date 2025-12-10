import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import stagelinkLogo from "@/assets/stagelink-logo-mask.png";

const LandingNavbar = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-secondary/20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img 
              src={stagelinkLogo} 
              alt="StageLink" 
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-lg sm:text-xl font-serif font-bold text-foreground tracking-wide">
              Stage<span className="text-secondary">Link</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Pricing
            </a>
            <a href="#showcase" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Showcase
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/shows">
              <Button variant="ghost" className="text-foreground hover:bg-muted hidden sm:inline-flex">
                Explore Shows
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default LandingNavbar;
