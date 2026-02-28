import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Ticket, Users, Clock, ExternalLink, Share2, Download, Heart, Pencil, Home, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/use-favorites";
import { AdBanner } from "@/components/ads/AdBanner";
import { dummyShows, ShowDetails, CastMember } from "@/data/dummyShows";

const ShowDetailsPage = () => {
  const { user, profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [isTicketClaimed, setIsTicketClaimed] = useState(false);

  useEffect(() => {
    setImageLoading(true);
    const fetchShow = async () => {
      if (!id) {
        setError("Production not found");
        setLoading(false);
        return;
      }

      // Check for dummy show first
      const dummyShow = dummyShows.find(s => s.id === id);
      if (dummyShow) {
        setShow(dummyShow);
        document.title = `${dummyShow.title} | StageLink`;
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("shows")
        .select(`
          *,
          producer_id:profiles!producer_id (
            id,
            group_name,
            username,
            description,
            founded_year,
            niche,
            group_logo_url,
            avatar_url
          ),
          theater_group:theater_groups!theater_group_id (
            id,
            name,
            logo_url,
            owner_id
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
        // Safe cast for the JSONB structure
        const showData = {
          ...data,
          cast_members: (data.cast_members as unknown) as CastMember[] | null
        } as unknown as ShowDetails;
        setShow(showData);
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

  useEffect(() => {
    const checkTicketStatus = async () => {
      if (!user || !show || !profile) return;

      const { data } = await supabase
        .from("tickets")
        .select("id")
        .eq("user_id", profile.id)
        .eq("show_id", show.id)
        .eq("status", "confirmed")
        .maybeSingle();

      if (data) {
        setIsTicketClaimed(true);
      }
    };

    checkTicketStatus();
  }, [user, show, profile]);

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
      year: date.getFullYear(),
      time: date.toLocaleTimeString("en-US", {
        hour: 'numeric',
        minute: '2-digit'
      })
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

  const getProductionStatus = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const showDate = new Date(dateString);
    const now = new Date();
    // Assuming show duration ~3 hours for "Now Showing" logic if date is strictly start time
    // But usually "Now Showing" means within a run range. Since we have one date, let's treat it as:
    // If date is today (same day), it's "Today" or "Now Showing".
    // If date > now, it's "Upcoming".
    // If date < now (and not today), it's "Past".

    const isSameDay = showDate.getDate() === now.getDate() &&
                      showDate.getMonth() === now.getMonth() &&
                      showDate.getFullYear() === now.getFullYear();

    if (isSameDay) return "Today";
    if (showDate > now) return "Upcoming";
    return "Past Production";
  };

  const isPast = show && show.date ? new Date(show.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

  let isReservationClosed = false;
  let deadlineDate = null;
  if (show && show.date && !isPast) {
      const showDateObj = new Date(show.date);
      deadlineDate = new Date(showDateObj);
      deadlineDate.setDate(deadlineDate.getDate() - 1);
      deadlineDate.setHours(23, 59, 59, 999);

      if (new Date() > deadlineDate) {
          isReservationClosed = true;
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-8 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center min-h-[50vh]">
              <BrandedLoader size="lg" text="Loading production details..." />
            </div>
          </div>
      </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-8 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="text-6xl mb-6">🎭</div>
              <h1 className="text-2xl font-serif text-foreground mb-4">
                {error || "Production Not Found"}
              </h1>
              <p className="text-muted-foreground mb-8">
                This production may have been removed or is still pending approval.
              </p>
              <Button variant="outline" size="icon" onClick={() => navigate("/")} aria-label="Home">
                <Home className="w-4 h-4" />
              </Button>
            </div>
          </div>
      </div>
        <Footer />
      </div>
    );
  }

  const dateInfo = formatDate(show.date);
  const status = getProductionStatus(show.date);

  const googleCalendarLink = (() => {
    if (!show || !show.date) return "";
    const title = encodeURIComponent(show.title);
    const details = encodeURIComponent(`${show.description || ""}\n\nLink: ${window.location.href}`);
    const location = encodeURIComponent(`${show.venue || ""}${show.city ? `, ${show.city}` : ""}`);

    const startDate = new Date(show.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default to 2 hours

    const formatToManila = (date: Date) => {
      const str = date.toLocaleString('sv-SE', { timeZone: 'Asia/Manila' });
      return str.replace(/\D/g, ''); // YYYYMMDDHHmmss
    };

    const formatGoogle = (s: string) => `${s.slice(0, 8)}T${s.slice(8)}`;

    const startStr = formatToManila(startDate);
    const endStr = formatToManila(endDate);
    const dates = `${formatGoogle(startStr)}/${formatGoogle(endStr)}`;

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=Asia/Manila`;
  })();

  const downloadICS = () => {
    if (!show || !show.date) return;

    const startDate = new Date(show.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default to 2 hours

    const startStr = startDate.toISOString().replace(/-|:|\.\d{3}/g, "");
    const endStr = endDate.toISOString().replace(/-|:|\.\d{3}/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${show.title}
DESCRIPTION:${show.description || ""} \\n\\nLink: ${window.location.href}
LOCATION:${show.venue || ""}${show.city ? `, ${show.city}` : ""}
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

  const handleBuyTicket = async () => {
    const groupId = show?.theater_group?.id || show?.producer_id?.id;
    if (groupId && show?.id) {
      trackEvent('ticket_click', groupId, show.id);
    }

    if (show?.price === 0) {
      if (!user || !profile) {
        toast.error("Please log in to get a ticket");
        navigate("/login");
        return;
      }

      setBuyingTicket(true);
      try {
        const { error } = await supabase
          .from("tickets")
          .insert({
            user_id: profile.id,
            show_id: show.id,
            status: "confirmed"
          });

        if (error) throw error;

        toast.success("Ticket Claimed!");
        setIsTicketClaimed(true);
      } catch (error) {
        console.error("Error claiming ticket:", error);
        toast.error("Failed to claim ticket");
      } finally {
        setBuyingTicket(false);
      }
      return;
    }

    // Navigate to checkout page for paid tickets
    navigate(`/checkout/${show.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/*
        ----------------------------------------------------------------------------------
        HERO SECTION
        ----------------------------------------------------------------------------------
      */}
      <div className="relative w-full overflow-hidden bg-background">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          {show.poster_url && (
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 brightness-50 scale-110"
              style={{ backgroundImage: `url(${show.poster_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-12 lg:py-20">
            {/* Back Button */}
            <div className="mb-8">
              <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="text-white/70 hover:text-white hover:bg-white/10 pl-0"
              >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column - Poster */}
                <div className="lg:col-span-4 flex justify-center lg:justify-end">
                    <div className="relative h-[300px] lg:h-[400px] w-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 group bg-black/20">
                        {show.poster_url ? (
                            <>
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
                                        <Ticket className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                )}
                                <img
                                  src={show.poster_url}
                                  alt={show.title}
                                  className={`h-full w-auto object-contain transition-transform duration-700 group-hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                  onLoad={() => setImageLoading(false)}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center aspect-[2/3]">
                                <Ticket className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-8 space-y-6 text-white">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="px-3 py-1 bg-primary/20 text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-full border border-primary/30">
                            {getNicheLabel(show.niche)}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${
                            status === "Upcoming" ? "bg-blue-500/20 text-blue-200 border-blue-500/30" :
                            status === "Today" ? "bg-green-500/20 text-green-200 border-green-500/30" :
                            "bg-gray-500/20 text-gray-300 border-gray-500/30"
                        }`}>
                            {status}
                        </span>
                         {user && (profile?.id === show.producer_id?.id || profile?.role === 'admin') && (
                             <Link to={`/dashboard?tab=shows&edit=${show.id}`}>
                               <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 h-7">
                                 <Pencil className="w-3 h-3" />
                                 <span className="hidden sm:inline">Edit</span>
                               </Button>
                             </Link>
                           )}
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight text-white drop-shadow-lg">
                        {show.title}
                    </h1>

                    {/* Producer Info */}
                    {(show.theater_group || show.producer_id) && (
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/20">
                                {(show.theater_group?.logo_url || show.producer_id?.group_logo_url || show.producer_id?.avatar_url) ? (
                                    <img
                                        src={show.theater_group?.logo_url || show.producer_id?.group_logo_url || show.producer_id?.avatar_url || ""}
                                        alt={show.theater_group?.name || show.producer_id?.group_name || show.producer_id?.username || "Producer Logo"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Users className="w-5 h-5 text-white/70" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-white/60 uppercase tracking-wider">Presented By</p>
                                <p className="font-medium text-lg">
                                    {show.theater_group?.name || show.producer_id?.group_name || show.producer_id?.username}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-white/10 text-white/80">
                         {dateInfo && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-semibold text-white">{dateInfo.full}</p>
                                    <p className="text-sm text-white/60">{dateInfo.time}</p>
                                </div>
                            </div>
                        )}
                        {(show.venue || show.city) && (
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-semibold text-white">{show.venue || "Venue TBA"}</p>
                                    <p className="text-sm text-white/60">{show.city}</p>
                                </div>
                            </div>
                        )}
                         {show.duration && (
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-primary" />
                                <span className="font-medium">{show.duration}</span>
                            </div>
                        )}
                        {show.genre && (
                            <div className="flex items-center gap-3">
                                <Ticket className="w-5 h-5 text-primary" />
                                <span className="font-medium">{show.genre}</span>
                            </div>
                        )}
                    </div>

                    {/* Transcript CTA */}
                    {show.seo_metadata?.transcript_url && (
                        <div className="py-2">
                            <a
                                href={show.seo_metadata.transcript_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                    const groupId = show?.theater_group?.id || show?.producer_id?.id;
                                    if (groupId && show?.id) {
                                      trackEvent('transcript_click', groupId, show.id);
                                    }
                                }}
                            >
                                <Button variant="secondary" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Read Transcript
                                </Button>
                            </a>
                        </div>
                    )}

                    {/* Price & Actions */}
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pt-2">
                        <div>
                             <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Tickets Starting At</p>
                             <p className="text-3xl font-serif font-bold text-white">
                                {show.price && show.price > 0 ? `₱${show.price}` : "Free"}
                             </p>
                             {deadlineDate && !isReservationClosed && !isPast && (show.price !== null && show.price !== undefined && show.price >= 0) && (
                                 <p className="text-xs text-yellow-400/90 mt-1 font-medium">
                                     Reserve by {deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                 </p>
                             )}
                        </div>

                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            {/* Primary Action */}
                            {isPast ? (
                                <Button size="lg" variant="secondary" disabled className="flex-1 sm:flex-none text-lg font-serif px-8">
                                    Event Ended
                                </Button>
                            ) : isReservationClosed && (show.price !== null && show.price !== undefined && show.price >= 0) ? (
                                <Button size="lg" variant="secondary" disabled className="flex-1 sm:flex-none text-lg font-serif px-8">
                                    Reservations Closed
                                </Button>
                            ) : (show.price !== null && show.price !== undefined && show.price >= 0) ? (
                                <Button
                                    size="lg"
                                    className={`flex-1 sm:flex-none text-lg font-serif px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 ${
                                        isTicketClaimed ? "bg-green-600 hover:bg-green-700 text-white" : ""
                                    }`}
                                    onClick={handleBuyTicket}
                                    disabled={buyingTicket || isTicketClaimed}
                                >
                                    {isTicketClaimed ? <Check className="w-5 h-5 mr-2" /> : <Ticket className="w-5 h-5 mr-2" />}
                                    {isTicketClaimed ? "Claimed" : (show.price === 0 ? "Get Free Ticket" : "Reserve Now")}
                                </Button>
                            ) : show.ticket_link ? (
                                <a
                                  href={show.ticket_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => {
                                    const groupId = show?.theater_group?.id || show?.producer_id?.id;
                                    if (groupId && show?.id) {
                                      trackEvent('ticket_click', groupId, show.id);
                                    }
                                  }}
                                >
                                    <Button size="lg" className="w-full text-lg font-serif px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                                        <ExternalLink className="w-5 h-5 mr-2" />
                                        Get Tickets
                                    </Button>
                                </a>
                            ) : (
                                <Button size="lg" variant="secondary" disabled className="flex-1 sm:flex-none">
                                    Unavailable
                                </Button>
                            )}

                            {/* Secondary Actions */}
                             <Button
                                variant="outline"
                                size="lg"
                                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => show && toggleFavorite(show.id)}
                            >
                                <Heart className={`w-5 h-5 ${show && isFavorited(show.id) ? "fill-red-500 text-red-500" : ""}`} />
                            </Button>

                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="lg" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied to clipboard");
                                    }}>
                                        Copy Link
                                    </DropdownMenuItem>
                                     <DropdownMenuItem asChild>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer">
                                            Share on Facebook
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(show.title)}`} target="_blank" rel="noopener noreferrer">
                                            Share on Twitter
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="lg" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
                                        <Calendar className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                                            Add to Google Calendar
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={downloadICS}>
                                        Download .ics
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/*
        ----------------------------------------------------------------------------------
        MAIN CONTENT
        ----------------------------------------------------------------------------------
      */}
      <div className="container mx-auto px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-12 gap-12">
               {/* Left Content Column (58%) */}
               <div className="lg:col-span-7 space-y-12">

                   {/* About */}
                   <section>
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-6">About the Show</h2>
                        <div className="prose prose-lg prose-invert max-w-none text-muted-foreground bg-card/50 p-6 rounded-xl border border-secondary/10">
                            <p className="leading-relaxed whitespace-pre-line">{show.description || "No description available."}</p>
                        </div>
                        {/* Tags */}
                        {show.tags && show.tags.length > 0 && (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {show.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-secondary/10 text-secondary text-sm rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                   </section>

                   {/* Cast */}
                   {show.cast_members && show.cast_members.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Cast & Creative</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {show.cast_members.map((member, index) => (
                                    <div key={index} className="p-4 bg-card border border-secondary/10 rounded-xl flex items-center gap-4 hover:border-secondary/30 transition-colors shadow-sm">
                                        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-serif font-bold text-lg shrink-0">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{member.name}</p>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                   {/* Reviews */}
                   <section className="pt-8 border-t border-secondary/10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif font-bold text-foreground">Audience Reviews</h2>
                        </div>
                        <ReviewForm
                          showId={show.id}
                          onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
                          isUpcoming={show.date ? new Date(show.date) > new Date() : false}
                        />
                        <div className="mt-8">
                            <ReviewList
                              showId={show.id}
                              refreshTrigger={refreshReviews}
                              isUpcoming={show.date ? new Date(show.date) > new Date() : false}
                              producerId={typeof show.producer_id === 'object' && show.producer_id ? show.producer_id.id : (typeof show.producer_id === 'string' ? show.producer_id : undefined)}
                            />
                        </div>
                   </section>
               </div>

               {/* Right Sidebar (42%) */}
               <div className="lg:col-span-5 space-y-8">
                    {/* Venue Map */}
                    {(show.venue || show.city) && (
                        <div className="bg-card border border-secondary/10 rounded-xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-secondary" />
                                Venue Location
                            </h3>
                            <p className="font-medium text-foreground mb-1">{show.venue || "Venue To Be Announced"}</p>
                            <p className="text-muted-foreground text-sm mb-4">{show.city}</p>

                            <div className="aspect-video bg-muted rounded-xl relative overflow-hidden group">
                                <div className="absolute inset-0">
                                    <img
                                    src="https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?q=80&w=1000&auto=format&fit=crop"
                                    alt="Theater Map Placeholder"
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity grayscale hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="shadow-lg hover:scale-105 transition-transform" asChild>
                                        <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((show.venue || "") + ", " + (show.city || ""))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Open Maps
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Producer Profile Card */}
                    {(show.theater_group || show.producer_id) && (
                        <div className="bg-card border border-secondary/10 rounded-xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary" />
                                About the Producer
                            </h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-secondary/20">
                                    {(show.theater_group?.logo_url || show.producer_id?.group_logo_url || show.producer_id?.avatar_url) ? (
                                        <img
                                            src={show.theater_group?.logo_url || show.producer_id?.group_logo_url || show.producer_id?.avatar_url || ""}
                                            alt={show.theater_group?.name || show.producer_id?.group_name || show.producer_id?.username || "Producer Logo"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        "🎭"
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-lg line-clamp-1">
                                        {show.theater_group?.name || show.producer_id?.group_name || show.producer_id?.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {getNicheLabel(show.producer_id?.niche)}
                                    </p>
                                </div>
                            </div>
                            {show.producer_id?.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
                                    "{show.producer_id.description}"
                                </p>
                            )}
                            <Link to={`/producer/${show.theater_group?.owner_id || show.producer_id?.id}`}>
                                <Button variant="outline" className="w-full group">
                                    View Full Profile
                                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Ad Banner */}
                    <AdBanner format="box" variant="placeholder" />
               </div>
          </div>
      </div>

      <Footer />
    </div>
  );
};

export default ShowDetailsPage;
