import { useRef } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, QrCode, Download, Image, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  status?: string; // e.g., "confirmed", "pending"
  ticketId: string;
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
  ticketPrice,
  reservationFee,
  paymentInstructions,
}: DigitalPassProps) => {
  const passRef = useRef<HTMLDivElement>(null);
  const paidAmount = reservationFee ?? 25;
  const balance = (ticketPrice && ticketPrice > 0) ? Math.max(0, ticketPrice - paidAmount) : 0;
  // Use a unique but consistent ID for the file name.
  // Using ticketId is good, but let's sanitize or shorten if needed.
  // Assuming ticketId is a UUID, it's fine.

  const handleDownloadImage = async () => {
    if (passRef.current) {
      try {
        const canvas = await html2canvas(passRef.current, {
            useCORS: true,
            scale: 2, // Higher resolution
            backgroundColor: null, // Transparent background if possible, though card has bg
        });
        const link = document.createElement("a");
        link.download = `pass-${title.substring(0, 20).replace(/\s+/g, '-')}-${ticketId.slice(0, 8)}.png`;
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
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');

        // Use pt units.
        // Create PDF with dimensions matching the canvas (scaled down to screen size or keep high res)
        // Actually, let's make the PDF size match the image size in points.
        const imgWidth = canvas.width / 2; // dividing by scale to get approximate original logic size
        const imgHeight = canvas.height / 2;

        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height] // Use full canvas resolution size for the PDF page
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`pass-${title.substring(0, 20).replace(/\s+/g, '-')}-${ticketId.slice(0, 8)}.pdf`);
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
    }
  };

  return (
    <div className="group relative w-full max-w-md mx-auto">
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

      <div ref={passRef} className="relative bg-card border border-secondary/30 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:border-secondary/50">

        {/* Ticket Header / Main Info */}
        <div className="flex flex-col sm:flex-row">
            {/* Poster Section (Left/Top) */}
            <div className="relative w-full sm:w-1/3 aspect-[3/4] sm:aspect-auto sm:h-auto overflow-hidden bg-muted">
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
            </div>

            {/* Content Section (Right/Bottom) */}
            <div className="flex-1 p-5 flex flex-col justify-between relative bg-card">
                {/* Perforated Edge (Visual separator for mobile, or decoration) */}
                <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-[1px] border-l-2 border-dashed border-secondary/30 -ml-[1px] z-10" />

                <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                        {status === 'confirmed' || status === 'paid' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Payment Pending
                          </span>
                        )}
                    </div>

                    <Link to={`/show/${id}`} className="block group-hover:text-secondary transition-colors">
                        <h3 className="font-serif text-xl font-bold text-foreground mb-1 line-clamp-2">
                            {title}
                        </h3>
                    </Link>

                    <p className="text-sm text-muted-foreground font-medium mb-3">
                        {groupName}
                    </p>

                    <div className="space-y-1.5 text-xs text-muted-foreground/80 mb-4">
                        {date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-secondary" />
                                <span>{new Date(date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                            </div>
                        )}
                        {(venue || city) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-secondary" />
                                <span className="line-clamp-1">{venue ? `${venue}, ${city}` : city}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Section */}
                <div className="mt-auto pt-4 border-t border-dashed border-secondary/20 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">DUE AT VENUE</p>
                            <p className="text-lg text-foreground font-bold leading-tight">
                                ₱{balance.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Present at venue to pay balance.
                            </p>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="bg-white p-1.5 rounded-md shrink-0 border border-secondary/20">
                            <QrCode className="w-12 h-12 text-black" />
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
        <div className="hidden sm:block absolute top-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />
        <div className="hidden sm:block absolute bottom-0 left-[33.33%] -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-background rounded-full border border-secondary/30 z-20" />

      </div>
    </div>
  );
};
