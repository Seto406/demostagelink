import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Camera, Upload, X, Save, Plus, Trash2 } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user, profile, refreshProfile, updateProfileState } = useAuth();

  // Profile form state
  const [username, setUsername] = useState("");
  const [producerRole, setProducerRole] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([""]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  // Local avatar preview (optimistic UI or just reflecting prop)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [initialValues, setInitialValues] = useState<{
    username: string;
    producerRole: string;
    description: string;
    websiteUrls: string[];
  } | null>(null);

  useEffect(() => {
    if (open && profile) {
      const initialUsername = profile.username || "";
      const initialProducerRole = profile.producer_role || "";
      const initialDescription = profile.description || "";
      // Ensure we have at least one input if array is empty
      const initialWebsiteUrls = profile.website_urls && profile.website_urls.length > 0
        ? profile.website_urls
        : [""];

      setUsername(initialUsername);
      setProducerRole(initialProducerRole);
      setDescription(initialDescription);
      setWebsiteUrls(initialWebsiteUrls);
      setAvatarUrl(profile.avatar_url || null);

      setInitialValues({
        username: initialUsername,
        producerRole: initialProducerRole,
        description: initialDescription,
        websiteUrls: initialWebsiteUrls
      });
      setShowDiscardAlert(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty = useMemo(() => {
    if (!initialValues) return false;

    // Check if arrays are different
    const urlsChanged = JSON.stringify(websiteUrls) !== JSON.stringify(initialValues.websiteUrls);

    return (
      username !== initialValues.username ||
      producerRole !== initialValues.producerRole ||
      description !== initialValues.description ||
      urlsChanged
    );
  }, [username, producerRole, description, websiteUrls, initialValues]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (isDirty) {
        setShowDiscardAlert(true);
        return;
      }
    }
    onOpenChange(newOpen);
  };

  const handleDiscard = () => {
    setShowDiscardAlert(false);
    onOpenChange(false);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    // Username validation
    if (username) {
      if (username.length < 3 || username.length > 20) {
        toast({
          title: "Invalid Username",
          description: "Username must be between 3 and 20 characters.",
          variant: "destructive",
        });
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast({
          title: "Invalid Username",
          description: "Username can only contain letters, numbers, and underscores.",
          variant: "destructive",
        });
        return;
      }
    }

    // Website URL validation
    // Filter out empty strings first
    const cleanUrls = websiteUrls.filter(url => url.trim() !== "");

    for (const url of cleanUrls) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(url)) {
        toast({
          title: "Invalid URL",
          description: `"${url}" is not a valid URL.`,
          variant: "destructive",
        });
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
          toast({
            title: "Invalid URL",
            description: `"${url}" must start with http:// or https://`,
             variant: "destructive",
          });
          return;
       }
    }

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        username: username || null,
        producer_role: producerRole || null,
        description: description || null,
        website_urls: cleanUrls.length > 0 ? cleanUrls : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505') {
        toast({
          title: "Error",
          description: "Username already taken.",
          variant: "destructive",
        });
      } else {
        console.error("Profile update error:", error);
        const message = (error as { message?: string })?.message || "Failed to update profile. Please try again.";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlData.publicUrl);
      updateProfileState({ avatar_url: urlData.publicUrl });

      toast({
        title: "Avatar Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
      updateProfileState({ avatar_url: null });

      toast({
        title: "Avatar Removed",
        description: "Your profile photo has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove avatar.",
        variant: "destructive",
      });
    }
    setUploadingAvatar(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="bg-card border-secondary/30 sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Personal Settings</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Profile Photo</Label>
            {profile?.role === 'producer' && (
              <p className="text-xs text-muted-foreground mb-3">
                This is your personal avatar. To change your Theater Group logo, go to your Producer Profile.
              </p>
            )}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-secondary/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-secondary/10 border-2 border-secondary/30 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white/90" />
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-10">
                      <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </label>

              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-medium rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </span>
                </label>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-500 text-sm hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP. Max 2MB.</p>
          </div>

          {/* Basic Info */}
          <div>
             <Label htmlFor="username">Username / Display Name</Label>
             <Input
               id="username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               placeholder="Enter your username"
               className="mt-1 bg-background border-secondary/30"
             />
             <p className="text-xs text-muted-foreground mt-1">
               This is how you will appear in comments and reviews.
             </p>
          </div>

          {/* Bio / Description */}
          <div>
             <Label htmlFor="description">Bio / Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Tell us about yourself..."
               className="mt-1 bg-background border-secondary/30 min-h-[100px]"
             />
             <p className="text-xs text-muted-foreground mt-1">
               A short bio for your profile.
             </p>
          </div>

          {/* Portfolio Links */}
          <div>
             <Label>Portfolio Links (Max 3)</Label>
             <div className="space-y-3 mt-1">
               {websiteUrls.map((url, index) => (
                 <div key={index} className="flex gap-2">
                   <Input
                     value={url}
                     onChange={(e) => {
                       const newUrls = [...websiteUrls];
                       newUrls[index] = e.target.value;
                       setWebsiteUrls(newUrls);
                     }}
                     placeholder="https://your-portfolio.com"
                     className="bg-background border-secondary/30"
                   />
                   {websiteUrls.length > 1 && (
                     <Button
                       variant="outline"
                       size="icon"
                       onClick={() => {
                         const newUrls = websiteUrls.filter((_, i) => i !== index);
                         setWebsiteUrls(newUrls);
                       }}
                       className="shrink-0 text-muted-foreground hover:text-destructive"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   )}
                 </div>
               ))}

               {websiteUrls.length < 3 && (
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => setWebsiteUrls([...websiteUrls, ""])}
                   className="mt-2 text-xs"
                 >
                   <Plus className="w-3 h-3 mr-1" />
                   Add Link
                 </Button>
               )}
             </div>
             <p className="text-xs text-muted-foreground mt-2">
               Links to your personal website or portfolio.
             </p>
          </div>

          {profile?.role === 'producer' && (
            <div>
               <Label htmlFor="producerRole">Title / Role</Label>
               <Input
                 id="producerRole"
                 value={producerRole}
                 onChange={(e) => setProducerRole(e.target.value)}
                 placeholder="e.g. Artistic Director, Founder"
                 className="mt-1 bg-background border-secondary/30"
               />
               <p className="text-xs text-muted-foreground mt-1">
                 Your role within the theater group.
               </p>
            </div>
          )}

          {/* Account Email (Read-only) */}
          <div>
             <Label htmlFor="email">Account Email</Label>
             <Input
               id="email"
               value={user?.email || ""}
               readOnly
               className="mt-1 bg-muted border-secondary/30 cursor-not-allowed opacity-70"
             />
             <p className="text-xs text-muted-foreground mt-1">
               Your email address cannot be changed here.
             </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
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
