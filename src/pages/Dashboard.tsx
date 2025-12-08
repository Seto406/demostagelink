import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { LayoutDashboard, Film, User, Plus, LogOut, Menu, X, Upload, Image, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo-new.png";

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
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);

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

  // Profile form states
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [niche, setNiche] = useState<"local" | "university" | "">("");

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

  // Load profile data
  useEffect(() => {
    if (profile) {
      setGroupName(profile.group_name || "");
      setDescription(profile.description || "");
      setFoundedYear(profile.founded_year?.toString() || "");
      setNiche(profile.niche || "");
    }
  }, [profile]);

  // Fetch shows
  const fetchShows = async () => {
    if (!profile) return;
    
    setLoadingShows(true);
    const { data, error } = await supabase
      .from("shows")
      .select("*")
      .eq("producer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shows:", error);
    } else {
      setShows(data as Show[]);
    }
    setLoadingShows(false);
  };

  useEffect(() => {
    if (profile) {
      fetchShows();
    }
  }, [profile]);

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

    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
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
    setPosterPreview(show.poster_url);
    setPosterFile(null);
    setShowModal(true);
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setUploadingPoster(true);
    let posterUrl: string | null = null;

    try {
      // Upload poster if selected
      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("posters")
          .upload(fileName, posterFile);

        if (uploadError) {
          throw new Error("Failed to upload poster");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("posters")
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
          poster_url: posterUrl,
          ticket_link: newShowTicketLink || null
        });

      if (error) {
        throw new Error("Failed to submit show");
      }

      resetForm();
      setShowModal(false);
      setSuccessModal(true);
      fetchShows();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit show. Please try again.",
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
          .from("posters")
          .upload(fileName, posterFile);

        if (uploadError) {
          throw new Error("Failed to upload poster");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("posters")
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
          ticket_link: newShowTicketLink || null
        })
        .eq("id", editingShow.id);

      if (error) {
        throw new Error("Failed to update show");
      }

      toast({
        title: "Success",
        description: "Show updated successfully!",
      });

      resetForm();
      setShowModal(false);
      fetchShows();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update show. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        group_name: groupName || null,
        description: description || null,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        niche: niche || null
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      refreshProfile();
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3">
              <img src={stageLinkLogo} alt="StageLink" className="h-10 w-auto" />
              {sidebarOpen && (
                <span className="text-lg font-serif font-bold text-sidebar-foreground">
                  Stage<span className="text-sidebar-accent">Link</span>
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "dashboard"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab("shows")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "shows"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <Film className="w-5 h-5" />
              {sidebarOpen && <span>My Shows</span>}
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "profile"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <User className="w-5 h-5" />
              {sidebarOpen && <span>Profile</span>}
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="border-b border-secondary/10 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-serif text-xl text-foreground">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "shows" && "My Shows"}
            {activeTab === "profile" && "Group Profile"}
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
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border border-secondary/20 p-6">
                  <p className="text-muted-foreground text-sm mb-2">Total Shows</p>
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

              <div className="bg-card border border-secondary/20 p-6">
                <h2 className="font-serif text-xl text-foreground mb-4">Quick Actions</h2>
                <Button onClick={openAddModal} variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Show
                </Button>
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
                <Button onClick={openAddModal} variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Show
                </Button>
              </div>

              {loadingShows ? (
                <div className="text-muted-foreground text-center py-8">Loading shows...</div>
              ) : shows.length === 0 ? (
                <div className="bg-card border border-secondary/20 p-12 text-center">
                  <p className="text-muted-foreground mb-4">You haven't submitted any shows yet.</p>
                  <Button onClick={openAddModal} variant="outline">
                    Submit Your First Show
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-secondary/20 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Title</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Date</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Status</th>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(show)}
                              className="h-8 w-8 p-0"
                              title="Edit Show"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
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
              className="max-w-2xl space-y-6"
            >
              <div className="bg-card border border-secondary/20 p-6">
                <h2 className="font-serif text-xl text-foreground mb-6">Group Information</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-background border-secondary/30"
                      placeholder="Enter your theater group name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-background border-secondary/30 min-h-24"
                      placeholder="Tell us about your theater group"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                      className="bg-background border-secondary/30"
                      placeholder="e.g., 1995"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche</Label>
                    <Select value={niche} onValueChange={(val) => setNiche(val as "local" | "university")}>
                      <SelectTrigger className="bg-background border-secondary/30">
                        <SelectValue placeholder="Select your group type" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-secondary/30">
                        <SelectItem value="local">Local/Community-based</SelectItem>
                        <SelectItem value="university">University Theater Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Map Screenshot (Optional)</Label>
                    <div className="border-2 border-dashed border-secondary/30 p-8 text-center cursor-pointer hover:border-secondary/50 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Click or drag to upload your venue map
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleUpdateProfile} variant="hero">
                    Save Profile
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

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
              <Label htmlFor="showTicketLink">Ticket Link</Label>
              <Input
                id="showTicketLink"
                type="url"
                value={newShowTicketLink}
                onChange={(e) => setNewShowTicketLink(e.target.value)}
                placeholder="https://tickets.example.com/your-show"
                className="bg-background border-secondary/30"
              />
              <p className="text-xs text-muted-foreground">
                Link to your ticket sales page (optional)
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
    </div>
  );
};

export default Dashboard;
