import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { 
  Plus, Menu, X, Upload, Image, Trash2, Pencil, 
  ArrowLeft, HelpCircle, User, LayoutDashboard, 
  Theater, Users, Settings 
} from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { schools } from "@/data/schools";

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
  status: "pending" | "approved" | "rejected" | "archived";
  production_status: "ongoing" | "completed" | "draft";
  created_at: string;
  deleted_at?: string | null;
  genre: string | null;
  director: string | null;
  duration: string | null;
  tags: string[] | null;
  cast_members: CastMember[] | null;
  price: number | null;
  is_featured?: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile" | "members">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [showFilter, setShowFilter] = useState<'ongoing' | 'archived'>('ongoing');
  const queryClient = useQueryClient();

  // Optimized Fetching: Fetches everything once, then UI filters it
  const { data: shows = [], isLoading: loadingShows, refetch: fetchShows } = useQuery({
    queryKey: ['producer-shows', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("producer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Show[];
    },
    enabled: !!profile,
  });

  // Filter shows locally for snappy tab switching
  const filteredShows = useMemo(() => {
    return shows.filter(s => showFilter === 'ongoing' ? s.status !== 'archived' : s.status === 'archived');
  }, [shows, showFilter]);

  // Form states
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

  // Profile states
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [niche, setNiche] = useState<"local" | "university" | "">("");
  const [university, setUniversity] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // Auth Protection Logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (profile && profile.role !== "producer") {
        navigate("/");
      }
    }
  }, [user, profile, loading, navigate]);

  // Load profile data once
  useEffect(() => {
    if (profile) {
      setGroupName(profile.group_name || "");
      setDescription(profile.description || "");
      setFoundedYear(profile.founded_year?.toString() || "");
      setNiche(profile.niche || "");
      setUniversity(profile.university || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  // Tour Logic
  useEffect(() => {
    if (profile && !profile.has_completed_tour) {
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleTourFinish = async () => {
    if (!profile) return;
    await supabase.from("profiles").update({ has_completed_tour: true }).eq("id", profile.id);
    refreshProfile();
  };

  // Logic: Soft Delete (Archive)
  const handleDeleteShow = async (showId: string) => {
    if (!confirm("Move to archive? You can retrieve this for 30 days.")) return;

    // Optimistic UI Update
    queryClient.setQueryData(['producer-shows', profile?.id], (old: Show[] | undefined) => {
      return old?.map(s => s.id === showId ? { ...s, status: 'archived', deleted_at: new Date().toISOString() } : s);
    });

    const { error } = await supabase
      .from("shows")
      .update({ status: 'archived', deleted_at: new Date().toISOString() })
      .eq("id", showId);

    if (error) {
      toast({ title: "Error", description: "Failed to archive.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ['producer-shows'] });
    } else {
      toast({ title: "Archived", description: "Show moved to recycle bin." });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const resetForm = () => {
    setNewShowTitle("");
    setNewShowDescription("");
    setNewShowDate("");
    setNewShowVenue("");
    setNewShowCity("");
    setNewShowNiche("local");
    setPosterFile(null);
    setPosterPreview(null);
    setEditingShow(null);
    setNewShowCast([]);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setUploadingPoster(true);

    let posterUrl = null;
    if (posterFile) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage.from("show-posters").upload(fileName, posterFile);
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from("show-posters").getPublicUrl(fileName);
        posterUrl = publicUrl;
      }
    }

    const { error } = await supabase.from("shows").insert({
      producer_id: profile.id,
      title: newShowTitle,
      description: newShowDescription,
      date: newShowDate,
      venue: newShowVenue,
      city: newShowCity,
      niche: newShowNiche,
      poster_url: posterUrl,
      status: "pending",
      production_status: newShowProductionStatus,
      cast_members: newShowCast as unknown as Json,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowModal(false);
      setSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ['producer-shows'] });
    }
    setUploadingPoster(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <BrandedLoader size="lg" text="Authenticating..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <TourGuide run={runTour} setRun={setRunTour} onFinish={handleTourFinish} />
      
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        handleLogout={handleLogout} 
        isPro={true} // Forcing true to bypass paywalls
      />

      <main className="flex-1 min-h-screen">
        <header className="border-b border-secondary/10 p-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-4">
             <Link to="/feed" className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
             </Link>
          </div>
          <h1 className="font-serif text-xl capitalize">{activeTab}</h1>
          <div className="w-10" />
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Main Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border p-6 ios-rounded">
                  <p className="text-muted-foreground text-sm">Active Productions</p>
                  <p className="text-3xl font-serif">{shows.filter(s => s.status !== 'archived').length}</p>
                </div>
                <div className="bg-card border p-6 ios-rounded">
                  <p className="text-muted-foreground text-sm">Archived</p>
                  <p className="text-3xl font-serif text-muted-foreground">{shows.filter(s => s.status === 'archived').length}</p>
                </div>
                <div className="bg-card border p-6 ios-rounded flex items-end justify-between">
                   <Button onClick={openAddModal} variant="default" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> New Production
                   </Button>
                </div>
              </div>
              <AnalyticsDashboard profileId={profile?.id || ""} isPro={true} />
            </div>
          )}

          {/* Productions List Tab */}
          {activeTab === "shows" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex bg-muted p-1 rounded-lg">
                  <button 
                    onClick={() => setShowFilter('ongoing')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-all ${showFilter === 'ongoing' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Ongoing
                  </button>
                  <button 
                    onClick={() => setShowFilter('archived')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-all ${showFilter === 'archived' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Archived (30 days)
                  </button>
                </div>
              </div>

              <div className="border rounded-xl bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4">Title</th>
                      <th className="text-left p-4">Venue</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShows.length === 0 ? (
                      <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No productions found here.</td></tr>
                    ) : (
                      filteredShows.map(show => (
                        <tr key={show.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{show.title}</td>
                          <td className="p-4 text-muted-foreground">{show.venue || "TBD"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              show.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'
                            }`}>
                              {show.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {showFilter === 'ongoing' && (
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {}}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteShow(show.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-card border p-8 ios-rounded space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden relative group">
                    {avatarPreview ? <img src={avatarPreview} className="h-full w-full object-cover" /> : <User className="text-muted-foreground" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-serif">Group Identity</h3>
                    <p className="text-sm text-muted-foreground">This is how audiences will see your theater group.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FloatingInput label="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                  <FloatingTextarea label="Bio/Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">University Affiliation</Label>
                    <SearchableSelect 
                      options={schools} 
                      value={university} 
                      onChange={setUniversity} 
                      placeholder="Select University (Metro Manila)" 
                    />
                  </div>

                  <Button className="w-full" onClick={() => {}} disabled={uploadingProfile}>Save Profile Changes</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Production</DialogTitle></DialogHeader>
          <form onSubmit={handleAddShow} className="space-y-6 pt-4">
             <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input required value={newShowTitle} onChange={e => setNewShowTitle(e.target.value)} placeholder="Hamlet, The Musical, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Opening Date</Label>
                  <Input type="date" value={newShowDate} onChange={e => setNewShowDate(e.target.value)} />
                </div>
             </div>
             
             <div className="space-y-2">
               <Label>Venue Name</Label>
               <Input value={newShowVenue} onChange={e => setNewShowVenue(e.target.value)} placeholder="Glebe House, Henry Sy Hall, etc." />
             </div>

             <div className="space-y-2">
               <Label>Poster Image</Label>
               <label className="border-2 border-dashed p-12 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPosterFile(file);
                      setPosterPreview(URL.createObjectURL(file));
                    }
                  }} />
                  {posterPreview ? (
                    <img src={posterPreview} className="max-h-48 rounded shadow-md" />
                  ) : (
                    <>
                      <Upload className="text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload Show Poster (2:3 Aspect)</span>
                    </>
                  )}
               </label>
             </div>

             <Button type="submit" className="w-full" disabled={uploadingPoster}>
                {uploadingPoster ? "Uploading..." : "Publish Production"}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="text-center">
          <div className="text-4xl mb-4">🎭</div>
          <DialogTitle>Show Submitted!</DialogTitle>
          <DialogDescription>Your production is now pending review. It will appear on the feed once approved by an admin.</DialogDescription>
          <Button onClick={() => setSuccessModal(false)} className="mt-4">Back to Dashboard</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;