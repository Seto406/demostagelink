import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  FileText, 
  Shield, 
  LogOut, 
  Key,
  Users,
  Trash2,
  Save,
  ChevronRight,
  Bell,
  Camera,
  Upload,
  X,
  Facebook,
  Instagram,
  MapPin,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Zap, Check } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const { isPro, initiateCheckout, isCheckingOut, isLoading: subLoading } = useSubscription();
  
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
  const [saving, setSaving] = useState(false);
  
  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Producer request state
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [requestGroupName, setRequestGroupName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);
  
  // Delete account state
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Notification state
  const [notifyApprovals, setNotifyApprovals] = useState(() => localStorage.getItem("notifyApprovals") !== "false");
  const [notifyShows, setNotifyShows] = useState(() => localStorage.getItem("notifyShows") !== "false");
  const [notifyMarketing, setNotifyMarketing] = useState(() => localStorage.getItem("notifyMarketing") === "true");

  const toggleNotify = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
    });
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load profile data
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
  }, [profile]);

  // Check for existing producer request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("producer_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
      }
    };

    checkExistingRequest();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password.",
        variant: "destructive",
      });
    }
    setChangingPassword(false);
  };

  const handleProducerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmittingRequest(true);
    try {
      const { error } = await supabase
        .from("producer_requests")
        .insert({
          user_id: user.id,
          group_name: requestGroupName,
          portfolio_link: portfolioLink,
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your request to become a producer has been submitted for review.",
      });
      setProducerRequestModal(false);
      setExistingRequest({ status: "pending" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. You may already have a pending request.",
        variant: "destructive",
      });
    }
    setSubmittingRequest(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    // Note: Full account deletion would require an edge function with service role
    // For now, we'll sign out and show a message
    toast({
      title: "Contact Support",
      description: "To delete your account, please contact support at connect.stagelink@gmail.com",
    });
    setDeleteModal(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
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

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
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
      // Remove from storage
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      // Update profile
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

      // Delete old map if exists
      await supabase.storage.from('avatars').remove([`${user.id}/map.jpg`, `${user.id}/map.png`, `${user.id}/map.webp`]);

      // Upload new map
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

  const isProducer = profile?.role === "producer";
  const isAudience = profile?.role === "audience";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account and profile settings
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Account Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Account Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{user?.email}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Account Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground capitalize">
                      {profile?.role || "User"}
                      {profile?.role === "admin" && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Member Since</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Unknown"
                      }
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-secondary/10">
                  <Label htmlFor="username" className="text-muted-foreground text-sm mb-1 block">Username / Display Name</Label>
                  <div className="flex gap-3">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="bg-background border-secondary/30"
                    />
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      size="sm"
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is how you will appear in comments and reviews.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Subscription */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Subscription
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-secondary/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground font-medium text-lg">
                      {isPro ? "Pro Producer" : "Free Plan"}
                    </p>
                    {isPro && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPro
                      ? "You have access to all premium features."
                      : "Upgrade to unlock advanced analytics and more."}
                  </p>
                </div>

                {!isPro ? (
                  <Button
                    onClick={() => initiateCheckout()}
                    disabled={isCheckingOut || subLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                  >
                    {isCheckingOut ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2 fill-current" />
                        Upgrade Pro
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="text-green-500 border-green-500/20 bg-green-500/10">
                    <Check className="w-4 h-4 mr-2" />
                    Pro Active
                  </Button>
                )}
              </div>
            </motion.section>

            {/* Profile Information (Producers only) */}
            {isProducer && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-secondary/10">
                    <Building2 className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">
                    Theater Group Profile
                  </h2>
                </div>

                <div className="space-y-4">
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

                  <div className="grid sm:grid-cols-2 gap-4">
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
                  <div className="pt-4 border-t border-secondary/10">
                    <Label className="text-muted-foreground text-sm mb-3 block">Social Media Links</Label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebookUrl" className="flex items-center gap-2 text-sm">
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </Label>
                        <Input
                          id="facebookUrl"
                          value={facebookUrl}
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="https://facebook.com/yourpage"
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
                          placeholder="https://instagram.com/yourhandle"
                          className="mt-1 bg-background border-secondary/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-4 border-t border-secondary/10">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Your location helps audiences find nearby productions
                    </p>
                  </div>

                  {/* Map Screenshot Upload */}
                  <div className="pt-4 border-t border-secondary/10">
                    <Label className="flex items-center gap-2 text-sm mb-3">
                      <Image className="w-4 h-4" />
                      Map Screenshot (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload a screenshot of your location from Google Maps to help audiences find you
                    </p>
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
                        <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Upload */}
                  <div className="pt-4 border-t border-secondary/10">
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
                        <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full sm:w-auto mt-4"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </motion.section>
            )}

            {/* Producer Request (Audience only) */}
            {isAudience && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-secondary/10">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">
                    Become a Producer
                  </h2>
                </div>

                <p className="text-muted-foreground mb-4">
                  Are you part of a theater group? Request producer access to submit and manage your shows on StageLink.
                </p>

                {existingRequest ? (
                  <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${
                    existingRequest.status === "pending" 
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                      : existingRequest.status === "approved"
                      ? "bg-green-500/10 text-green-500 border border-green-500/30"
                      : "bg-red-500/10 text-red-500 border border-red-500/30"
                  }`}>
                    <Users className="w-4 h-4" />
                    Request Status: {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                  </div>
                ) : (
                  <Button
                    onClick={() => setProducerRequestModal(true)}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Request Producer Access
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </motion.section>
            )}

            {/* Notifications */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-secondary/10">
                  <Bell className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Notifications
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-secondary/10">
                  <div>
                    <p className="text-foreground font-medium">Show Approvals</p>
                    <p className="text-sm text-muted-foreground">Get notified when your shows are approved</p>
                  </div>
                  <Switch
                    checked={notifyApprovals}
                    onCheckedChange={(c) => toggleNotify("notifyApprovals", c, setNotifyApprovals)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-secondary/10">
                  <div>
                    <p className="text-foreground font-medium">New Shows</p>
                    <p className="text-sm text-muted-foreground">Updates about new theater productions</p>
                  </div>
                  <Switch
                    checked={notifyShows}
                    onCheckedChange={(c) => toggleNotify("notifyShows", c, setNotifyShows)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-secondary/10">
                  <div>
                    <p className="text-foreground font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">News and promotions from StageLink</p>
                  </div>
                  <Switch
                    checked={notifyMarketing}
                    onCheckedChange={(c) => toggleNotify("notifyMarketing", c, setNotifyMarketing)}
                  />
                </div>
              </div>
            </motion.section>

            {/* Appearance */}
            {/* Appearance section hidden - dark mode only for now */}

            {/* Security */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Security
                </h2>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-background/80 border border-secondary/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-foreground font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-background/80 border border-secondary/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-foreground font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </motion.section>

            {/* Danger Zone */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Danger Zone
                </h2>
              </div>

              <p className="text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              <Button
                variant="outline"
                onClick={() => setDeleteModal(true)}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </motion.section>
          </div>
        </div>
      </main>
      <Footer />

      {/* Change Password Modal */}
      <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
        <DialogContent className="bg-card border-secondary/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="bg-background border-secondary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="bg-background border-secondary/30"
              />
            </div>
            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changingPassword || !newPassword || !confirmPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Producer Request Modal */}
      <Dialog open={producerRequestModal} onOpenChange={setProducerRequestModal}>
        <DialogContent className="bg-card border-secondary/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Request Producer Access</DialogTitle>
            <DialogDescription>
              Submit your theater group information for admin review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProducerRequest} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="requestGroupName">Theater Group Name *</Label>
              <Input
                id="requestGroupName"
                value={requestGroupName}
                onChange={(e) => setRequestGroupName(e.target.value)}
                placeholder="Enter your theater group name"
                required
                className="bg-background border-secondary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolioLink">Portfolio/Social Link *</Label>
              <Input
                id="portfolioLink"
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://facebook.com/yourgroup"
                required
                className="bg-background border-secondary/30"
              />
              <p className="text-xs text-muted-foreground">
                Provide a link to your Facebook page, website, or portfolio as proof.
              </p>
            </div>
            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProducerRequestModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRequest || !requestGroupName || !portfolioLink}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                {submittingRequest ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent className="bg-card border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600"
            >
              Contact Support to Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
