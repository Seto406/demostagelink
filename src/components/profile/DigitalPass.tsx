import { useRef } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Download, Image, FileText, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DigitalPassProps {
  id: string; // show id
  title: string;
  groupName: string;
  posterUrl?: string | null;
  date?: string | null;
  venue?: string | null;
  city?: string | null;
  status?: string; // e.g., "confirmed", "pending", "used"
  ticketId: string;
  accessCode?: string | null;
  ticketPrice?: number | null;
  reservationFee?: number | null;
  paymentInstructions?: string | null;
}

export const DigitalPass = ({
  id,
  title,
  groupName,
  posterUrl,
  date,
  venue,
  city,
  status,
  ticketId,
  accessCode,
  ticketPrice,
  reservationFee,
  paymentInstructions,
}: DigitalPassProps) => {
  const passRef = useRef<HTMLDivElement>(null);
  const paidAmount = reservationFee ?? 25;
  const balance = (ticketPrice && ticketPrice > 0) ? Math.max(0, ticketPrice - paidAmount) : 0;

  const isUsed = status === 'used';

  const handleDownloadImage = async () => {
    if (passRef.current) {
      try {
        const canvas = await html2canvas(passRef.current, {
            useCORS: true,
            scale: 2, // Higher resolution
            backgroundColor: null,
            scrollX: 0,
            scrollY: 0,
        });
        const link = document.createElement("a");
        link.download = `pass-${title.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${ticketId.slice(0, 8)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (passRef.current) {
      try {
        const canvas = await html2canvas(passRef.current, {
            useCORS: true,
            scale: 2,
            scrollX: 0,
            scrollY: 0,
        });
        const imgData = canvas.toDataURL('image/png');

        // Use pt units.
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`pass-${title.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${ticketId.slice(0, 8)}.pdf`);
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
    }
  };

  return (
    <div className="group relative mx-auto w-full max-w-2xl">
      {/* Download Button */}
      <div className="absolute top-2 right-2 z-30 print:hidden">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm border border-secondary/20 hover:bg-background/80 shadow-sm">
                    <Download className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadImage} className="cursor-pointer">
                    <Image className="mr-2 h-4 w-4" />
                    <span>Download Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Download PDF</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>

      <div ref={passRef} className={`relative bg-card border rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${isUsed ? 'border-muted grayscale-[0.5] opacity-80' : 'border-secondary/30 hover:border-secondary/50'}`}>

        {/* Ticket Header / Main Info */}
        <div className="flex flex-col md:flex-row">
            {/* Poster Section (Left/Top) */}
            <div className="relative h-48 w-full overflow-hidden bg-muted md:h-auto md:w-1/3">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        crossOrigin="anonymous" // Try to request CORS
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎭</span>
                    </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-black/10" />

                {isUsed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <div className="bg-background/90 text-foreground px-4 py-2 rounded-full border border-secondary/50 font-bold uppercase tracking-wider text-sm flex items-center gap-2 shadow-xl transform -rotate-12">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Used
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section (Right/Bottom) */}
            <div className="flex-1 p-5 flex flex-col justify-between relative bg-card min-w-0">
                {/* Perforated Edge (Visual separator for mobile, or decoration) */}
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] border-l-2 border-dashed border-secondary/30 -ml-[1px] z-10" />

                <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                        {status === 'confirmed' || status === 'paid' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                            Confirmed
                          </span>
                        ) : status === 'used' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-muted-foreground/20">
                            Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Payment Pending
                          </span>
                        )}
                    </div>

                    <Link to={`/show/${id}`} className="block group-hover:text-secondary transition-colors">
                        <h3 className="font-serif text-xl font-bold text-foreground mb-1 line-clamp-2 break-words leading-tight">
                            {title}
                        </h3>
                    </Link>

                    <p className="text-sm text-muted-foreground font-medium mb-3 break-words">
                        {groupName}
                    </p>

                    <div className="space-y-2 text-xs text-muted-foreground/80 mb-4">
                        {date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                                <span className="truncate">{new Date(date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                            </div>
                        )}
                        {date && (
                            <div className="text-[11px] text-muted-foreground">Reservation valid until showtime.</div>
                        )}
                        {(venue || city) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                                <span className="break-words leading-relaxed">{venue ? `${venue}, ${city}` : city}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Section */}
                <div className="mt-auto pt-4 border-t border-dashed border-secondary/20 flex flex-col gap-4 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                             <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">DUE AT VENUE</p>
                             <p className="text-2xl text-foreground font-bold leading-tight">
                                 ₱{balance.toFixed(2)}
                             </p>
                             <p className="text-[10px] text-muted-foreground mt-1">
                                 Present at venue.
                             </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                             <div className="bg-white p-2 rounded-md shrink-0 border border-secondary/20 shadow-sm">
                                 <div style={{ height: "auto", margin: "0 auto", maxWidth: 90, width: "100%" }}>
                                    <QRCode
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        value={ticketId}
                                        viewBox={`0 0 256 256`}
                                    />
                                 </div>
                             </div>
                             {accessCode && (
                                <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-secondary/10">
                                    {accessCode}
                                </span>
                             )}
                        </div>
                    </div>
                    {paymentInstructions && (
                        <div className="text-xs bg-muted/50 p-2 rounded border border-secondary/20">
                            <span className="font-semibold text-secondary block mb-1">Payment Instructions:</span>
                            <span className="text-muted-foreground whitespace-pre-wrap">{paymentInstructions}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Decorative Notches (for perforated look) */}
        <div className="hidden md:block absolute top-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />
        <div className="hidden md:block absolute bottom-0 left-[33.33%] -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />

      </div>
    </div>
  );
};
