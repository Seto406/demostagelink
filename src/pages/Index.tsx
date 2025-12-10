import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import MissionSection from "@/components/landing/MissionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import LandingFooter from "@/components/landing/LandingFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      <main>
        <LandingHero />
        <MissionSection />
        <FeaturesSection />
        <PricingSection />
        <ShowcaseSection />
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default Index;
