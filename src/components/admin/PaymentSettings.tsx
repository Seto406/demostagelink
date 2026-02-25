import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, QrCode } from "lucide-react";

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "payment_qr_code_url")
        .maybeSingle();

      if (error) throw error;
      if (data) setQrCodeUrl(data.value);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load payment settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `qr-code-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("system_assets")
        .upload(filePath, file, {
            upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("system_assets")
        .getPublicUrl(filePath);

      // 3. Update Settings Table
      const { error: dbError } = await supabase
        .from("system_settings")
        .upsert({
            key: "payment_qr_code_url",
            value: publicUrl,
            description: "URL of the GCash/Bank QR Code image"
        });

      if (dbError) throw dbError;

      setQrCodeUrl(publicUrl);
      toast.success("QR Code updated successfully!");
    } catch (error) {
      console.error("Error uploading QR code:", error);
      toast.error("Failed to upload QR code.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Payment QR Code
          </CardTitle>
          <CardDescription>
            Upload the QR code image (GCash, Maya, or Bank) that users will scan to pay.
            This image will be displayed on the checkout page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-secondary/20 rounded-xl bg-muted/50">
            {qrCodeUrl ? (
              <div className="relative group">
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="max-w-xs max-h-64 object-contain rounded-lg shadow-sm border border-border bg-white"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <p className="text-white font-medium text-sm">Upload new to replace</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No QR Code uploaded yet.</p>
              </div>
            )}

            <div className="mt-6 w-full max-w-sm">
                <label htmlFor="qr-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                {qrCodeUrl ? "Replace QR Code" : "Upload QR Code"}
                            </>
                        )}
                    </div>
                    <input
                        id="qr-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Supported formats: PNG, JPG, WEBP
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
