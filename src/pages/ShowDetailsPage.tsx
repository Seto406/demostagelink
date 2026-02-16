import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Ticket, Users, Clock, ExternalLink, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { useAuth } from "@/contexts/AuthContext";
import { AdBanner } from "@/components/ads/AdBanner";
import { dummyShows, ShowDetails, CastMember } from "@/data/dummyShows";
import { PaymentSummaryModal } from "@/components/payment/PaymentSummaryModal";
import { useFavorites } from "@/hooks/use-favorites";

const ShowDetailsPage = () => {
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toggleFavorite, isFavorited } = useFavorites();

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) return;
      const dummyShow = dummyShows.find(s => s.id === id);
      if (dummyShow) { setShow(dummyShow); setLoading(false); return; }
      const { data } = await supabase.from("shows").select(`*, profiles:producer_id (*)`).eq("id", id).eq("status", "approved").maybeSingle();
      if (data) setShow({ ...data, cast_members: data.cast_members as unknown as CastMember[] } as ShowDetails);
      setLoading(false);
    };
    fetchShow();
  }, [id]);

  const googleCalendarLink = (() => {
    if (!show || !show.date) return "";
    const start = new Date(show.date).toISOString().replace(/-|:|\.\d{3}/g, "");
    const end = new Date(new Date(show.date).getTime() + 7200000).toISOString().replace(/-|:|\.\d{3}/g, "");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(show.title)}&dates=${start}/${end}&location=${encodeURIComponent(show.venue || "")}`;
  })();

  const downloadICS = () => { /* ICS Logic here */ };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><main className="pt-24 flex items-center justify-center min-h-[50vh]"><BrandedLoader size="lg" /></main></div>;
  if (!show) return <div className="min-h-screen bg-background"><Navbar /><main className="pt-24 text-center"><h1>Production Not Found</h1><Button onClick={() => navigate("/")} className="mt-4">Back Home</Button></main></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 pl-0"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-10">
              <div className="rounded-2xl overflow-hidden border border-secondary/20 shadow-2xl bg-card">
                {show.poster_url && <img src={show.poster_url} alt={show.title} className="w-full max-h-[70vh] object-contain mx-auto" />}
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-serif font-bold">{show.title}</h1>
                <div className="flex gap-4 text-muted-foreground"><Users className="w-4 h-4 text-secondary" />{show.profiles?.group_name}</div>
              </div>
              <section className="bg-card/50 p-6 rounded-2xl border border-secondary/10">
                <h2 className="text-2xl font-serif font-bold mb-4">About the Show</h2>
                <p className="whitespace-pre-line text-muted-foreground">{show.description}</p>
              </section>
              <section className="pt-8 border-t border-secondary/10">
                <h2 className="text-2xl font-serif font-bold mb-8">Audience Reviews</h2>
                <ReviewForm showId={show.id} />
                <ReviewList showId={show.id} />
              </section>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 bg-card border border-secondary/20 rounded-2xl p-6 shadow-xl space-y-6">
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Reserve for</p><span className="text-4xl font-serif font-bold text-secondary">₱{show.price || 25}</span></div>
                <Button size="xl" className="w-full" onClick={() => setShowPaymentModal(true)} disabled={buyingTicket}><Ticket className="w-5 h-5 mr-2" />Reserve Now</Button>
                <div className="flex gap-2">
                  <CopyButton variant="outline" className="flex-1" value={window.location.href}><Share2 className="w-4 h-4 mr-2" />Share</CopyButton>
                  <Button variant={isFavorited(show.id) ? "secondary" : "outline"} className="flex-1" onClick={() => toggleFavorite(show.id)}><Heart className={`w-4 h-4 mr-2 ${isFavorited(show.id) ? "fill-primary text-primary" : ""}`} />{isFavorited(show.id) ? "Saved" : "Favorite"}</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" className="flex-1"><Calendar className="w-4 h-4 mr-2" />Save Date</Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem asChild><a href={googleCalendarLink} target="_blank">Google Calendar</a></DropdownMenuItem><DropdownMenuItem onClick={downloadICS}>Outlook / iCal</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="bg-card border border-secondary/10 rounded-2xl p-6">
                <h3 className="font-serif font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-secondary" />Venue</h3>
                <p className="font-medium">{show.venue || "TBA"}</p>
                <Button variant="secondary" className="w-full mt-4" asChild><a href={`https://www.google.com/maps/search/${encodeURIComponent(show.venue || "")}`} target="_blank">View on Maps</a></Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {showPaymentModal && <PaymentSummaryModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onConfirm={() => {}} show={{ title: show.title, price: show.price || 0, date: show.date, venue: show.venue || null }} isProcessing={buyingTicket} />}
    </div>
  );
};
export default ShowDetailsPage;