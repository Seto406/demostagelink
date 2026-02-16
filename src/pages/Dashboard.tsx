import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FloatingInput, FloatingTextarea } from "@/components/ui/floating-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Menu, X, Upload, Image, Trash2, Pencil, ArrowLeft, Lock, AlertTriangle, HelpCircle, User } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { TourGuide } from "@/components/onboarding/TourGuide";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { GroupMembers } from "@/components/dashboard/GroupMembers";
import { AudienceLinking } from "@/components/dashboard/AudienceLinking";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { TagInput } from "@/components/ui/tag-input";
import { ImageCropper } from "@/components/ui/image-cropper";
import { useSubscription } from "@/hooks/useSubscription";
import { UpsellModal } from "@/components/dashboard/UpsellModal";

interface CastMember {
  name: string;
  role: string;
}

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  ticket_link: string | null;
  poster_url: string | null;
  status: "pending" | "approved" | "rejected";
  production_status: "ongoing" | "completed" | "draft";
  created_at: string;
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: CastMember[] | null;
  price: number | null;
  is_featured?: boolean;
}

const resizeImage = (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          "image/jpeg",
          0.8
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const { isPro } = useSubscription();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile" | "members">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Use React Query for fetching shows
  const { data: shows = [], isLoading: loadingShows, refetch: fetchShows } = useQuery({
    queryKey: ['producer-shows', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("producer_id", profile.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shows:", error);
        throw error;
      }
      return data as Show[];
    },
    enabled: !!profile,
  });

  // Form states for new show
  const [newShowTitle, setNewShowTitle] = useState("");
  const [newShowDescription, setNewShowDescription] = useState("");
  const [newShowDate, setNewShowDate] = useState("");
  const [newShowVenue, setNewShowVenue] = useState("");
  const [newShowCity, setNewShowCity] = useState("");
  const [newShowNiche, setNewShowNiche] = useState<"local" | "university">("local");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [newShowTicketLink, setNewShowTicketLink] = useState("");
  const [newShowPrice, setNewShowPrice] = useState("");
  const [newShowGenre, setNewShowGenre] = useState<string[]>([]);
  const [newShowDirector, setNewShowDirector] = useState("");
  const [newShowDuration, setNewShowDuration] = useState("");
  const [newShowTags, setNewShowTags] = useState("");
  const [newShowCast, setNewShowCast] = useState<CastMember[]>([]);
  const [tempCastName, setTempCastName] = useState("");
  const [tempCastRole, setTempCastRole] = useState("");
  const [newShowProductionStatus, setNewShowProductionStatus] = useState<"ongoing" | "completed" | "draft">("ongoing");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempPosterSrc, setTempPosterSrc] = useState<string | null>(null);

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

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setTempPosterSrc(reader.result?.toString() || "");
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "poster.jpg", { type: "image/jpeg" });
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(croppedBlob));
    setCropperOpen(false);
    setTempPosterSrc(null);
  };

  const clearPoster = () => {
    setPosterFile(null);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
      setPosterPreview(null);
    }
  };

  const resetForm = () => {
    setNewShowTitle("");
    setNewShowDescription("");
    setNewShowDate("");
    setNewShowVenue("");
    setNewShowCity("");
    setNewShowNiche("local");
    setNewShowTicketLink("");
    setNewShowPrice("");
    setNewShowGenre([]);
    setNewShowDirector("");
    setNewShowDuration("");
    setNewShowTags("");
    setNewShowCast([]);
    setTempCastName("");
    setTempCastRole("");
    setNewShowProductionStatus("ongoing");
    clearPoster();
    setEditingShow(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (show: Show) => {
    setEditingShow(show);
    setNewShowTitle(show.title);
    setNewShowDescription(show.description || "");
    setNewShowDate(show.date || "");
    setNewShowVenue(show.venue || "");
    setNewShowCity(show.city || "");
    setNewShowNiche(show.niche || "local");
    setNewShowTicketLink(show.ticket_link || "");
    setNewShowPrice(show.price?.toString() || "");
    setNewShowGenre(show.genre ? show.genre.split(",").map(g => g.trim()) : []);
    setNewShowDirector(show.director || "");
    setNewShowDuration(show.duration || "");
    setNewShowTags(show.tags?.join(", ") || "");

    // Parse cast members safely
    const castData = show.cast_members && Array.isArray(show.cast_members)
      ? (show.cast_members as unknown as CastMember[])
      : [];
    setNewShowCast(castData);

    setNewShowProductionStatus(show.production_status || "ongoing");
    setPosterPreview(show.poster_url);
    setPosterFile(null);
    setShowModal(true);
  };

  const handleAddCastMember = () => {
    if (tempCastName.trim() && tempCastRole.trim()) {
      setNewShowCast([...newShowCast, { name: tempCastName.trim(), role: tempCastRole.trim() }]);
      setTempCastName("");
      setTempCastRole("");
    }
  };

  const handleRemoveCastMember = (index: number) => {
    setNewShowCast(newShowCast.filter((_, i) => i !== index));
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const errors: string[] = [];
    if (!newShowTitle) errors.push("Title");
    if (!newShowDate) errors.push("Show Date");
    if (!newShowVenue) errors.push("Venue");
    if (!newShowCity) errors.push("City");
    if (!newShowNiche) errors.push("Type (Niche)");

    if (errors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploadingPoster(true);
    let posterUrl: string | null = null;

    try {
      // Upload poster if selected
      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("show-posters")
          .upload(fileName, posterFile);

        if (uploadError) {
          throw new Error(`Failed to upload poster: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("show-posters")
          .getPublicUrl(fileName);
        
        posterUrl = publicUrl;
      }

      const { error } = await supabase
        .from("shows")
        .insert({
          producer_id: profile.id,
          title: newShowTitle,
          description: newShowDescription || null,
          date: newShowDate || null,
          venue: newShowVenue || null,
          city: newShowCity || null,
          niche: newShowNiche,
          status: "pending",
          production_status: newShowProductionStatus,
          poster_url: posterUrl,
          ticket_link: newShowTicketLink || null,
          price: newShowPrice ? parseFloat(newShowPrice) : 0,
          genre: newShowGenre.length > 0 ? newShowGenre.join(", ") : null,
          director: newShowDirector || null,
          duration: newShowDuration || null,
          tags: newShowTags ? newShowTags.split(",").map(t => t.trim()).filter(Boolean) : null,
          cast_members: newShowCast.length > 0 ? (newShowCast as unknown as Json) : null,
        });

      if (error) {
        throw new Error(`Failed to submit show: ${error.message}`);
      }

      resetForm();
      setShowModal(false);
      setSuccessModal(true);
      fetchShows();
    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to submit show. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleUpdateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !editingShow) return;

    setUploadingPoster(true);
    let posterUrl: string | null = editingShow.poster_url;

    try {
      // Upload new poster if selected
      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("show-posters")
          .upload(fileName, posterFile);

        if (uploadError) {
          throw new Error(`Failed to upload poster: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("show-posters")
          .getPublicUrl(fileName);
        
        posterUrl = publicUrl;
      }

      const { error } = await supabase
        .from("shows")
        .update({
          title: newShowTitle,
          description: newShowDescription || null,
          date: newShowDate || null,
          venue: newShowVenue || null,
          city: newShowCity || null,
          niche: newShowNiche,
          poster_url: posterUrl,
          production_status: newShowProductionStatus,
          ticket_link: newShowTicketLink || null,
          price: newShowPrice ? parseFloat(newShowPrice) : 0,
          genre: newShowGenre.length > 0 ? newShowGenre.join(", ") : null,
          director: newShowDirector || null,
          duration: newShowDuration || null,
          tags: newShowTags ? newShowTags.split(",").map(t => t.trim()).filter(Boolean) : null,
          cast_members: newShowCast.length > 0 ? (newShowCast as unknown as Json) : null,
        })
        .eq("id", editingShow.id);

      if (error) {
        throw new Error(`Failed to update show: ${error.message}`);
      }

      toast({
        title: "Success",
        description: "Show updated successfully!",
      });

      resetForm();
      setShowModal(false);
      fetchShows();
    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to update show. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingPoster(false);
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
              <div className="flex justify-between items-center">
                <h2 className="font-serif text-xl text-foreground">Your Shows</h2>
                {isTrialExpired ? (
                  <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    Add Show (Expired)
                  </Button>
                ) : (
                  profile?.role === "producer" && (
                    <RippleButton onClick={openAddModal} variant="ios">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Show
                    </RippleButton>
                  )
                )}
              </div>

              {loadingShows ? (
                <div className="text-muted-foreground text-center py-8">Loading shows...</div>
              ) : shows.length === 0 ? (
                <div className="bg-card border border-secondary/20 p-12 text-center ios-rounded">
                  <p className="text-muted-foreground mb-4">You haven't submitted any shows yet.</p>
                  {!isTrialExpired && profile?.role === "producer" && (
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
                      {shows.map((show) => (
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
                      <Select value={university} onValueChange={setUniversity}>
                        <SelectTrigger className="bg-background border-secondary/30 h-12 rounded-xl">
                          <SelectValue placeholder="Select University" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-secondary/30 rounded-xl">
                          <SelectItem value="UP">University of the Philippines (UP)</SelectItem>
                          <SelectItem value="Ateneo">Ateneo de Manila University</SelectItem>
                          <SelectItem value="DLSU">De La Salle University (DLSU)</SelectItem>
                          <SelectItem value="UST">University of Santo Tomas (UST)</SelectItem>
                          <SelectItem value="UMAK">University of Makati (UMAK)</SelectItem>
                          <SelectItem value="FEU">Far Eastern University (FEU)</SelectItem>
                        </SelectContent>
                      </Select>
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

      {tempPosterSrc && (
        <ImageCropper
          imageSrc={tempPosterSrc}
          open={cropperOpen}
          onCropComplete={onCropComplete}
          onCancel={() => {
            setCropperOpen(false);
            setTempPosterSrc(null);
          }}
          aspect={2 / 3}
        />
      )}

      {/* Add/Edit Show Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-secondary/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingShow ? "Edit Show" : "Add New Show"}
            </DialogTitle>
            <DialogDescription>
              {editingShow 
                ? "Update your show details. Changes will be saved immediately."
                : "Submit your show for review. It will be visible after admin approval."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingShow ? handleUpdateShow : handleAddShow} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="showTitle">Show Title *</Label>
              <Input
                id="showTitle"
                value={newShowTitle}
                onChange={(e) => setNewShowTitle(e.target.value)}
                placeholder="Enter show title"
                className="bg-background border-secondary/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDescription">Description</Label>
              <Textarea
                id="showDescription"
                value={newShowDescription}
                onChange={(e) => setNewShowDescription(e.target.value)}
                placeholder="Describe your show"
                className="bg-background border-secondary/30"
              />
            </div>

            {/* Location & Schedule Section */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-secondary/20">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Location & Schedule</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="showDate">Show Date</Label>
                  <Input
                    id="showDate"
                    type="date"
                    value={newShowDate}
                    onChange={(e) => setNewShowDate(e.target.value)}
                    className="bg-background border-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showCity">City</Label>
                  <Select value={newShowCity} onValueChange={setNewShowCity}>
                    <SelectTrigger className="bg-background border-secondary/30">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-secondary/30">
                      <SelectItem value="Mandaluyong">Mandaluyong</SelectItem>
                      <SelectItem value="Taguig">Taguig</SelectItem>
                      <SelectItem value="Manila">Manila</SelectItem>
                      <SelectItem value="Quezon City">Quezon City</SelectItem>
                      <SelectItem value="Makati">Makati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="showVenue">Venue</Label>
                <Input
                  id="showVenue"
                  value={newShowVenue}
                  onChange={(e) => setNewShowVenue(e.target.value)}
                  placeholder="Where will the show be held?"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showNiche">Type</Label>
                <Select value={newShowNiche} onValueChange={(val) => setNewShowNiche(val as "local" | "university")}>
                  <SelectTrigger className="bg-background border-secondary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-secondary/30">
                    <SelectItem value="local">Local/Community</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="showProductionStatus">Production Status</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Adding past productions helps build trust with new audience members and acts as a digital portfolio.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={newShowProductionStatus} onValueChange={(val) => setNewShowProductionStatus(val as "ongoing" | "completed" | "draft")}>
                  <SelectTrigger className="bg-background border-secondary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-secondary/30">
                    <SelectItem value="ongoing">Ongoing/Upcoming</SelectItem>
                    <SelectItem value="completed">Completed (Past)</SelectItem>
                    <SelectItem value="draft">Draft (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showPrice">Ticket Price (PHP)</Label>
                <Input
                  id="showPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newShowPrice}
                  onChange={(e) => setNewShowPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for free shows or external ticketing.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showTicketLink">External Ticket Link</Label>
                <Input
                  id="showTicketLink"
                  type="url"
                  value={newShowTicketLink}
                  onChange={(e) => setNewShowTicketLink(e.target.value)}
                  placeholder="https://tickets.example.com"
                  className="bg-background border-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Optional override
                </p>
              </div>
            </div>

            {/* New Fields: Genre, Director, Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showGenre">Genre</Label>
                <TagInput
                  id="showGenre"
                  tags={newShowGenre}
                  setTags={setNewShowGenre}
                  placeholder="Type genre and press Enter..."
                  suggestions={[
                    "Drama", "Comedy", "Musical", "Tragedy", "Opera",
                    "Ballet", "Improv", "Experimental", "Children's Theatre",
                    "Pantomime", "Farce", "Satire", "Historical"
                  ]}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showDuration">Duration</Label>
                <Input
                  id="showDuration"
                  value={newShowDuration}
                  onChange={(e) => setNewShowDuration(e.target.value)}
                  placeholder="e.g., 2 hours"
                  className="bg-background border-secondary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showDirector">Director</Label>
              <Input
                id="showDirector"
                value={newShowDirector}
                onChange={(e) => setNewShowDirector(e.target.value)}
                placeholder="Director name"
                className="bg-background border-secondary/30"
              />
            </div>

            <div className="space-y-4 bg-muted/10 p-4 rounded-lg border border-secondary/10">
              <div className="flex items-center justify-between">
                <Label>Cast Members</Label>
                <span className="text-xs text-muted-foreground">{newShowCast.length} added</span>
              </div>

              <div className="space-y-3">
                {/* List of added members */}
                {newShowCast.map((member, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-secondary/20">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-foreground truncate" title={member.name}>{member.name}</div>
                      <div className="text-muted-foreground border-l border-secondary/20 pl-2 truncate" title={member.role}>{member.role}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCastMember(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Input fields for new member */}
                <div className="grid grid-cols-[1fr,1fr,auto] items-end gap-2 pt-2 border-t border-secondary/10">
                  <div className="space-y-1">
                    <Label htmlFor="castName" className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      id="castName"
                      value={tempCastName}
                      onChange={(e) => setTempCastName(e.target.value)}
                      placeholder="Actor Name"
                      className="bg-background border-secondary/30 h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('castRole')?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="castRole" className="text-xs text-muted-foreground">Role</Label>
                    <Input
                      id="castRole"
                      value={tempCastRole}
                      onChange={(e) => setTempCastRole(e.target.value)}
                      placeholder="Role"
                      className="bg-background border-secondary/30 h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCastMember();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddCastMember}
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={!tempCastName.trim() || !tempCastRole.trim()}
                    title="Add Cast Member"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showTags">Tags (SEO)</Label>
              <Input
                id="showTags"
                value={newShowTags}
                onChange={(e) => setNewShowTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., Filipino, Original, Award-winning)"
                className="bg-background border-secondary/30"
              />
              <p className="text-xs text-muted-foreground">
                Tags help users find your show
              </p>
            </div>

            <div className="space-y-2">
              <Label>Show Poster</Label>
              {posterPreview ? (
                <div className="relative">
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    className="w-full max-h-64 object-contain border border-secondary/30 bg-background"
                  />
                  <button
                    type="button"
                    onClick={clearPoster}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    aria-label="Remove poster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-secondary/30 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePosterSelect}
                    className="hidden"
                  />
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Click to upload poster
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    JPG, PNG or WebP (max 5MB)
                  </p>
                </label>
              )}
            </div>

            <Button type="submit" variant="default" className="w-full" disabled={uploadingPoster}>
              {uploadingPoster ? "Saving..." : (editingShow ? "Save Changes" : "Submit Show")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="bg-card border-secondary/30 text-center">
          <div className="py-6">
            <div className="text-5xl mb-6">🎭</div>
            <DialogTitle className="font-serif text-2xl mb-4">
              Thank You! Your Submission Is Under Review
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              We've received your entry, and it is now awaiting approval from our admin team. 
              You'll be notified once your show has been reviewed.
            </DialogDescription>
            <Button onClick={() => setSuccessModal(false)} variant="outline" className="mt-6">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpsellModal open={showUpsellModal} onOpenChange={setShowUpsellModal} />
    </div>
  );
};

export default Dashboard;
