import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Ticket, Users, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

interface ShowDetails {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  ticket_link: string | null;
  poster_url: string | null;
  niche: "local" | "university" | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles: {
    id: string;
    group_name: string | null;
    description: string | null;
    founded_year: number | null;
    niche: "local" | "university" | null;
  } | null;
}

const ShowDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) {
        setError("Show not found");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("shows")
        .select(`
          *,
          profiles:producer_id (
            id,
            group_name,
            description,
            founded_year,
            niche
          )
        `)
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching show:", fetchError);
        setError("Failed to load show details");
      } else if (!data) {
        setError("Show not found or not yet approved");
      } else {
        setShow(data as ShowDetails);
        // Update page title for shareability
        document.title = `${data.title} | StageLink`;
      }
      setLoading(false);
    };

    fetchShow();

    // Reset title on unmount
    return () => {
      document.title = "StageLink | Discover Local Theater in Metro Manila";
    };
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      short: date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      }),
      year: date.getFullYear()
    };
  };

  const getNicheLabel = (niche: string | null) => {
    switch (niche) {
      case "local":
        return "Local/Community Theater";
      case "university":
        return "University Theater";
      default:
        return "Theater Production";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-muted-foreground">Loading show details...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="text-6xl mb-6">🎭</div>
              <h1 className="text-2xl font-serif text-foreground mb-4">
                {error || "Show Not Found"}
              </h1>
              <p className="text-muted-foreground mb-8">
                This show may have been removed or is still pending approval.
              </p>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const dateInfo = formatDate(show.date);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section with Poster */}
        <section className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          
          <div className="container mx-auto px-6 py-12 relative z-10">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="mb-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1"
              >
                <div className="aspect-[2/3] bg-gradient-to-br from-card to-muted border border-secondary/30 overflow-hidden relative group">
                  {show.poster_url ? (
                    <img 
                      src={show.poster_url} 
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="text-8xl opacity-40">🎭</span>
                    </div>
                  )}
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-secondary/50" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-secondary/50" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-secondary/50" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-secondary/50" />
                </div>
              </motion.div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Category Badge */}
                <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium">
                  {getNicheLabel(show.niche)}
                </span>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">
                  {show.title}
                </h1>

                {/* Theater Group */}
                {show.profiles?.group_name && (
                  <Link 
                    to={`/producer/${show.profiles.id}`}
                    className="flex items-center gap-3 group w-fit"
                  >
                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium group-hover:text-secondary transition-colors">
                        {show.profiles.group_name}
                      </p>
                      {show.profiles.founded_year && (
                        <p className="text-muted-foreground text-sm">Est. {show.profiles.founded_year}</p>
                      )}
                    </div>
                  </Link>
                )}

                {/* Quick Info Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {dateInfo && (
                    <div className="flex items-start gap-3 p-4 bg-card border border-secondary/20">
                      <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-sm">Date</p>
                        <p className="text-foreground font-medium">{dateInfo.full}</p>
                      </div>
                    </div>
                  )}
                  
                  {(show.venue || show.city) && (
                    <div className="flex items-start gap-3 p-4 bg-card border border-secondary/20">
                      <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-sm">Venue</p>
                        <p className="text-foreground font-medium">
                          {show.venue || "Venue TBA"}
                        </p>
                        {show.city && (
                          <p className="text-muted-foreground text-sm">{show.city}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {show.ticket_link ? (
                  <a href={show.ticket_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="hero" size="xl" className="w-full sm:w-auto">
                      <Ticket className="w-5 h-5 mr-2" />
                      Get Tickets
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Button variant="hero" size="xl" className="w-full sm:w-auto" disabled>
                    <Clock className="w-5 h-5 mr-2" />
                    Tickets Coming Soon
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  About This Production
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {show.description || 
                      "Details about this production will be announced soon. Stay tuned for more information about the synopsis, cast, and creative team."}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Theater Group Section */}
        {show.profiles && (
          <section className="py-16 bg-gradient-to-b from-muted/10 to-background">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  About the Theater Group
                </h2>
                <div className="bg-card border border-secondary/20 p-8">
                  <Link 
                    to={`/producer/${show.profiles.id}`}
                    className="flex items-start gap-4 mb-4 group w-fit"
                  >
                    <div className="w-16 h-16 bg-primary/20 flex items-center justify-center text-3xl group-hover:bg-primary/30 transition-colors">
                      🎭
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-foreground group-hover:text-secondary transition-colors">
                        {show.profiles.group_name || "Theater Group"}
                      </h3>
                      <p className="text-secondary text-sm">
                        {getNicheLabel(show.profiles.niche)}
                        {show.profiles.founded_year && ` • Est. ${show.profiles.founded_year}`}
                      </p>
                    </div>
                  </Link>
                  <p className="text-muted-foreground leading-relaxed">
                    {show.profiles.description || 
                      "This theater group is part of Metro Manila's vibrant theatrical community, dedicated to bringing compelling stories to life on stage."}
                  </p>
                  <Link 
                    to={`/producer/${show.profiles.id}`}
                    className="text-secondary hover:underline text-sm mt-4 inline-block"
                  >
                    View all shows by this group →
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Share Section */}
        <section className="py-12 border-t border-secondary/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Share this show with fellow theater lovers
              </p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ShowDetailsPage;
