import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface TheaterGroup {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_id: string;
}

interface EditProducerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producer: any; // Using any for now to avoid importing the Producer interface from page
  theaterGroup: TheaterGroup | null;
  onSuccess: () => void;
}

export const EditProducerProfileDialog = ({
  open,
  onOpenChange,
  producer,
  theaterGroup,
  onSuccess
}: EditProducerProfileDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (theaterGroup) {
        setName(theaterGroup.name || "");
        setDescription(theaterGroup.description || "");
        setLogoUrl(theaterGroup.logo_url || "");
        setBannerUrl(theaterGroup.banner_url || "");
      } else if (producer) {
        setName(producer.group_name || "");
        setDescription(producer.description || "");
        setLogoUrl(producer.group_logo_url || "");
        setBannerUrl(producer.group_banner_url || "");
      }
    }
  }, [open, theaterGroup, producer]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Group Name is required");
      return;
    }

    setSaving(true);
    try {
      // 1. Upsert into theater_groups
      // First check if it exists or use upsert if constraint is set.
      // Since we know owner_id, let's try to find it first if theaterGroup is null.

      let groupId = theaterGroup?.id;

      if (!groupId) {
         // Check if exists in DB even if not passed in prop (double check)
         const { data: existing } = await supabase
            .from('theater_groups' as any)
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

         if (existing) {
            groupId = existing.id;
         }
      }

      const theaterGroupData = {
        name: name.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (groupId) {
        const { error } = await supabase
          .from('theater_groups' as any)
          .update(theaterGroupData)
          .eq('id', groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('theater_groups' as any)
          .insert([theaterGroupData]);
        if (error) throw error;
      }

      // 2. Update profiles (Legacy sync)
      const profileData = {
        group_name: name.trim(),
        description: description.trim() || null,
        group_logo_url: logoUrl.trim() || null,
        group_banner_url: bannerUrl.trim() || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success("Profile updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary/30 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Edit Theater Profile</DialogTitle>
          <DialogDescription>
            Update your theater group's public information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Theater Group Name"
              className="bg-background border-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your group..."
              className="bg-background border-secondary/30 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <div className="flex gap-2">
                <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="bg-background border-secondary/30"
                />
            </div>
            {logoUrl && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-secondary/30 bg-muted flex items-center justify-center">
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
            )}
            <p className="text-xs text-muted-foreground">Enter a direct link to your logo image.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerUrl">Banner URL</Label>
            <Input
              id="bannerUrl"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="bg-background border-secondary/30"
            />
            {bannerUrl && (
                <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-secondary/30 bg-muted flex items-center justify-center">
                    <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
            )}
             <p className="text-xs text-muted-foreground">Recommended size: 1200x400px.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
