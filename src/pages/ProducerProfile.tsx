import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Facebook, Instagram, Twitter } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { Button } from "@/components/ui/button";

interface Producer {
  id: string;
  group_name: string | null;
  description: string | null;
  founded_year: number | null;
  niche: "local" | "university" | null;
  avatar_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  twitter_url: string | null;
}

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  poster_url: string | null;
}

const ProducerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const productionsRef = useRef<HTMLDivElement>(null);

  const scrollToProductions = () => {
    productionsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchProducerData = async () => {
      if (!id) return;

      // Fetch producer profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, group_name, description, founded_year, niche, avatar_url, facebook_url, instagram_url, cover_image, gallery_images, twitter_url")
        .eq("id", id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching producer:", profileError);
      } else if (profileData) {
        setProducer(profileData as Producer);
      }

      // Fetch producer's approved shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("id, title, description, date, venue, city, poster_url")
        .eq("producer_id", id)
        .eq("status", "approved")
        .order("date", { ascending: false });

      if (showsError) {
        console.error("Error fetching shows:", showsError);
      } else {
        setShows(showsData as Show[]);
      }

      setLoading(false);
    };

    fetchProducerData();
  }, [id]);

  const getNicheLabel = (niche: string | null) => {
    switch (niche) {
      case "local":
        return "Local/Community Theater";
      case "university":
        return "University Theater Group";
      default:
        return "Theater Group";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 flex items-center justify-center min-h-[50vh]">
            <BrandedLoader size="lg" text="Loading producer profile..." />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-3xl font-serif text-foreground mb-4">Producer Not Found</h1>
            <p className="text-muted-foreground mb-6">This producer profile doesn't exist.</p>
            <Link to="/directory" className="text-secondary hover:underline">
              ← Back to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-16">
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 bg-muted">
            {producer.cover_image ? (
              <img
                src={producer.cover_image}
                alt={producer.group_name || "Cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-background flex items-center justify-center">
                <span className="text-9xl opacity-5">🎭</span>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent/30" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className="text-secondary text-sm md:text-base uppercase tracking-[0.2em] mb-4 block">
                  {getNicheLabel(producer.niche)}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-8 drop-shadow-lg">
                  {producer.group_name || "Unnamed Group"}
                </h1>
                <Button
                  size="xl"
                  variant="hero"
                  onClick={scrollToProductions}
                  className="rounded-full px-12"
                >
                  Book Now
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center">
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-muted-foreground text-sm animate-bounce"
             >
               Scroll to explore
             </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-6 pt-12">
          {/* Bio & Info */}
          <div className="max-w-4xl mx-auto mb-20">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
             >
                {/* Description */}
                {producer.description && (
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 font-serif">
                    {producer.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm uppercase tracking-widest text-secondary">
                    {producer.founded_year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Est. {producer.founded_year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{shows.length} {shows.length === 1 ? "Production" : "Productions"}</span>
                    </div>
                </div>

                {/* Socials */}
                <div className="flex justify-center gap-6">
                  {producer.facebook_url && (
                    <a
                      href={producer.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 transform hover:scale-110"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {producer.instagram_url && (
                    <a
                      href={producer.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 transform hover:scale-110"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {producer.twitter_url && (
                    <a
                      href={producer.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 transform hover:scale-110"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
             </motion.div>
          </div>

          {/* Gallery Section */}
          {producer.gallery_images && producer.gallery_images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
                Gallery
              </h2>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {producer.gallery_images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="break-inside-avoid overflow-hidden rounded-lg group"
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Shows Section */}
          <div ref={productionsRef}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
                Current Productions
              </h2>
            
            {shows.length === 0 ? (
              <div className="bg-card border border-secondary/20 p-12 text-center">
                <p className="text-muted-foreground">No approved productions yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shows.map((show, index) => (
                  <motion.div
                    key={show.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link 
                      to={`/show/${show.id}`}
                      className="block bg-card border border-secondary/20 overflow-hidden group hover:border-secondary/50 transition-all duration-300"
                    >
                      {/* Poster */}
                      <div className="aspect-[3/2] relative overflow-hidden">
                        {show.poster_url ? (
                          <img 
                            src={show.poster_url} 
                            alt={show.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-4xl opacity-30">🎭</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-secondary transition-colors">
                          {show.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {show.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(show.date).toLocaleDateString()}
                            </span>
                          )}
                          {show.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {show.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProducerProfile;
