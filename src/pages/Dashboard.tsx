import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/ui/ripple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingInput, FloatingTextarea } from "@/components/ui/floating-input";
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
import { Plus, X, Trash2, Pencil, ArrowLeft, User, LayoutDashboard } from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { TourGuide } from "@/components/onboarding/TourGuide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GroupMembers } from "@/components/dashboard/GroupMembers";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { schools } from "@/data/schools";
import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { Show } from "@/types/dashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "shows" | "profile" | "members">("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [showFilter, setShowFilter] = useState<'ongoing' | 'archived'>('ongoing');
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [showIdToDelete, setShowIdToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load shows
  const { data: shows = [], refetch: fetchShows } = useQuery({
    queryKey: ['producer-shows', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase.from("shows").select("*").eq("producer_id", profile.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!profile,
  });

  // Deep linking for "Edit" buttons on the feed
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && shows.length > 0 && !showModal) {
      const showToEdit = shows.find(s => s.id === editId);
      if (showToEdit) {
        setEditingShow(showToEdit);
        setShowModal(true);
        setActiveTab("shows");
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("edit");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, shows, showModal]);

  const handleDeleteShow = (showId: string) => {
    setShowIdToDelete(showId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteShow = async () => {
    if (!showIdToDelete) return;
    await supabase.from("shows").update({ status: 'archived', deleted_at: new Date().toISOString() }).eq("id", showIdToDelete);
    await queryClient.invalidateQueries({ queryKey: ['producer-shows'] });
    setDeleteAlertOpen(false);
    toast({ title: "Archived", description: "Show moved to 30-day recycle bin." });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><BrandedLoader /></div>;

  return (
    <div className="min-h-screen bg-background flex">
      <TourGuide run={runTour} setRun={setRunTour} onFinish={handleTourFinish} />
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={signOut} isPro={true} />
      
      <main className="flex-1 p-6">
        {/* Tab Logic and Show List Table goes here using filteredShows... */}
        {/* ... (Your existing UI code for Stats and Table) */}
      </main>

      <ProductionModal 
        open={showModal} 
        onOpenChange={setShowModal} 
        showToEdit={editingShow} 
        onSuccess={() => fetchShows()} 
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[16px] bg-card border-secondary/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Production?</AlertDialogTitle>
            <AlertDialogDescription>This moves the show to the recycle bin for 30 days.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteShow} className="bg-destructive text-white hover:bg-destructive/90">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;