import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import stagelinkLogo from "@/assets/stagelink-logo-mask.png";

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
  e.preventDefault();
  const element = document.getElementById(sectionId);
  if (element) {
    const navbarHeight = 80; // Account for fixed navbar
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementPosition - navbarHeight,
      behavior: "smooth"
    });
  }
};

const LandingNavbar = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-secondary/20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center sm:justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img 
              src={stagelinkLogo} 
              alt="StageLink" 
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-lg sm:text-xl font-sans font-bold text-foreground tracking-tight">
              Stage<span className="text-secondary">Link</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, "features")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, "pricing")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pricing
            </a>
            <a 
              href="#roadmap" 
              onClick={(e) => scrollToSection(e, "roadmap")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Roadmap
            </a>
            <a 
              href="#faq" 
              onClick={(e) => scrollToSection(e, "faq")}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              FAQ
            </a>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              About
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:bg-muted hidden sm:inline-flex">
                Explore Shows
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default LandingNavbar;