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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Camera, Upload, X, MapPin, Image, Facebook, Instagram, Save } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user, profile, refreshProfile } = useAuth();

  // Profile form state
  const [username, setUsername] = useState("");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [address, setAddress] = useState("");
  const [mapScreenshotUrl, setMapScreenshotUrl] = useState<string | null>(null);

  const [uploadingMap, setUploadingMap] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local avatar preview (optimistic UI or just reflecting prop)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setGroupName(profile.group_name || "");
      setDescription(profile.description || "");
      setFoundedYear(profile.founded_year?.toString() || "");
      setNiche(profile.niche || "");
      setAvatarUrl(profile.avatar_url || null);
      setFacebookUrl(profile.facebook_url || "");
      setInstagramUrl(profile.instagram_url || "");
      setAddress(profile.address || "");
      setMapScreenshotUrl(profile.map_screenshot_url || null);
    }
  }, [profile, open]);

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

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        username: username || null,
      };

      if (profile.role === "producer") {
        updateData.group_name = groupName || null;
        updateData.description = description || null;
        updateData.founded_year = foundedYear ? parseInt(foundedYear) : null;
        updateData.niche = niche || null;
        updateData.facebook_url = facebookUrl || null;
        updateData.instagram_url = instagramUrl || null;
        updateData.address = address || null;
      }

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
      await refreshProfile();

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
      await refreshProfile();

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

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingMap(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/map.${fileExt}`;

      await supabase.storage.from('avatars').remove([`${user.id}/map.jpg`, `${user.id}/map.png`, `${user.id}/map.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ map_screenshot_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setMapScreenshotUrl(urlData.publicUrl);
      await refreshProfile();

      toast({
        title: "Map Uploaded",
        description: "Your map screenshot has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload map. Please try again.",
        variant: "destructive",
      });
    }
    setUploadingMap(false);
  };

  const handleRemoveMap = async () => {
    if (!user) return;

    setUploadingMap(true);
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/map.jpg`, `${user.id}/map.png`, `${user.id}/map.webp`]);

      const { error } = await supabase
        .from('profiles')
        .update({ map_screenshot_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setMapScreenshotUrl(null);
      await refreshProfile();

      toast({
        title: "Map Removed",
        description: "Your map screenshot has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove map.",
        variant: "destructive",
      });
    }
    setUploadingMap(false);
  };

  const isProducer = profile?.role === "producer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary/30 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div>
            <Label className="text-muted-foreground text-sm mb-3 block">Profile Photo</Label>
            <div className="flex items-center gap-4">
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
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
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

          {/* Producer Specific Fields */}
          {isProducer && (
            <div className="space-y-4 pt-4 border-t border-secondary/10">
              <h3 className="font-medium text-foreground">Theater Group Details</h3>

              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter your theater group name"
                  className="mt-1 bg-background border-secondary/30"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell audiences about your theater group..."
                  rows={4}
                  className="mt-1 bg-background border-secondary/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="mt-1 bg-background border-secondary/30"
                  />
                </div>

                <div>
                  <Label htmlFor="niche">Category</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger className="mt-1 bg-background border-secondary/30">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local / Community</SelectItem>
                      <SelectItem value="university">University Theater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebookUrl" className="flex items-center gap-2 text-sm">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebookUrl"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="mt-1 bg-background border-secondary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2 text-sm">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="mt-1 bg-background border-secondary/30"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your theater group's address"
                  className="mt-1 bg-background border-secondary/30"
                />
              </div>

              {/* Map Screenshot Upload */}
              <div>
                <Label className="flex items-center gap-2 text-sm mb-3">
                  <Image className="w-4 h-4" />
                  Map Screenshot (Optional)
                </Label>
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {mapScreenshotUrl ? (
                      <img
                        src={mapScreenshotUrl}
                        alt="Map"
                        className="w-32 h-24 rounded-lg object-cover border-2 border-secondary/30"
                      />
                    ) : (
                      <div className="w-32 h-24 rounded-lg bg-secondary/10 border-2 border-secondary/30 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {uploadingMap && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleMapUpload}
                        className="hidden"
                        disabled={uploadingMap}
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-medium rounded-lg transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload Map
                      </span>
                    </label>
                    {mapScreenshotUrl && (
                      <button
                        onClick={handleRemoveMap}
                        disabled={uploadingMap}
                        className="inline-flex items-center gap-2 px-4 py-2 text-red-500 text-sm hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  );
};
