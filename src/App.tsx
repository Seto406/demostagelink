import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { useEffect, Suspense, lazy } from "react";
import { EnhancedToastProvider, setToastHandler, useEnhancedToast } from "@/components/ui/enhanced-toast";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { CinematicBackground } from "@/components/ui/cinematic-background";
import PageTransition from "@/components/ui/page-transition";
import IdleTimerProvider from "@/providers/IdleTimerProvider";
import { FullPageLoader } from "@/components/ui/branded-loader";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const UserFeed = lazy(() => import("./pages/UserFeed"));
const Directory = lazy(() => import("./pages/Directory"));
const Shows = lazy(() => import("./pages/Shows"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ShowDetailsPage = lazy(() => import("./pages/ShowDetailsPage"));
const ProducerProfile = lazy(() => import("./pages/ProducerProfile"));
const GroupProfile = lazy(() => import("./pages/GroupProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
      <Suspense fallback={<FullPageLoader />}>
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
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
