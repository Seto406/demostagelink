import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Menu, X, Settings, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

const Navbar = () => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Scroll-based animations
  const { scrollY } = useScroll();
  const isScrolled = useTransform(scrollY, [0, 20], [false, true]);
  
  // Dynamic values based on scroll
  const headerHeight = useTransform(scrollY, [0, 100], [72, 56]);
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.85]);
  const bgOpacity = useTransform(scrollY, [0, 50], [0.6, 0.98]);
  const blurAmount = useTransform(scrollY, [0, 50], [8, 20]);
  const borderOpacity = useTransform(scrollY, [0, 50], [0.1, 0.3]);
  
  const [scrolled, setScrolled] = useState(false);

  // Dynamic nav links based on auth state
  // Nav links without Favorites - moved to user section
  const navLinks = user
    ? [
        { path: "/feed", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/about", label: "About" },
      ]
    : [
        { path: "/", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/about", label: "About" },
      ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          height: headerHeight,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? "shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : ""
        }`}
      >
        {/* Glassmorphism background */}
        <motion.div 
          className="absolute inset-0 bg-background border-b border-secondary"
          style={{
            opacity: bgOpacity,
            backdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
            WebkitBackdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
            borderBottomColor: useTransform(borderOpacity, (v) => `hsl(43 72% 52% / ${v})`),
          }}
        />
        
        <div className="container mx-auto px-4 sm:px-6 h-full relative z-10">
          <div className="flex items-center justify-between h-full">
            {/* Logo - Routes to feed if logged in, landing if not */}
            <Link to={user ? "/feed" : "/"} className="flex items-center gap-2 sm:gap-3 group">
              <motion.img
                style={{ scale: logoScale }}
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.3 }}
                src={stageLinkLogo}
                alt="StageLink Logo"
                className="h-8 sm:h-10 w-auto origin-left"
              />
              <motion.span 
                style={{ scale: logoScale }}
                className="text-lg sm:text-xl font-sans font-bold text-foreground tracking-tight origin-left"
              >
                Stage<span className="text-secondary">Link</span>
              </motion.span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm uppercase tracking-widest font-medium transition-colors duration-300 hover:text-secondary py-2 ${
                    location.pathname === link.path
                      ? "text-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-primary">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {profile?.role === "producer" && (
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/favorites">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-foreground touch-target"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Theater Curtain Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop with theater ambiance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 bg-background/90 backdrop-blur-md z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Left Curtain */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-primary/95 to-primary/80 z-50 md:hidden"
              style={{
                boxShadow: "10px 0 30px rgba(0,0,0,0.3)",
              }}
            >
              {/* Curtain texture overlay */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.1) 2px,
                    rgba(0,0,0,0.1) 4px
                  )`
                }} />
              </div>
              
              {/* Gold trim */}
              <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-secondary via-secondary/60 to-secondary origin-top"
              />
            </motion.div>

            {/* Right Curtain */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-primary/95 to-primary/80 z-50 md:hidden"
              style={{
                boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
              }}
            >
              {/* Curtain texture overlay */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.1) 2px,
                    rgba(0,0,0,0.1) 4px
                  )`
                }} />
              </div>
              
              {/* Gold trim */}
              <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary via-secondary/60 to-secondary origin-top"
              />
            </motion.div>

            {/* Center Content Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="fixed inset-x-8 top-24 bottom-8 bg-card/95 backdrop-blur-xl border border-secondary/30 z-50 md:hidden overflow-y-auto rounded-2xl shadow-2xl"
            >
              {/* Theater stage top border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20 rounded-t-2xl" />
              
              <div className="p-6 pt-8">
                {/* Theater mask icon */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="text-center mb-6"
                >
                  <span className="text-4xl">🎭</span>
                </motion.div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2 mb-8">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.08 }}
                    >
                      <Link
                        to={link.path}
                        className={`block py-4 px-6 text-lg font-sans font-medium text-center transition-all duration-300 touch-target rounded-xl ${
                          location.pathname === link.path
                            ? "text-secondary bg-secondary/10 border border-secondary/30"
                            : "text-foreground hover:bg-secondary/5 hover:text-secondary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Decorative divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent mb-6"
                />

                {/* Auth Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {user ? (
                    <div className="flex flex-col gap-3">
                      {isAdmin && (
                        <Link to="/admin" className="w-full">
                          <Button variant="ghost" className="w-full justify-center text-primary font-sans rounded-xl">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      {profile?.role === "producer" && (
                        <Link to="/dashboard" className="w-full">
                          <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                            Dashboard
                          </Button>
                        </Link>
                      )}
                      <Link to="/settings" className="w-full">
                        <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <Link to="/favorites" className="w-full">
                        <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                          <Heart className="w-4 h-4 mr-2" />
                          Favorites
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full font-sans rounded-xl" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/login" className="w-full block">
                      <Button variant="hero" className="w-full font-sans rounded-xl">
                        Enter the Stage
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>

              {/* Theater stage bottom border */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20 rounded-b-2xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;