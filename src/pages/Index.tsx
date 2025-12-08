import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CityBrowser from "@/components/home/CityBrowser";
import UniversitySpotlight from "@/components/home/UniversitySpotlight";
import UpcomingShows from "@/components/home/UpcomingShows";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <CityBrowser />
        <UniversitySpotlight />
        <UpcomingShows />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
