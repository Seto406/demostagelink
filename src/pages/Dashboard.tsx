import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingInput, FloatingTextarea } from "@/components/ui/floating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Menu, X, Upload, Trash2, Pencil, ArrowLeft, Lock, AlertTriangle, User } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { TourGuide } from "@/components/onboarding/TourGuide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GroupMembers } from "@/components/dashboard/GroupMembers";
import { AudienceLinking } from "@/components/dashboard/AudienceLinking";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { useSubscription } from "@/hooks/useSubscription";
import { UpsellModal } from "@/components/dashboard/UpsellModal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { schools } from "@/data/schools";
import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { Show } from "@/types/dashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const { isPro } = useSubscription();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile" | "members">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showFilter, setShowFilter] = useState<'ongoing' | 'archived'>('ongoing');
  const queryClient = useQueryClient();

  // Use React Query for fetching shows
  const { data: shows = [], isLoading: loadingShows, refetch: fetchShows } = useQuery({
    queryKey: ['producer-shows', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("producer_id", profile.id)
        // Fetches all shows, including archived ones, to enable the "Archived" tab
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shows:", error);
        throw error;
      }
      return data as Show[];
    },
    enabled: !!profile,
  });

  // Profile form states
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [niche, setNiche] = useState<"local" | "university" | "">("");
  const [university, setUniversity] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [mapEmbedUrl, setMapEmbedUrl] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // Redirect if not logged in or not a producer
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (profile && profile.role !== "producer") {
        navigate("/");
      }
    }
  }, [user, profile, loading, navigate]);

  // Handle URL routing
  useEffect(() => {
    if (location.pathname === "/dashboard/analytics") {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setGroupName(profile.group_name || "");
      setDescription(profile.description || "");
      setFoundedYear(profile.founded_year?.toString() || "");
      setNiche(profile.niche || "");
      setUniversity(profile.university || "");
      setAvatarPreview(profile.avatar_url || null);
      if (profile.map_screenshot_url && profile.map_screenshot_url.startsWith("<iframe")) {
        setMapEmbedUrl(profile.map_screenshot_url);
        setMapPreview(null);
      } else {
        setMapPreview(profile.map_screenshot_url || null);
        setMapEmbedUrl("");
      }
    }
  }, [profile]);

  const isTrialExpired = false; // FORCE TRIAL NOT EXPIRED FOR TESTING

  // Handle tour
  useEffect(() => {
    if (profile && !profile.has_completed_tour) {
      // Delay tour start to ensure Dashboard DOM is fully rendered
      const timer = setTimeout(() => setRunTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleRestartTour = () => {
    setRunTour(true);
  };

  const handleTourFinish = async () => {
    if (!profile) return;

    // Update profile to mark tour as completed
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_tour: true })
      .eq("id", profile.id);

    if (error) {
      console.error("Error updating tour status:", error);
    } else {
      refreshProfile();
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an avatar smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleMapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a map image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setMapFile(file);
    setMapPreview(URL.createObjectURL(file));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const openAddModal = () => {
    setEditingShow(null);
    setShowModal(true);
  };

  const openEditModal = (show: Show) => {
    setEditingShow(show);
    setShowModal(true);
  };

  const handleDeleteShow = async (showId: string) => {
    if (!confirm("Are you sure you want to delete this show? This action will archive the show.")) return;

    // Optimistic Update: Immediately remove from UI (move to archive)
    const previousShows = queryClient.getQueryData<Show[]>(['producer-shows', profile?.id]);
    queryClient.setQueryData(['producer-shows', profile?.id], (old: Show[] | undefined) => {
      if (!old) return [];
      return old.map(s =>
        s.id === showId
          ? { ...s, status: 'archived' as const, deleted_at: new Date().toISOString() }
          : s
      );
    });

    try {
      const { error } = await supabase
        .from("shows")
        // @ts-ignore: 'archived' is not yet in the generated types
        .update({ status: 'archived', deleted_at: new Date().toISOString() })
        .eq("id", showId);

      if (error) {
        // Rollback on error
        if (previousShows) {
            queryClient.setQueryData(['producer-shows', profile?.id], previousShows);
        }
        throw error;
      }

      toast({
        title: "Show Deleted",
        description: "The show has been moved to archive.",
      });
      // No need to fetchShows() if optimistic update worked, but we can do it to be safe
      // fetchShows();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete show.",
        variant: "destructive",
      });
    }
  };

  const handlePromoteShow = async (showId: string, showTitle: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-paymongo-session", {
        body: {
          amount: 50000, // 500 PHP
          description: `Feature Show: ${showTitle}`,
          metadata: {
            type: "featured_show",
            show_id: showId
          },
          redirect_url: window.location.origin + "/payment/success",
        },
      });

      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Promotion error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate promotion payment.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setUploadingProfile(true);

    try {
      let avatarUrl = profile.avatar_url;
      let mapUrl = profile.map_screenshot_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${profile.id}/avatar_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Handle Map Update logic
      if (mapEmbedUrl.trim()) {
        // If embed URL is provided, prioritize it
        mapUrl = mapEmbedUrl.trim();
      } else if (mapFile) {
        // Upload map if changed and no embed URL
        const fileExt = mapFile.name.split(".").pop();
        const fileName = `${profile.id}/map_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("show-posters") // Using show-posters bucket for now as it's general purpose public
          .upload(fileName, mapFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("show-posters")
          .getPublicUrl(fileName);

        mapUrl = publicUrl;
      } else if (!mapPreview && !mapEmbedUrl) {
        // If both are empty/cleared
        mapUrl = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          group_name: groupName || null,
          description: description || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          niche: niche || null,
          university: niche === "university" ? university : null,
          avatar_url: avatarUrl,
          map_screenshot_url: mapUrl
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      refreshProfile();
    } catch (error) {
      console.error("Profile update error:", error);
      const message = (error as { message?: string })?.message || "Failed to update profile. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingProfile(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "pending":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "rejected":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "UNDER REVIEW";
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <TourGuide
        isTrialExpired={isTrialExpired}
        run={runTour}
        setRun={setRunTour}
        onFinish={handleTourFinish}
      />
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        isPro={isPro}
        onUpsell={() => setShowUpsellModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="border-b border-secondary/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/feed">
              <button
                aria-label="Back to Home"
                className="p-2 hover:bg-muted transition-colors rounded-lg flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Back to Home</span>
              </button>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <h1 className="font-serif text-xl text-foreground">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "shows" && "My Productions"}
            {activeTab === "profile" && "Group Profile"}
            {activeTab === "members" && "Group Members"}
          </h1>
          <div className="w-10" />
        </header>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div id="dashboard-stats" className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Total Productions</p>
                  <p className="text-3xl font-serif text-foreground">{shows.length}</p>
                </div>
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Approved</p>
                  <p className="text-3xl font-serif text-green-500">
                    {shows.filter((s) => s.status === "approved").length}
                  </p>
                </div>
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Under Review</p>
                  <p className="text-3xl font-serif text-yellow-500">
                    {shows.filter((s) => s.status === "pending").length}
                  </p>
                </div>
              </div>

              {profile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl text-foreground">Analytics Overview</h2>
                    {!isPro && <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <AnalyticsDashboard profileId={profile.id} isPro={isPro} onUpsell={() => setShowUpsellModal(true)} />
                </div>
              )}

              <div id="quick-actions-container" className="bg-card border border-secondary/20 p-6">
                <h2 className="font-serif text-xl text-foreground mb-4">Quick Actions</h2>
                {isTrialExpired ? (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                    <div>
                      <h3 className="font-medium text-destructive">Trial Expired</h3>
                      <p className="text-sm text-muted-foreground">
                        Your 1-month free trial has ended. Please upgrade to continue creating shows.
                      </p>
                    </div>
                  </div>
                ) : (
                  profile?.role === "producer" && (
                    <RippleButton id="add-show-button" onClick={openAddModal} variant="ios" size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Show
                    </RippleButton>
                  )
                )}
              </div>
            </motion.div>
          )}

          {/* Shows Tab */}
          {activeTab === "shows" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Your Shows</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setShowFilter('ongoing')}
                      className={`text-sm px-3 py-1 rounded-full transition-colors ${
                        showFilter === 'ongoing'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/10 text-muted-foreground hover:bg-secondary/20'
                      }`}
                    >
                      Ongoing
                    </button>
                    <button
                      onClick={() => setShowFilter('archived')}
                      className={`text-sm px-3 py-1 rounded-full transition-colors ${
                        showFilter === 'archived'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/10 text-muted-foreground hover:bg-secondary/20'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>

                {isTrialExpired ? (
                  <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    Add Show (Expired)
                  </Button>
                ) : (
                  profile?.role === "producer" && showFilter === 'ongoing' && (
                    <RippleButton onClick={openAddModal} variant="ios">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Show
                    </RippleButton>
                  )
                )}
              </div>

              {loadingShows ? (
                <div className="text-muted-foreground text-center py-8">Loading shows...</div>
              ) : shows.filter(s => showFilter === 'ongoing' ? s.status !== 'archived' : s.status === 'archived').length === 0 ? (
                <div className="bg-card border border-secondary/20 p-12 text-center ios-rounded">
                  <p className="text-muted-foreground mb-4">
                    {showFilter === 'ongoing' ? "You haven't submitted any shows yet." : "No archived shows."}
                  </p>
                  {!isTrialExpired && profile?.role === "producer" && showFilter === 'ongoing' && (
                    <RippleButton id="add-show-button" onClick={openAddModal} variant="ios-secondary">
                      Submit Your First Show
                    </RippleButton>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-secondary/20 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Title</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Date</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Approval</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Production Status</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shows
                        .filter(s => showFilter === 'ongoing' ? s.status !== 'archived' : s.status === 'archived')
                        .map((show) => (
                        <tr key={show.id} className="border-t border-secondary/10">
                          <td className="p-4 text-foreground">{show.title}</td>
                          <td className="p-4 text-muted-foreground">
                            {show.date ? new Date(show.date).toLocaleDateString() : "TBD"}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs border ${getStatusColor(show.status)}`}>
                              {getStatusLabel(show.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 text-xs border border-secondary/30 bg-secondary/10 text-secondary rounded-full capitalize">
                              {show.production_status || "ongoing"}
                            </span>
                          </td>
                          <td className="p-4 flex items-center gap-2">
                            {showFilter === 'ongoing' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(show)}
                                  className="h-8 w-8 p-0"
                                  title="Edit Show"
                                  aria-label={`Edit ${show.title}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteShow(show.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Archive Show"
                                  aria-label={`Archive ${show.title}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>

                                {!show.is_featured && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => !isPro ? setShowUpsellModal(true) : handlePromoteShow(show.id, show.title)}
                                    className="text-xs h-7 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                                  >
                                    {!isPro && <Lock className="w-3 h-3 mr-1" />}
                                    Promote (₱500)
                                  </Button>
                                )}
                                {show.is_featured && (
                                  <span className="text-xs text-yellow-500 font-medium px-2 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                                    Featured
                                  </span>
                                )}
                              </>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">Archived</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            >
              {/* Left Column: Basic Info */}
              <div className="bg-card border border-secondary/20 p-6 ios-rounded space-y-6">
                <h2 className="font-serif text-xl text-foreground mb-4">Group Information</h2>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-32 h-32 mb-4 group cursor-pointer">
                    <label className="cursor-pointer block w-full h-full rounded-full overflow-hidden border-2 border-dashed border-secondary/30 hover:border-secondary transition-colors relative">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarSelect}
                      />
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/10">
                          <User className="w-10 h-10 text-secondary/50 mb-2" />
                          <span className="text-xs text-secondary/50">Upload Logo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Pencil className="w-8 h-8 text-white" />
                      </div>
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">Tap to change group logo</p>
                </div>

                <div className="space-y-6">
                  <FloatingInput
                    label="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />

                  <FloatingTextarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <FloatingInput
                    label="Founded Year"
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    min={1900}
                    max={new Date().getFullYear()}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-sm font-medium text-muted-foreground">Niche</Label>
                    <Select value={niche} onValueChange={(val) => setNiche(val as "local" | "university")}>
                      <SelectTrigger className="bg-background border-secondary/30 h-12 rounded-xl">
                        <SelectValue placeholder="Select your group type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-secondary/30 rounded-xl">
                        <SelectItem value="local">Local/Community-based</SelectItem>
                        <SelectItem value="university">University Theater Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {niche === "university" && (
                    <div className="space-y-2">
                      <Label htmlFor="university" className="text-sm font-medium text-muted-foreground">University Affiliation</Label>
                      <SearchableSelect
                        options={schools}
                        value={university}
                        onChange={setUniversity}
                        placeholder="Select University"
                        className="h-12 rounded-xl"
                      />
                    </div>
                  )}

                  <RippleButton
                    onClick={handleUpdateProfile}
                    variant="ios"
                    size="lg"
                    className="w-full"
                    disabled={uploadingProfile}
                  >
                    {uploadingProfile ? "Saving..." : "Save Profile"}
                  </RippleButton>
                </div>
              </div>

              {/* Right Column: Location & Visuals */}
              <div className="space-y-6">
                <div className="bg-card border border-secondary/20 p-6 ios-rounded">
                  <h2 className="font-serif text-xl text-foreground mb-4">Location & Visuals</h2>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground">Upload Map Screenshot (Optional)</Label>
                    {mapPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-secondary/30">
                        <img
                          src={mapPreview}
                          alt="Venue Map"
                          className="w-full max-h-64 object-contain bg-black/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMapFile(null);
                            setMapPreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : !mapEmbedUrl ? (
                      <label className="border-2 border-dashed border-secondary/30 p-8 text-center cursor-pointer hover:border-secondary/50 transition-colors rounded-xl ios-press block">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleMapSelect}
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                          Click to upload your venue map
                        </p>
                      </label>
                    ) : null}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-secondary/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or using Google Maps</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mapEmbedUrl" className="text-sm font-medium text-muted-foreground">Google Maps Embed Link</Label>
                      <Input
                        id="mapEmbedUrl"
                        value={mapEmbedUrl}
                        onChange={(e) => {
                          setMapEmbedUrl(e.target.value);
                          if (e.target.value) {
                            setMapFile(null);
                            setMapPreview(null);
                          }
                        }}
                        placeholder='<iframe src="https://www.google.com/maps/embed?...'
                        className="bg-background border-secondary/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste the "Embed a map" HTML code from Google Maps here. This will override any uploaded map image.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Application Settings Section (Moved to Right Column) */}
                <div className="bg-card border border-secondary/20 p-6 ios-rounded">
                <h2 className="font-serif text-xl text-foreground mb-4">Application Settings</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Onboarding Tour</p>
                    <p className="text-sm text-muted-foreground">Restart the guided tour of the dashboard.</p>
                  </div>
                  <Button variant="outline" onClick={handleRestartTour}>
                    Restart Tour
                  </Button>
                </div>
              </div>
              </div>
            </motion.div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl space-y-6"
            >
              <GroupMembers profileId={profile.id} isPro={isPro} onUpsell={() => setShowUpsellModal(true)} />
              <AudienceLinking isPro={isPro} />
            </motion.div>
          )}
        </div>
      </main>

      <ProductionModal
        open={showModal}
        onOpenChange={setShowModal}
        showToEdit={editingShow}
        onSuccess={() => fetchShows()}
      />

      <UpsellModal open={showUpsellModal} onOpenChange={setShowUpsellModal} />
    </div>
  );
};

export default Dashboard;
