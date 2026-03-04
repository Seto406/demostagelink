import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Image, X, Loader2, Video } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface CreateUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MAX_MEDIA_ITEMS = 4;

const isVideoFile = (file: File) => file.type.startsWith("video/");

export function CreateUpdateModal({ open, onOpenChange, onSuccess }: CreateUpdateModalProps) {
  const { user, profile } = useAuth();
  const { isPro } = useSubscription();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const postMediaBuckets = ["post-media", "social_updates"] as const;
  const maxFileSizeBytes = isPro ? 30 * 1024 * 1024 : 10 * 1024 * 1024;

  useEffect(() => {
    return () => {
      previews.forEach((previewUrl) => {
        if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      });
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const availableSlots = MAX_MEDIA_ITEMS - files.length;

      if (availableSlots <= 0) {
        toast({
          title: "Media limit reached",
          description: `You can attach up to ${MAX_MEDIA_ITEMS} media files per update.`,
          variant: "destructive",
        });
        return;
      }

      const filesToValidate = selectedFiles.slice(0, availableSlots);
      const validFiles = filesToValidate.filter((file) => {
        if (file.size > maxFileSizeBytes) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${Math.round(maxFileSizeBytes / (1024 * 1024))}MB.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      if (selectedFiles.length > availableSlots) {
        toast({
          title: "Some files were skipped",
          description: `Only the first ${availableSlots} files were considered due to the ${MAX_MEDIA_ITEMS}-file limit.`,
        });
      }

      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
      setFiles((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = (index: number) => {
    const removedPreview = previews[index];
    if (removedPreview?.startsWith("blob:")) URL.revokeObjectURL(removedPreview);

    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!content.trim() && files.length === 0) {
      toast({ title: "Empty Post", description: "Please add some text or media.", variant: "destructive" });
      return;
    }

    if (files.length > MAX_MEDIA_ITEMS) {
      toast({
        title: "Media limit reached",
        description: `Only ${MAX_MEDIA_ITEMS} files are allowed per post.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const mediaUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        let uploadedBucket: string | null = null;
        let lastError: string | null = null;

        for (const bucket of postMediaBuckets) {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

          if (!uploadError) {
            uploadedBucket = bucket;
            break;
          }

          lastError = uploadError.message;

          if (!uploadError.message.toLowerCase().includes("bucket not found")) {
            throw uploadError;
          }
        }

        if (!uploadedBucket) {
          throw new Error(lastError || "Failed to upload media. Please contact admin.");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(uploadedBucket).getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      const { error } = await supabase.from("posts").insert({
        profile_id: profile.id,
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      });

      if (error) throw error;

      toast({ title: "Posted!", description: "Your update is live." });
      previews.forEach((previewUrl) => {
        if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      });
      setContent("");
      setFiles([]);
      setPreviews([]);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Post error:", error);
      const message = error instanceof Error ? error.message : "Failed to post update.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary/30 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create Update</DialogTitle>
          <DialogDescription>
            Share what's happening with your group. Up to {MAX_MEDIA_ITEMS} media files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="What's new?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-background/50 border-secondary/20 resize-none text-base"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-secondary/20 group bg-black/60">
                  {isVideoFile(files[idx]) ? (
                    <video src={src} className="w-full h-full object-cover" controls muted playsInline preload="metadata" />
                  ) : (
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-secondary/10">
            <div className="flex gap-2">
              <label className="cursor-pointer p-2 hover:bg-secondary/10 rounded-full transition-colors text-secondary">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex items-center gap-1">
                  <Image className="w-5 h-5" />
                  <Video className="w-5 h-5" />
                </div>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={uploading || (!content.trim() && files.length === 0)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
