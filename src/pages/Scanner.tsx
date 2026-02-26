import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Camera, Keyboard, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    status: string;
    checked_in_at?: string;
    attendee: string;
    type?: string;
  };
  error?: string;
}

const Scanner = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camera");
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false); // Ref to track processing state inside callbacks

  // Update ref when state changes
  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  const handleScan = useCallback(async (code: string) => {
    if (processingRef.current) return;
    setProcessing(true);

    // Stop scanner temporarily
    if (scannerRef.current) {
        try {
            scannerRef.current.pause(true);
        } catch (e) {
            console.warn("Failed to pause scanner:", e);
        }
    }

    try {
      const { data, error } = await supabase.functions.invoke("scan-ticket", {
        body: {
            ticket_id: code.length > 10 ? code : undefined, // Assume long codes are UUIDs
            access_code: code.length <= 10 ? code : undefined,
            show_id: showId
        }
      });

      if (error) throw error;

      setLastResult(data);
      if (data.success) {
          toast.success("Check-in Successful!");

          // Notify the ticket holder
          if (data.ticket && data.ticket.user_id) {
             try {
                 await createNotification({
                     userId: data.ticket.user_id,
                     type: 'ticket_verified',
                     title: "Welcome to the Show!",
                     message: `Your ticket for "${data.ticket.show_title || 'the show'}" has been scanned. Enjoy!`,
                     link: `/profile?tab=passes`
                 });
             } catch (e) {
                 console.error("Failed to notify user:", e);
             }
          }

      } else {
          toast.error(data.message || "Check-in Failed");
      }

    } catch (err: unknown) {
        console.error("Scan error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to process ticket";
        setLastResult({
            success: false,
            message: errorMessage,
            error: errorMessage
        });
        toast.error("Error processing ticket");
    } finally {
        setProcessing(false);
    }
  }, [showId]);

  // Initialize Scanner
  useEffect(() => {
    let isMounted = true;

    // Only initialize if camera tab is active and we are not showing a result
    if (activeTab === "camera" && !lastResult) {
      const onScanSuccess = (decodedText: string) => {
        if (isMounted) {
          handleScan(decodedText);
        }
      };

      const onScanFailure = () => {
        // console.warn(`Code scan error = ${error}`);
      };

      // Small delay to ensure DOM is ready
      const timer = setTimeout(async () => {
        const readerElement = document.getElementById("reader");
        if (!readerElement || !isMounted) return;

        // Ensure previous scanner is cleared
        if (scannerRef.current) {
           try {
               await scannerRef.current.clear();
           } catch (e) {
               console.warn("Failed to clear previous scanner", e);
           }
           scannerRef.current = null;
        }

        try {
            const scanner = new Html5QrcodeScanner(
              "reader",
              { fps: 10, qrbox: { width: 250, height: 250 } },
              false
            );

            scannerRef.current = scanner;
            scanner.render(onScanSuccess, onScanFailure);
        } catch (e) {
            console.error("Failed to initialize scanner", e);
            toast.error("Failed to start camera. Please ensure permissions are granted.");
        }
      }, 500);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current) {
           scannerRef.current.clear().catch(console.warn);
           scannerRef.current = null;
        }
      };
    }
  }, [activeTab, lastResult, handleScan]);

  const resetScanner = () => {
      setLastResult(null);
      setManualCode("");
      if (scannerRef.current) {
          // Resume logic is tricky with Html5QrcodeScanner as it might have been cleared.
          // The useEffect will re-init automatically because lastResult becomes null.
      }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-md">
        <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/guests/${showId}`)}
            className="mb-6 hover:bg-secondary/10"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Guest List
        </Button>

        <Card className="border-secondary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b border-secondary/10">
                <CardTitle className="text-center">Ticket Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {lastResult ? (
                    <div className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 ${
                        lastResult.success ? "bg-green-500/10" : lastResult.message === "Ticket already used" ? "bg-yellow-500/10" : "bg-red-500/10"
                    }`}>
                        {lastResult.success ? (
                            <CheckCircle2 className="w-24 h-24 text-green-500 mb-4" />
                        ) : lastResult.message === "Ticket already used" ? (
                            <AlertTriangle className="w-24 h-24 text-yellow-500 mb-4" />
                        ) : (
                            <XCircle className="w-24 h-24 text-red-500 mb-4" />
                        )}

                        <h2 className="text-2xl font-bold mb-2">
                            {lastResult.success ? "Verified!" : "Attention"}
                        </h2>
                        <p className="text-lg mb-4 text-muted-foreground">{lastResult.message}</p>

                        {lastResult.ticket && (
                            <div className="bg-background/80 p-4 rounded-xl border border-secondary/20 w-full mb-6">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Attendee</p>
                                <p className="text-xl font-bold text-foreground mb-2">{lastResult.ticket.attendee}</p>
                                <p className="text-sm text-secondary">{lastResult.ticket.type || "General Admission"}</p>
                                {lastResult.ticket.checked_in_at && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Checked in at: {new Date(lastResult.ticket.checked_in_at).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        )}

                        <Button onClick={resetScanner} size="lg" className="w-full">
                            Scan Next
                        </Button>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full rounded-none h-14 bg-muted/30">
                            <TabsTrigger value="camera" className="h-full rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary">
                                <Camera className="w-4 h-4 mr-2" />
                                Camera
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="h-full rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary">
                                <Keyboard className="w-4 h-4 mr-2" />
                                Manual Entry
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="camera" className="p-6 min-h-[400px] flex flex-col items-center justify-center bg-black/5">
                            <div id="reader" className="w-full max-w-[300px] overflow-hidden rounded-xl border-2 border-dashed border-secondary/30"></div>
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                Point camera at QR code on the ticket.
                            </p>
                        </TabsContent>

                        <TabsContent value="manual" className="p-8 min-h-[400px] flex flex-col items-center justify-center">
                            <div className="w-full max-w-xs space-y-4">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-medium mb-2">Enter Access Code</h3>
                                    <p className="text-sm text-muted-foreground">Type the 6-character code found on the ticket.</p>
                                </div>
                                <Input
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    placeholder="ABC-123"
                                    className="text-center text-2xl tracking-widest uppercase h-14 font-mono"
                                    maxLength={8}
                                />
                                <Button
                                    onClick={() => handleScan(manualCode)}
                                    disabled={!manualCode || processing}
                                    className="w-full h-12 text-lg"
                                >
                                    {processing ? "Checking..." : "Verify Ticket"}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
};

export default Scanner;
