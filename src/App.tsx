import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { EnhancedToastProvider, setToastHandler, useEnhancedToast } from "@/components/ui/enhanced-toast";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { CinematicBackground } from "@/components/ui/cinematic-background";
import Index from "./pages/Index";
import UserFeed from "./pages/UserFeed";
import Directory from "./pages/Directory";
import Shows from "./pages/Shows";
import About from "./pages/About";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ShowDetailsPage from "./pages/ShowDetailsPage";
import ProducerProfile from "./pages/ProducerProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to initialize toast handler
const ToastHandlerInit = () => {
  const { addToast } = useEnhancedToast();
  useEffect(() => {
    setToastHandler(addToast);
  }, [addToast]);
  return null;
};

// Page transition variants
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Animated routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={shouldReduceMotion ? {} : pageVariants}
        initial={shouldReduceMotion ? false : "initial"}
        animate="animate"
        exit={shouldReduceMotion ? undefined : "exit"}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/feed" element={<UserFeed />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/show/:id" element={<ShowDetailsPage />} />
          <Route path="/producer/:id" element={<ProducerProfile />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <EnhancedToastProvider>
          <CinematicBackground>
            <ToastHandlerInit />
            <ScrollProgress color="gold" height={3} />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AnimatedRoutes />
                <MobileBottomNav />
              </AuthProvider>
            </BrowserRouter>
          </CinematicBackground>
        </EnhancedToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
