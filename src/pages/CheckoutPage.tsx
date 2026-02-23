import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, CreditCard, Lock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateReservationFee } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ShowDetails, dummyShows, CastMember } from "@/data/dummyShows";
import Footer from "@/components/layout/Footer";

const CheckoutPage = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchShow = async () => {
      if (!showId) {
        navigate("/shows");
        return;
      }

       // Check for dummy show first
      const dummyShow = dummyShows.find(s => s.id === showId);
      if (dummyShow) {
        setShow(dummyShow);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
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
          ),
          theater_group:theater_groups!theater_group_id (
            id,
            name,
            logo_url,
            owner_id
          )
        `)
        .eq("id", showId)
        .single();

      if (error || !data) {
        console.error("Error fetching show:", error);
        toast.error("Could not load show details");
        navigate("/shows");
        return;
      }

      // Safe cast for the JSONB structure
      const showData = {
          ...data,
          cast_members: (data.cast_members as unknown) as CastMember[] | null
      };
      setShow(showData as ShowDetails);
      setLoading(false);
    };

    fetchShow();
  }, [showId, navigate]);

  const handlePayment = async () => {
    if (!show || !show.price) return;

    setProcessing(true);
    try {
      const reservationFee = show.reservation_fee ?? (show.price ? calculateReservationFee(show.price, show.producer_id?.niche ?? null) : 25);

      const { data, error } = await supabase.functions.invoke("create-paymongo-session", {
        body: {
          show_id: show.id,
          user_id: user?.id,
          amount: Math.round(reservationFee * 100), // centavos
          description: `Ticket for ${show.title}`,
          metadata: {
             type: "ticket",
             show_id: show.id,
             user_id: user?.id
          },
          redirect_url: window.location.origin + "/payment/success",
          cancel_url: window.location.origin + "/payment/cancel",
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
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
           <Skeleton className="h-10 w-1/3 mb-8" />
           <div className="grid md:grid-cols-2 gap-8">
             <Skeleton className="h-[400px] w-full rounded-xl" />
             <Skeleton className="h-[400px] w-full rounded-xl" />
           </div>
        </div>
      </div>
    );
  }

  if (!show) return null;

  const reservationFee = show.reservation_fee ?? (show.price ? calculateReservationFee(show.price, show.producer_id?.niche ?? null) : 25);
  const remainingBalance = Math.max(0, (show.price || 0) - reservationFee);

  const formattedDate = show.date
    ? new Date(show.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      })
    : "Date TBA";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Show
        </Button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Order Summary */}
            <div className="space-y-6">
                <Card className="border-secondary/20 bg-card overflow-hidden">
                    <div className="aspect-video w-full bg-muted relative">
                        {show.poster_url ? (
                            <img
                                src={show.poster_url}
                                alt={show.title}
                                className="w-full h-full object-cover opacity-80"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Ticket className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                         <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-2xl font-serif font-bold text-white mb-1">{show.title}</h2>
                            <p className="text-white/80 text-sm">
                                {show.theater_group?.name || show.producer_id?.group_name || show.producer_id?.username}
                            </p>
                         </div>
                    </div>
                    <CardContent className="pt-6 space-y-4">
                         <div className="flex items-start gap-3 text-muted-foreground">
                            <Calendar className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                            <span>{formattedDate}</span>
                        </div>
                        {(show.venue || show.city) && (
                            <div className="flex items-start gap-3 text-muted-foreground">
                                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                <span>{show.venue}{show.city ? `, ${show.city}` : ""}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-4 text-sm text-muted-foreground">
                    <p className="flex gap-2">
                        <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        Your transaction is secured. We use PayMongo for secure payment processing.
                    </p>
                </div>
            </div>

            {/* Payment Details */}
            <div>
                <Card className="border-secondary/20 bg-card h-full">
                    <CardHeader>
                        <CardTitle className="font-serif">Payment Details</CardTitle>
                        <CardDescription>Review cost breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Seat Reservation Fee</span>
                                <span className="font-bold">{formatCurrency(reservationFee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Remaining Balance (Pay at Door)</span>
                                <span className="font-bold">{formatCurrency(remainingBalance)}</span>
                            </div>
                             <div className="h-px bg-border my-2" />
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold">Total Price</span>
                                <span className="font-bold text-secondary">{formatCurrency(show.price || 0)}</span>
                            </div>
                        </div>

                         <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-600 dark:text-yellow-400">
                            <strong>Note:</strong> You are paying a <u>{formatCurrency(reservationFee)}</u> reservation fee now to secure your seat. The remaining balance of {formatCurrency(remainingBalance)} will be collected at the venue.
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full text-lg h-12"
                            size="lg"
                            onClick={handlePayment}
                            disabled={processing}
                        >
                            {processing ? (
                                "Processing..."
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Pay {formatCurrency(reservationFee)} Now
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
