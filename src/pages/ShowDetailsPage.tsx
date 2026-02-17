import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Ticket, Users, Clock, ExternalLink, Share2, Download, Heart, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/layout/Navbar";
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
import { PaymentSummaryModal } from "@/components/payment/PaymentSummaryModal";
import { calculateReservationFee } from "@/lib/pricing";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
        // Safe cast for the JSONB structure
        const showData = {
          ...data,
          cast_members: (data.cast_members as unknown) as CastMember[] | null
        };
        setShow(showData as ShowDetails);
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

  const handleBuyTicket = () => {
    setShowPaymentModal(true);
  };

  const proceedToPayment = async () => {
    if (!show || !show.price) return;
    setBuyingTicket(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paymongo-session", {
        body: {
          amount: show.price * 100, // centavos
          description: `Ticket for ${show.title}`,
          metadata: {
             type: "ticket",
             show_id: show.id
          },
          redirect_url: window.location.origin + "/payment/success",
        },
      });

      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to initiate purchase. Please try again.");
      setBuyingTicket(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">

            {/* Back Button */}
            <div className="mb-8">
              <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-foreground pl-0"
              >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
              </Button>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Left Column - Main Content (65% approx) */}
                <div className="lg:col-span-8 space-y-10">

                   {/* Large Poster */}
                   <div
                        className="w-full relative rounded-2xl overflow-hidden shadow-2xl border border-secondary/20 bg-card aspect-[2/3]"
                   >
                        {show.poster_url ? (
                            <div className="relative w-full h-full flex justify-center bg-black/40 backdrop-blur-sm">
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
                                        <Ticket className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                )}
                                <img
                                  src={show.poster_url}
                                  alt={show.title}
                                  className={`w-full h-full object-contain transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                  onLoad={() => setImageLoading(false)}
                                />
                                {/* Blurred background filler if needed, but handled by parent bg */}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Ticket className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}
                   </div>

                   {/* Title & Metadata */}
                   <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                           <span className="text-secondary uppercase tracking-[0.2em] text-sm font-medium">
                             {getNicheLabel(show.niche)}
                           </span>
                           {user && (user.id === show.producer_id?.id || profile?.role === 'admin') && (
                             <Link to={`/dashboard?tab=shows&edit=${show.id}`}>
                               <Button variant="outline" size="sm" className="gap-2 border-secondary/30 hover:border-secondary hover:text-secondary">
                                 <Pencil className="w-4 h-4" />
                                 <span className="hidden sm:inline">Edit Production</span>
                               </Button>
                             </Link>
                           )}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">
                          {show.title}
                        </h1>
                         {/* Quick Stats Row */}
                        <div className="flex flex-wrap gap-4 md:gap-8 text-muted-foreground text-sm md:text-base">
                            {show.producer_id && (show.producer_id.group_name || show.producer_id.username) && (
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-secondary" />
                                    <span>{show.producer_id.group_name || show.producer_id.username}</span>
                                </div>
                            )}
                            {show.duration && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-secondary" />
                                    <span>{show.duration}</span>
                                </div>
                            )}
                            {show.genre && (
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-secondary" />
                                    <span>{show.genre}</span>
                                </div>
                            )}
                        </div>
                   </div>

                   {/* About */}
                   <section className="bg-card/50 rounded-2xl p-6 border border-secondary/10">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-6">About the Show</h2>
                        <div className="prose prose-lg prose-invert max-w-none text-muted-foreground">
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {show.cast_members.map((member, index) => (
                                    <div key={index} className="p-4 bg-card border border-secondary/10 rounded-xl flex items-center gap-3 hover:border-secondary/30 transition-colors">
                                        <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-serif font-bold">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{member.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                   {/* Reviews */}
                   <section className="pt-8 border-t border-secondary/10">
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-8">Audience Reviews</h2>
                        <ReviewForm
                          showId={show.id}
                          onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
                        />
                        <div className="mt-8">
                            <ReviewList
                              showId={show.id}
                              refreshTrigger={refreshReviews}
                            />
                        </div>
                   </section>

                </div>

                {/* Right Column - Sidebar (35% approx) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-24 space-y-6">

                        {/* Reserve / Ticket Card */}
                        <div className="bg-card border border-secondary/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                            {/* Texture/Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Tickets Starting At</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-serif font-bold text-secondary">
                                            {show.price && show.price > 0 ? `₱${show.price}` : "Free"}
                                        </span>
                                        {show.price && show.price > 0 && <span className="text-muted-foreground text-sm">/ person</span>}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {show.price && show.price > 0 ? (
                                        <Button
                                            size="xl"
                                            className="w-full text-lg font-serif shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                                            onClick={handleBuyTicket}
                                            disabled={buyingTicket}
                                        >
                                            <Ticket className="w-5 h-5 mr-2" />
                                            Reserve Now
                                        </Button>
                                    ) : show.ticket_link ? (
                                        <a href={show.ticket_link} target="_blank" rel="noopener noreferrer" className="block w-full">
                                            <Button size="xl" className="w-full text-lg font-serif shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                                                <ExternalLink className="w-5 h-5 mr-2" />
                                                Get Tickets
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button size="xl" variant="secondary" className="w-full" disabled>
                                            Tickets Unavailable
                                        </Button>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => show && toggleFavorite(show.id)}
                                        >
                                            <Heart className={`w-4 h-4 mr-2 ${show && isFavorited(show.id) ? "fill-current text-red-500" : ""}`} />
                                            {show && isFavorited(show.id) ? "Saved" : "Save"}
                                        </Button>

                                        <CopyButton
                                            variant="outline"
                                            className="flex-1"
                                            value={window.location.href}
                                        >
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Share
                                        </CopyButton>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="flex-1">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Save Date
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                                                        Google Calendar
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={downloadICS}>
                                                    Outlook / iCal (.ics)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Venue Info */}
                        {(show.venue || show.city) && (
                            <div className="bg-card border border-secondary/10 rounded-2xl p-6">
                                <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-secondary" />
                                    Venue Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-medium text-foreground text-lg">{show.venue || "Venue To Be Announced"}</p>
                                        {show.city && <p className="text-muted-foreground text-sm mt-1">{show.city}</p>}
                                    </div>

                                    {/* Date & Time */}
                                    {dateInfo && (
                                        <div className="pt-4 border-t border-secondary/10">
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                                                <div>
                                                    <p className="text-foreground font-medium">{dateInfo.full}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Map Placeholder */}
                                    <div className="aspect-video bg-muted rounded-xl relative overflow-hidden mt-2 group">
                                        <div className="absolute inset-0">
                                          <img
                                            src="https://images.unsplash.com/photo-1515634928627-2a4e0dae3ddf?q=80&w=1000&auto=format&fit=crop"
                                            alt="Theater Map Placeholder"
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity grayscale hover:grayscale-0"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Button variant="secondary" className="shadow-lg hover:scale-105 transition-transform" asChild>
                                              <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((show.venue || "") + ", " + (show.city || ""))}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <MapPin className="w-4 h-4 mr-2" />
                                                View on Google Maps
                                              </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Producer Info */}
                        {show.producer_id && (
                            <div className="bg-card border border-secondary/10 rounded-2xl p-6">
                                <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-secondary" />
                                    Produced By
                                </h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-xl shrink-0">
                                        🎭
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground line-clamp-1">
                                            {show.producer_id.group_name || show.producer_id.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                            {getNicheLabel(show.producer_id.niche)}
                                        </p>
                                    </div>
                                </div>
                                <Link to={`/producer/${show.producer_id.id}`}>
                                    <Button variant="outline" className="w-full group">
                                        View Profile
                                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Ad Banner for Non-Producers */}
                        {(!profile || profile.role !== "producer") && (
                             <AdBanner format="square" variant="placeholder" />
                        )}

                    </div>
                </div>

            </div>

        </div>
      </main>
      <Footer />

      {show && (
        <PaymentSummaryModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={proceedToPayment}
          show={{
            title: show.title,
            price: show.price || 0,
            date: show.date,
            venue: show.venue || (show.city ? `${show.city}` : null)
          }}
          isProcessing={buyingTicket}
          reservationFee={show.reservation_fee ?? (show.price ? calculateReservationFee(show.price, show.producer_id?.niche ?? null) : 25)}
        />
      )}
    </div>
  );
};

export default ShowDetailsPage;
