import { useState } from "react";
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

interface CreateUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUpdateModal({ open, onOpenChange, onSuccess }: CreateUpdateModalProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate
      const validFiles = newFiles.filter(file => {
          if (file.size > 10 * 1024 * 1024) {
              toast({ title: "File too large", description: `${file.name} is over 10MB.`, variant: "destructive" });
              return false;
          }
          return true;
      });

      setFiles(prev => [...prev, ...validFiles]);

      // Generate previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!content.trim() && files.length === 0) {
        toast({ title: "Empty Post", description: "Please add some text or media.", variant: "destructive" });
        return;
    }

    setUploading(true);
    try {
      const mediaUrls: string[] = [];

      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Attempt to upload to 'post-media' bucket
        // If it fails, we might need to fallback or error out.
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, file);

        if (uploadError) {
            // Check if bucket exists error?
            if (uploadError.message.includes("bucket not found")) {
                 // Try to create it? We can't easily here.
                 // Fallback to 'show-posters' just to make it work in demo?
                 // No, that's bad practice.
                 throw new Error("Storage bucket 'post-media' not found. Please contact admin.");
            }
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      // Insert post
      const { error } = await supabase.from('posts').insert({
        profile_id: profile.id,
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      });

      if (error) throw error;

      toast({ title: "Posted!", description: "Your update is live." });
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
          variant: "destructive"
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
          <DialogDescription>Share what's happening with your group.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="What's new?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-background/50 border-secondary/20 resize-none text-base"
          />

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-secondary/20 group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
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

          {/* Actions */}
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
                <Image className="w-5 h-5" />
              </label>
              {/* Could add video icon explicitly if we want different handling */}
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
