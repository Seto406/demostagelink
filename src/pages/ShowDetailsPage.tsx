import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Ticket, Users, Clock, ExternalLink, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";

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
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: string[] | null;
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
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) {
        setError("Production not found");
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
        setError("Failed to load production details");
      } else if (!data) {
        setError("Production not found or not yet approved");
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
              <BrandedLoader size="lg" text="Loading production details..." />
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
                {error || "Production Not Found"}
              </h1>
              <p className="text-muted-foreground mb-8">
                This production may have been removed or is still pending approval.
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

  const googleCalendarLink = (() => {
    if (!show || !show.date) return "";
    const title = encodeURIComponent(show.title);
    const details = encodeURIComponent(show.description || "");
    const location = encodeURIComponent(show.venue || "");

    // Format date as YYYYMMDD
    const dateObj = new Date(show.date);
    const dateStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
    const dates = `${dateStr}/${dateStr}`; // All day event

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  })();

  const downloadICS = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!show || !show.date) return;

    // Format date as YYYYMMDD
    const dateObj = new Date(show.date);
    const dateStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
    // Create next day string for end date (all day event requires end date to be next day)
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART;VALUE=DATE:${dateStr.replace(/-/g, '')}
DTEND;VALUE=DATE:${nextDayStr.replace(/-/g, '')}
SUMMARY:${show.title}
DESCRIPTION:${show.description || ""}
LOCATION:${show.venue || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${show.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section with Poster */}
        <section className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          
          <div className="container mx-auto px-6 py-12 relative z-10">
            {/* Back Button & Share */}
            <div className="flex justify-between items-center mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CopyButton
                  variant="outline"
                  size="sm"
                  value={window.location.href}
                  successMessage="Link copied to clipboard!"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </CopyButton>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1"
              >
                <div className="aspect-[2/3] bg-gradient-to-br from-card to-muted border border-secondary/30 overflow-hidden relative group rounded-sm shadow-2xl">
                  {show.poster_url ? (
                    <img 
                      src={show.poster_url} 
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-6 text-center">
                      <Ticket className="w-24 h-24 text-secondary/20 mb-4" />
                      <div className="space-y-2">
                        <span className="text-xl font-serif text-secondary/40">No Poster Available</span>
                      </div>
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                          backgroundSize: "24px 24px"
                        }}
                      />
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
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1.5">
                          <a
                            href={googleCalendarLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors"
                          >
                            <Calendar className="w-3 h-3" />
                            Google Calendar
                          </a>
                          <a
                            href="#"
                            onClick={downloadICS}
                            className="inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Outlook / Apple
                          </a>
                        </div>
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
                  <a
                    href={show.ticket_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (show.profiles?.id) {
                        trackEvent('ticket_click', show.profiles.id, show.id);
                      }
                    }}
                  >
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
                <div className="prose prose-lg prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed tracking-wide">
                    {show.description || 
                      "Details about this production will be announced soon. Stay tuned for more information about the synopsis, cast, and creative team."}
                  </p>
                </div>

                {/* Production Details */}
                {(show.genre || show.director || show.duration) && (
                  <div className="mt-8 grid sm:grid-cols-3 gap-4">
                    {show.genre && (
                      <div className="bg-card border border-secondary/20 p-4 rounded-xl">
                        <p className="text-muted-foreground text-sm mb-1">Genre</p>
                        <p className="text-foreground font-medium">{show.genre}</p>
                      </div>
                    )}
                    {show.director && (
                      <div className="bg-card border border-secondary/20 p-4 rounded-xl">
                        <p className="text-muted-foreground text-sm mb-1">Director</p>
                        <p className="text-foreground font-medium">{show.director}</p>
                      </div>
                    )}
                    {show.duration && (
                      <div className="bg-card border border-secondary/20 p-4 rounded-xl">
                        <p className="text-muted-foreground text-sm mb-1">Duration</p>
                        <p className="text-foreground font-medium">{show.duration}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Cast */}
                {show.cast_members && show.cast_members.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-4">Cast</h3>
                    <div className="flex flex-wrap gap-2">
                      {show.cast_members.map((member, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-card border border-secondary/20 text-foreground text-sm rounded-full"
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {show.tags && show.tags.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2">
                      {show.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                    View all productions by this group →
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="py-16 border-t border-secondary/10">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-8">
                Audience Reviews
              </h2>
              <div className="space-y-12">
                <ReviewForm
                  showId={show.id}
                  onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
                />
                <ReviewList
                  showId={show.id}
                  refreshTrigger={refreshReviews}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="py-12 border-t border-secondary/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Share this production with fellow theater lovers
              </p>
              <div className="flex items-center gap-3">
                <CopyButton
                  variant="outline"
                  size="sm"
                  value={window.location.href}
                  successMessage="Link copied to clipboard!"
                >
                  Copy Link
                </CopyButton>
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
