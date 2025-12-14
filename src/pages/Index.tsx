import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import MissionSection from "@/components/landing/MissionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import RoadmapSection from "@/components/landing/RoadmapSection";
import FAQSection from "@/components/landing/FAQSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import LandingFooter from "@/components/landing/LandingFooter";
import { BrandedLoader } from "@/components/ui/branded-loader";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to the feed
  useEffect(() => {
    if (!loading && user) {
      navigate("/feed");
    }
  }, [user, loading, navigate]);

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
      <LandingNavbar />
      
      <main>
        <LandingHero />
        <MissionSection />
        <FeaturesSection />
        <PricingSection />
        <RoadmapSection />
        <FAQSection />
        <ShowcaseSection />
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default Index;