import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { EnhancedToastProvider, setToastHandler, useEnhancedToast } from "@/components/ui/enhanced-toast";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { CinematicBackground } from "@/components/ui/cinematic-background";
import PageTransition from "@/components/ui/page-transition";
import IdleTimerProvider from "@/providers/IdleTimerProvider";
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
import GroupProfile from "./pages/GroupProfile";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
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

// Main routes wrapper
const AppRoutes = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <PageTransition>
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
        <Route path="/dashboard/analytics" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/show/:id" element={<ShowDetailsPage />} />
        <Route path="/producer/:id" element={<ProducerProfile />} />
        <Route path="/group/:id" element={<GroupProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        <EnhancedToastProvider>
          <CinematicBackground>
            <ToastHandlerInit />
            <ScrollProgress color="gold" height={3} />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <IdleTimerProvider>
                  <AppRoutes />
                  <MobileBottomNav />
                </IdleTimerProvider>
              </AuthProvider>
            </BrowserRouter>
          </CinematicBackground>
        </EnhancedToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
