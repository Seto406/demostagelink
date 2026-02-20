import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CinematicLanding } from "@/components/landing/CinematicLanding";
import MissionSection from "@/components/landing/MissionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import RoadmapSection from "@/components/landing/RoadmapSection";
import FAQSection from "@/components/landing/FAQSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import LandingFooter from "@/components/landing/LandingFooter";
import { BrandedLoader } from "@/components/ui/branded-loader";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users based on role
  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (profile?.role === "producer") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/feed", { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

  // Only show landing page for logged-out users
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div>
        <CinematicLanding />
        <MissionSection />
        <FeaturesSection />
        <PricingSection />
        <RoadmapSection />
        <FAQSection />
        <ShowcaseSection />
      </div>
      
      <LandingFooter />
    </div>
  );
};

export default Index;
