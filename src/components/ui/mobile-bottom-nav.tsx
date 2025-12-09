import * as React from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Shows", path: "/shows" },
  { icon: Calendar, label: "Directory", path: "/directory" },
  { icon: Info, label: "About", path: "/about" },
  { icon: User, label: "Login", path: "/login" },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = React.useState(false);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  // Check for reduced motion preference
  const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useMotionValueEvent(scrollY, "change", (current) => {
    // Show after scrolling down 100px and when scrolling up
    if (current > 100) {
      if (current < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (current > lastScrollY + 10) {
        // Scrolling down significantly
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
    setLastScrollY(current);
  });

  // Don't show on dashboard or admin pages
  const excludedPaths = ["/dashboard", "/admin", "/login", "/reset-password", "/verify-email"];
  if (excludedPaths.some((path) => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={shouldReduceMotion ? { opacity: 1 } : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
          className={cn(
            "fixed bottom-4 left-4 right-4 z-50 md:hidden",
            "bg-card/80 backdrop-blur-xl border border-secondary/20",
            "rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "safe-area-inset-bottom"
          )}
        >
          <div className="flex items-center justify-around py-2 px-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 bg-secondary/15 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="relative z-10"
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors duration-200",
                        isActive ? "text-secondary" : "text-muted-foreground"
                      )}
                    />
                  </motion.div>
                  
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium transition-colors duration-200 relative z-10",
                      isActive ? "text-secondary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          
          {/* iOS-style home indicator */}
          <div className="flex justify-center pb-1">
            <div className="w-32 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
