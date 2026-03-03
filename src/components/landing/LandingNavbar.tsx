import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import stagelinkLogo from "@/assets/stagelink-logo-mask.png";

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
  e.preventDefault();
  const element = document.getElementById(sectionId);
  if (element) {
    const navbarHeight = 80;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementPosition - navbarHeight,
      behavior: "smooth"
    });
  }
};

const LandingNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-secondary/20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-2 sm:gap-3" onClick={closeMenu}>
            <img src={stagelinkLogo} alt="StageLink logo" className="h-8 sm:h-10 w-auto" />
            <span className="text-lg sm:text-xl font-sans font-bold text-foreground tracking-tight">
              Stage<span className="text-secondary">Link</span>
            </span>
          </Link>

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

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/shows" className="md:hidden">
              <Button size="sm" className="h-9 px-4 text-xs font-semibold tracking-wide">
                Browse
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:bg-muted hidden sm:inline-flex">
                Explore Shows
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-secondary/20 py-4">
            <nav className="mx-auto flex w-full max-w-sm flex-col gap-2 pb-2">
              {["features", "pricing", "faq"].map((section) => (
                <a
                  key={section}
                  href={`#${section}`}
                  onClick={(e) => {
                    scrollToSection(e, section);
                    closeMenu();
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                >
                  {section.toUpperCase() === "FAQ" ? "FAQ" : section.charAt(0).toUpperCase() + section.slice(1)}
                </a>
              ))}
              <Link
                to="/about"
                onClick={closeMenu}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                About
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/shows" onClick={closeMenu}>
                  <Button variant="secondary" className="w-full">Browse Shows</Button>
                </Link>
                <Link to="/login" onClick={closeMenu}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
              <p className="px-1 pt-2 text-center text-xs text-muted-foreground">
                Mobile tip: tap a show card to save favorites, view venue details, and jump to tickets.
              </p>
            </nav>
          </div>
        )}
      </div>

      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-40 bg-background/50 md:hidden"
          aria-label="Close menu overlay"
          onClick={closeMenu}
        />
      )}
    </motion.header>
  );
};

export default LandingNavbar;
