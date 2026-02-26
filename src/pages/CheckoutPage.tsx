import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, CreditCard, Lock, Ticket, Upload, Loader2, QrCode, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateReservationFee } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { ShowDetails, dummyShows, CastMember } from "@/data/dummyShows";
import Footer from "@/components/layout/Footer";

const CheckoutPage = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Manual Payment State
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Cleanup preview URL on unmount or change
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview);
      }
    };
  }, [paymentProofPreview]);

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
      setShow(showData as unknown as ShowDetails);
      setLoading(false);
    };

    const fetchQr = async () => {
        const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'payment_qr_code_url')
            .maybeSingle();
        if (data) setQrCodeUrl(data.value);
    };

    fetchShow();
    fetchQr();
  }, [showId, navigate]);

  /*
  // PayMongo Payment Handler (Hidden for now)
  const handlePayment = async () => {
    if (!show || !show.price) return;

    setProcessing(true);
    try {
      const reservationFee = show.reservation_fee ?? (show.price ? calculateReservationFee(show.price, show.producer_id?.niche ?? null) : 25);

      const { data, error } = await supabase.functions.invoke("create-paymongo-session", {
        body: {
          show_id: show.id,
          user_id: user?.id,
          price: reservationFee,
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
  */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPaymentProofPreview(objectUrl);
    } else {
      setPaymentProofPreview(null);
    }
  };

  const handleClearProof = () => {
    setProofFile(null);
    setPaymentProofPreview(null);
  };

  const handleManualSubmit = async () => {
    if (!show || !show.price) return;

    if (!proofFile) {
        toast.error("Please upload a proof of payment (screenshot).");
        return;
    }

    if (!user && (!guestName || !guestEmail)) {
        toast.error("Please provide your name and email.");
        return;
    }

    setProcessing(true);
    setUploading(true);

    try {
        // 1. Upload Proof
        const fileExt = proofFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('payment_proofs').upload(fileName, proofFile);

        if (uploadError) throw uploadError;

        // 2. Generate Signed URL for Edge Function / Email (Valid for 7 days)
        const { data: signedData, error: signError } = await supabase.storage.from('payment_proofs').createSignedUrl(fileName, 60 * 60 * 24 * 7);

        if (signError) throw signError;
        const proofUrl = signedData.signedUrl;

        // 3. Call Create Payment Function
        const reservationFee = show.reservation_fee ?? (show.price ? calculateReservationFee(show.price, show.producer_id?.niche ?? null) : 25);

        const { error: funcError } = await supabase.functions.invoke("create-manual-payment", {
            body: {
                show_id: show.id,
                user_id: user?.id,
                price: reservationFee,
                proof_url: proofUrl,
                guest_email: user?.email || guestEmail,
                guest_name: guestName
            }
        });

        if (funcError) throw funcError;

        toast.success("Payment submitted for review!");

        if (user) {
            await createNotification({
                userId: user.id,
                type: "payment_submitted",
                title: "Payment Submitted",
                message: `We've received your payment proof for ${show.title}. Verification usually takes 24h.`,
                link: "/profile?tab=passes"
            });
        }

        navigate("/payment/success?manual=true");

    } catch (error) {
        console.error("Manual Payment Error:", error);
        toast.error("Failed to submit payment. Please try again.");
    } finally {
        setProcessing(false);
        setUploading(false);
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
                        Your transaction is secured. Manual review ensures payment verification.
                    </p>
                </div>
            </div>

            {/* Payment Details */}
            <div>
                <Card className="border-secondary/20 bg-card h-full">
                    <CardHeader>
                        <CardTitle className="font-serif">Payment Details</CardTitle>
                        <CardDescription>Scan QR Code & Upload Proof</CardDescription>
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

                        {/* Manual Payment UI */}
                        <div className="space-y-6 pt-4 border-t border-border">
                            {/* QR Code Display */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-secondary/20">
                                {qrCodeUrl ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="relative group cursor-zoom-in" type="button">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="Payment QR Code"
                                                    className="max-w-[200px] h-auto object-contain transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity rounded-lg">
                                                    <ZoomIn className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                            <DialogTitle className="sr-only">Payment QR Code</DialogTitle>
                                            <div className="relative flex items-center justify-center w-full h-full bg-white p-4 rounded-lg">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="Payment QR Code Expanded"
                                                    className="w-full h-auto max-h-[80vh] object-contain"
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground py-8">
                                        <QrCode className="w-12 h-12 mb-2 opacity-50" />
                                        <p className="text-xs">No QR Code Available</p>
                                    </div>
                                )}
                                <p className="text-xs text-center text-muted-foreground mt-2 flex items-center gap-1">
                                    <ZoomIn className="w-3 h-3" /> Click QR code to enlarge
                                </p>
                                <p className="text-xs text-center text-muted-foreground mt-1">
                                    Scan to pay {formatCurrency(reservationFee)}
                                </p>
                            </div>

                            {/* Guest Form */}
                            {!user && (
                                <div className="space-y-4">
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="guestName">Full Name</Label>
                                        <Input
                                            id="guestName"
                                            placeholder="Enter your name"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid w-full gap-1.5">
                                        <Label htmlFor="guestEmail">Email Address</Label>
                                        <Input
                                            id="guestEmail"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* File Upload */}
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="proof">Proof of Payment (Screenshot)</Label>
                                <div className="space-y-4">
                                    {!paymentProofPreview ? (
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 group w-full max-w-sm">
                                            <img
                                                src={paymentProofPreview}
                                                alt="Payment Proof Preview"
                                                className="w-full h-48 object-contain bg-black/5"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                                onClick={handleClearProof}
                                                type="button"
                                            >
                                                <X className="w-4 h-4" />
                                                <span className="sr-only">Remove file</span>
                                            </Button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate">
                                                {proofFile?.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Upload a screenshot of your successful transfer.</p>
                            </div>
                        </div>

                         <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-600 dark:text-yellow-400">
                            <strong>Note:</strong> You are paying a <u>{formatCurrency(reservationFee)}</u> reservation fee now. Your ticket will be issued after admin verification (usually within 24h).
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full text-lg h-12"
                            size="lg"
                            onClick={handleManualSubmit}
                            disabled={processing || !proofFile || (!user && (!guestName || !guestEmail))}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {uploading ? "Uploading Proof..." : "Submitting..."}
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Submit Payment Proof
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
