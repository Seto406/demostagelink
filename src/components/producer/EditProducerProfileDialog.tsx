import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2, Upload } from "lucide-react";
import { useDraftStorage } from "@/hooks/useDraftStorage";

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
  producer: {
    group_name?: string | null;
    description?: string | null;
    group_logo_url?: string | null;
    group_banner_url?: string | null;
  } | null;
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
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);
  const [ownerProfileId, setOwnerProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [initialValues, setInitialValues] = useState<{
    name: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      let values = { name: "", description: "", logoUrl: "", bannerUrl: "" };
      if (theaterGroup) {
        values = {
            name: theaterGroup.name || "",
            description: theaterGroup.description || "",
            logoUrl: theaterGroup.logo_url || "",
            bannerUrl: theaterGroup.banner_url || ""
        };
      } else if (producer) {
        values = {
            name: producer.group_name || "",
            description: producer.description || "",
            logoUrl: producer.group_logo_url || "",
            bannerUrl: producer.group_banner_url || ""
        };
      }
      setName(values.name);
      setDescription(values.description);
      setLogoUrl(values.logoUrl);
      setBannerUrl(values.bannerUrl);
      setInitialValues(values);
      setShowDiscardAlert(false);
    }
  }, [open, theaterGroup, producer]);

  useEffect(() => {
    if (!open || !user) return;

    const resolveOwnerProfileId = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setOwnerProfileId(data?.id ?? null);
    };

    resolveOwnerProfileId();
  }, [open, user]);

  const { didRestoreDraft, clearDraft } = useDraftStorage({
    modalName: "theatergroupdetails",
    userId: user?.id,
    isOpen: open,
    draft: { name, description, logoUrl, bannerUrl },
    onHydrate: (savedDraft) => {
      setName(savedDraft.name ?? "");
      setDescription(savedDraft.description ?? "");
      setLogoUrl(savedDraft.logoUrl ?? "");
      setBannerUrl(savedDraft.bannerUrl ?? "");
    },
  });

  useEffect(() => {
    if (didRestoreDraft) {
      toast.info("Restored unsaved changes");
    }
  }, [didRestoreDraft]);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    return (
      name !== initialValues.name ||
      description !== initialValues.description ||
      logoUrl !== initialValues.logoUrl ||
      bannerUrl !== initialValues.bannerUrl
    );
  }, [name, description, logoUrl, bannerUrl, initialValues]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (isDirty) {
        setShowDiscardAlert(true);
        return;
      }
    }
    if (!newOpen) {
      clearDraft();
    }
    onOpenChange(newOpen);
  };

  const handleDiscard = () => {
    clearDraft();
    setShowDiscardAlert(false);
    onOpenChange(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      setUploading(true);
      const file = event.target.files[0];
      const filePath = `${user.id}/logo.png`;

      const { error: uploadError } = await supabase.storage
        .from('group-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('group-assets')
        .getPublicUrl(filePath);

      // Add a timestamp to bust cache
      const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      setLogoUrl(publicUrlWithTimestamp);

      // Update profiles immediately as per requirement
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ group_logo_url: publicUrlWithTimestamp })
        .eq('id', ownerProfileId ?? user.id);

      if (updateError) throw updateError;

      // Also update theater_groups if we have the ID
      if (theaterGroup?.id) {
          const { error: groupError } = await supabase
            .from('theater_groups')
            .update({ logo_url: publicUrlWithTimestamp })
            .eq('id', theaterGroup.id);

          if (groupError) console.error("Error updating theater group logo:", groupError);
      }

      toast.success("Brand identity updated! Your new logo is now live.");

    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error((error as Error).message || "Failed to upload logo");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      setBannerUploading(true);
      const file = event.target.files[0];
      const filePath = `${user.id}/banner.png`;

      const { error: uploadError } = await supabase.storage
        .from('group-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('group-assets')
        .getPublicUrl(filePath);

      // Add a timestamp to bust cache
      const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      setBannerUrl(publicUrlWithTimestamp);

      // Update profiles immediately as per requirement
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ group_banner_url: publicUrlWithTimestamp })
        .eq('id', ownerProfileId ?? user.id);

      if (updateError) throw updateError;

      // Also update theater_groups if we have the ID
      if (theaterGroup?.id) {
          const { error: groupError } = await supabase
            .from('theater_groups')
            .update({ banner_url: publicUrlWithTimestamp })
            .eq('id', theaterGroup.id);

          if (groupError) console.error("Error updating theater group banner:", groupError);
      }

      toast.success("Brand identity updated! Your new banner is now live.");

    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error((error as Error).message || "Failed to upload banner");
    } finally {
      setBannerUploading(false);
      // Reset input
      if (bannerInputRef.current) {
          bannerInputRef.current.value = "";
      }
    }
  };

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

      if (!ownerProfileId) {
        toast.error("Your producer profile is not ready yet. Please complete profile setup and try again.");
        return;
      }

      const effectiveOwnerId = ownerProfileId;

      if (!groupId) {
         // Check if exists in DB even if not passed in prop (double check)
         // Use limit(1) to handle potential duplicates gracefully without error
         const { data: existing } = await supabase
            .from('theater_groups')
            .select('id')
            .eq('owner_id', effectiveOwnerId)
            .limit(1)
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
        owner_id: effectiveOwnerId
      };

      if (groupId) {
        const { error } = await supabase
          .from('theater_groups')
          .update(theaterGroupData)
          .eq('id', groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('theater_groups')
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
        .eq('id', effectiveOwnerId);

      if (profileError) throw profileError;

      toast.success("Profile updated successfully");
      clearDraft();
      onSuccess();
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error updating profile:", error);
      // Handle conflict errors (409 Conflict or 23505 Unique Violation)
      if (error?.status === 409 || error?.code === '23505') {
        toast.error("A conflict occurred. A theater group may already exist for this account.");
      } else {
        toast.error(error?.message || error?.error_description || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="bg-card border-secondary/30 sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
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
              <Label htmlFor="logoUrl">Logo</Label>
              <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                      {logoUrl ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden border border-secondary/30 bg-muted flex-shrink-0">
                              <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                      ) : (
                          <div className="w-20 h-20 rounded-full border border-secondary/30 bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground text-xs text-center p-2">
                              No Logo
                          </div>
                      )}
                      <div className="flex-1">
                          <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleLogoUpload}
                          />
                          <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="w-full sm:w-auto"
                          >
                              {uploading ? (
                                  <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Uploading...
                                  </>
                              ) : (
                                  <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Logo
                                  </>
                              )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                              Recommended: Circular PNG, 400x400px.
                          </p>
                      </div>
                  </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner Image</Label>
              <div className="flex flex-col gap-4">
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-secondary/30 bg-muted flex items-center justify-center relative group">
                      {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                          <div className="text-muted-foreground text-sm">No Banner Image</div>
                      )}
                  </div>

                  <div className="flex items-center gap-4">
                      <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={bannerInputRef}
                          onChange={handleBannerUpload}
                      />
                      <Button
                          type="button"
                          variant="outline"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={bannerUploading}
                          className="w-full"
                      >
                          {bannerUploading ? (
                              <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                              </>
                          ) : (
                              <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Banner
                              </>
                          )}
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                      Recommended size: 1200x400px.
                  </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading || bannerUploading}>
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

      <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardAlert(false)}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
