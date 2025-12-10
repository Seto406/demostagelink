import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CityBrowser from "@/components/home/CityBrowser";
import UniversitySpotlight from "@/components/home/UniversitySpotlight";
import UpcomingShows from "@/components/home/UpcomingShows";
import { CurtainReveal } from "@/components/ui/curtain-reveal";
import { EntranceAnimation } from "@/components/ui/entrance-animation";
import { TheaterMarquee } from "@/components/ui/theater-marquee";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Theater Marquee Announcement Bar */}
      <TheaterMarquee />
      
      <main>
        <HeroSection />
        
        {/* City Browser with curtain reveal */}
        <CurtainReveal delay={0.1}>
          <CityBrowser />
        </CurtainReveal>
        
        {/* University Spotlight with entrance animation */}
        <EntranceAnimation type="spotlight" delay={0.1}>
          <UniversitySpotlight />
        </EntranceAnimation>
        
        {/* Upcoming Shows with curtain reveal */}
        <CurtainReveal delay={0.1}>
          <UpcomingShows />
        </CurtainReveal>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
