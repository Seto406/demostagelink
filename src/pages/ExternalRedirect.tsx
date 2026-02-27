import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/AdBanner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const ExternalRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTargetUrl = searchParams.get("url");
  const [countdown, setCountdown] = useState(5);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [safeTargetUrl, setSafeTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rawTargetUrl) {
      setIsValidUrl(false);
      return;
    }

    try {
      const url = new URL(rawTargetUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        setSafeTargetUrl(rawTargetUrl);
        setIsValidUrl(true);
      } else {
        setIsValidUrl(false);
      }
    } catch {
      setIsValidUrl(false);
    }
  }, [rawTargetUrl]);

  useEffect(() => {
    if (!isValidUrl || !safeTargetUrl) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = safeTargetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isValidUrl, safeTargetUrl]);

  if (!rawTargetUrl || !isValidUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24">
          <h1 className="text-2xl font-bold mb-4">Invalid Redirect</h1>
          <p className="text-muted-foreground mb-6">The destination URL is invalid or unsafe.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-24 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-3xl font-serif font-bold">Leaving StageLink</h1>
            <p className="text-muted-foreground">
              You are being redirected to an external website.
            </p>
            <div className="p-4 bg-muted/30 rounded-lg border border-secondary/20 break-all text-sm font-mono text-secondary">
              {safeTargetUrl}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
             <div className="text-4xl font-bold text-primary tabular-nums">
               {countdown}
             </div>
             <p className="text-xs text-muted-foreground">seconds remaining</p>
          </div>

          {/* Advertisement Space */}
          <div className="w-full max-w-md mx-auto">
            <AdBanner format="box" variant="placeholder" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (safeTargetUrl) window.location.href = safeTargetUrl;
              }}
              className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Continue Immediately
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ExternalRedirect;
