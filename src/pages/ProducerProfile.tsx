import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Facebook, Instagram, Video, Image } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Producer {
  id: string;
  group_name: string | null;
  description: string | null;
  founded_year: number | null;
  niche: "local" | "university" | null;
  avatar_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  video_url: string | null;
  gallery_images: string[] | null;
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

  useEffect(() => {
    const fetchProducerData = async () => {
      if (!id) return;

      // Fetch producer profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, group_name, description, founded_year, niche, avatar_url, facebook_url, instagram_url, video_url, gallery_images")
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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*).*/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
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
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Producer Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link to="/directory" className="text-secondary hover:text-secondary/80 text-sm mb-4 inline-block">
              ← Back to Directory
            </Link>
            
            <div className="bg-card border border-secondary/20 p-8 md:p-12 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-5xl md:text-6xl shrink-0 border-2 border-secondary/30">
                  {producer.avatar_url ? (
                    <img 
                      src={producer.avatar_url} 
                      alt={producer.group_name || "Producer"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>🎭</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <span className="text-secondary text-xs uppercase tracking-wider mb-2 block">
                    {getNicheLabel(producer.niche)}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    {producer.group_name || "Unnamed Group"}
                  </h1>
                  
                  {producer.description && (
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      {producer.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-6 text-sm">
                    {producer.founded_year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <span>Founded {producer.founded_year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-secondary" />
                      <span>{shows.length} {shows.length === 1 ? "Production" : "Productions"}</span>
                    </div>
                  </div>
                  
                  {/* Social Media Links */}
                  {(producer.facebook_url || producer.instagram_url) && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-secondary/20">
                      {producer.facebook_url && (
                        <a 
                          href={producer.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <Facebook className="w-5 h-5" />
                          <span className="text-sm">Facebook</span>
                        </a>
                      )}
                      {producer.instagram_url && (
                        <a 
                          href={producer.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rich Media Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12 space-y-12"
          >
            {/* Featured Video */}
            {producer.video_url && getEmbedUrl(producer.video_url) && (
              <div className="bg-card border border-secondary/20 p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Video className="w-5 h-5 text-secondary" />
                  <h2 className="text-xl font-serif font-bold text-foreground">Featured Video</h2>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/5">
                  <iframe
                    src={getEmbedUrl(producer.video_url)!}
                    title="Featured Video"
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

            {/* Gallery */}
            {producer.gallery_images && producer.gallery_images.length > 0 && (
              <div className="bg-card border border-secondary/20 p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Image className="w-5 h-5 text-secondary" />
                  <h2 className="text-xl font-serif font-bold text-foreground">Gallery</h2>
                </div>

                <Carousel className="w-full max-w-4xl mx-auto">
                  <CarouselContent>
                    {producer.gallery_images.map((img, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <div className="aspect-square relative rounded-xl overflow-hidden border border-secondary/20">
                            <img
                              src={img}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </Carousel>
              </div>
            )}
          </motion.div>

          {/* Shows Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
              Productions
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
      </main>
      <Footer />
    </div>
  );
};

export default ProducerProfile;
