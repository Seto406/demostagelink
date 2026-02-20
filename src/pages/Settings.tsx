import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard,
  Zap,
  Check,
  Bell,
  Key,
  LogOut, 
  Trash2,
  ChevronRight,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const { isPro, initiateCheckout, isCheckingOut, isLoading: subLoading } = useSubscription();
  
  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Producer request state
  const [producerRequestModal, setProducerRequestModal] = useState(false);
  const [requestGroupName, setRequestGroupName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);
  
  // Delete account state
  const [deleteModal, setDeleteModal] = useState(false);
  
  // Notification state
  const [notifyApprovals, setNotifyApprovals] = useState(() => localStorage.getItem("notifyApprovals") !== "false");
  const [notifyShows, setNotifyShows] = useState(() => localStorage.getItem("notifyShows") !== "false");

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

  // Calculate password strength
  useEffect(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    setPasswordStrength(score);
  }, [newPassword]);

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
      if (user?.email) {
        // Verify current password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            throw new Error("Incorrect current password.");
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Create a timeout promise (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Request timed out")), 15000);
      });

      // Create the insert promise
      const insertPromise = supabase
        .from("producer_requests")
        .insert({
          user_id: user.id,
          group_name: requestGroupName,
          portfolio_link: portfolioLink,
        });

      // Race the request against the timeout
      type InsertResponse = Awaited<ReturnType<typeof insertPromise>>;
      const result = await Promise.race([insertPromise, timeoutPromise]) as InsertResponse;
      const { error } = result;

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your request to become a producer has been submitted for review.",
      });
      setProducerRequestModal(false);
      setExistingRequest({ status: "pending" });
    } catch (error: unknown) {
      console.error("Producer request error:", error);
      const errorMessage = (error as { message?: string })?.message || "Unknown error";
      toast({
        title: "Error",
        description: errorMessage === "Request timed out"
          ? "The request is taking longer than expected. Please check your internet connection."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSubmittingRequest(false);
    }
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
      <div className="pt-6 pb-16">
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

            {/* Subscription - ONLY FOR PRODUCERS */}
            {isProducer && (
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
            )}

            {/* Producer Request (Audience only, hidden for Admins) */}
            {isAudience && !isAdmin && (
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
              </div>
            </motion.section>

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
      </div>
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
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="bg-background border-secondary/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="bg-background border-secondary/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        <span>Strength</span>
                        <span>{['Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength]}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                passwordStrength <= 1 ? 'bg-red-500' :
                                passwordStrength === 2 ? 'bg-orange-500' :
                                passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength + 1) * 20}%` }}
                        />
                    </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="bg-background border-secondary/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                disabled={changingPassword || !newPassword || !confirmPassword || !currentPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Producer Request Modal - Kept same */}
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

      {/* Delete Account Confirmation - Kept same */}
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
