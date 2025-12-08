import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LayoutDashboard, LogOut, Menu, X, Check, XCircle, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo.png";

interface Show {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  city: string | null;
  niche: "local" | "university" | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  producer_id: string;
  profiles?: {
    group_name: string | null;
  };
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (profile && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [user, profile, isAdmin, loading, navigate]);

  // Fetch all shows for admin
  const fetchShows = async () => {
    setLoadingShows(true);
    
    let query = supabase
      .from("shows")
      .select(`
        *,
        profiles:producer_id (
          group_name
        )
      `)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching shows:", error);
      toast({
        title: "Error",
        description: "Failed to load shows. Please try again.",
        variant: "destructive",
      });
    } else {
      setShows(data as Show[]);
    }
    setLoadingShows(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchShows();
    }
  }, [isAdmin, filterStatus]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const sendNotification = async (showId: string, showTitle: string, status: "approved" | "rejected", producerId: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-show-notification", {
        body: { showId, showTitle, status, producerId },
      });
      if (error) {
        console.error("Failed to send notification:", error);
      } else {
        console.log("Notification sent successfully");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  const handleApprove = async (showId: string, showTitle: string, producerId: string) => {
    const { error } = await supabase
      .from("shows")
      .update({ status: "approved" })
      .eq("id", showId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve show.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Show Approved",
        description: "The show is now visible on the public feed.",
      });
      sendNotification(showId, showTitle, "approved", producerId);
      fetchShows();
    }
  };

  const handleReject = async (showId: string, showTitle: string, producerId: string) => {
    const { error } = await supabase
      .from("shows")
      .update({ status: "rejected" })
      .eq("id", showId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject show.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Show Rejected",
        description: "The producer will be notified.",
      });
      sendNotification(showId, showTitle, "rejected", producerId);
      fetchShows();
    }
  };

  const openDetails = (show: Show) => {
    setSelectedShow(show);
    setDetailsModal(true);
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
    return status.toUpperCase();
  };

  const getNicheLabel = (niche: string | null) => {
    switch (niche) {
      case "local":
        return "Local/Community";
      case "university":
        return "University";
      default:
        return "—";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-sidebar-accent text-sidebar-accent-foreground">
              <LayoutDashboard className="w-5 h-5" />
              {sidebarOpen && <span>Admin Panel</span>}
            </div>
          </nav>

          {/* Admin badge */}
          {sidebarOpen && (
            <div className="px-4 py-2">
              <div className="bg-primary/20 border border-primary/30 px-3 py-2 text-center">
                <span className="text-xs text-primary uppercase tracking-wider">Admin Access</span>
              </div>
            </div>
          )}

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
          <h1 className="font-serif text-xl text-foreground">Show Approvals</h1>
          <div className="w-10" />
        </header>

        <div className="p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <button
                onClick={() => setFilterStatus("all")}
                className={`bg-card border p-4 text-left transition-all ${
                  filterStatus === "all" ? "border-secondary" : "border-secondary/20 hover:border-secondary/50"
                }`}
              >
                <p className="text-muted-foreground text-sm mb-1">All Shows</p>
                <p className="text-2xl font-serif text-foreground">{shows.length}</p>
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`bg-card border p-4 text-left transition-all ${
                  filterStatus === "pending" ? "border-yellow-500" : "border-secondary/20 hover:border-yellow-500/50"
                }`}
              >
                <p className="text-muted-foreground text-sm mb-1">Pending</p>
                <p className="text-2xl font-serif text-yellow-500">
                  {filterStatus === "all" ? shows.filter(s => s.status === "pending").length : (filterStatus === "pending" ? shows.length : "—")}
                </p>
              </button>
              <button
                onClick={() => setFilterStatus("approved")}
                className={`bg-card border p-4 text-left transition-all ${
                  filterStatus === "approved" ? "border-green-500" : "border-secondary/20 hover:border-green-500/50"
                }`}
              >
                <p className="text-muted-foreground text-sm mb-1">Approved</p>
                <p className="text-2xl font-serif text-green-500">
                  {filterStatus === "all" ? shows.filter(s => s.status === "approved").length : (filterStatus === "approved" ? shows.length : "—")}
                </p>
              </button>
              <button
                onClick={() => setFilterStatus("rejected")}
                className={`bg-card border p-4 text-left transition-all ${
                  filterStatus === "rejected" ? "border-red-500" : "border-secondary/20 hover:border-red-500/50"
                }`}
              >
                <p className="text-muted-foreground text-sm mb-1">Rejected</p>
                <p className="text-2xl font-serif text-red-500">
                  {filterStatus === "all" ? shows.filter(s => s.status === "rejected").length : (filterStatus === "rejected" ? shows.length : "—")}
                </p>
              </button>
            </div>

            {/* Shows Table */}
            {loadingShows ? (
              <div className="text-muted-foreground text-center py-8">Loading shows...</div>
            ) : shows.length === 0 ? (
              <div className="bg-card border border-secondary/20 p-12 text-center">
                <p className="text-muted-foreground">
                  {filterStatus === "pending" 
                    ? "No pending shows to review." 
                    : `No ${filterStatus === "all" ? "" : filterStatus} shows found.`}
                </p>
              </div>
            ) : (
              <div className="bg-card border border-secondary/20 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Title</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Theater Group</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Type</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Date</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-muted-foreground text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.map((show) => (
                      <tr key={show.id} className="border-t border-secondary/10">
                        <td className="p-4 text-foreground font-medium">{show.title}</td>
                        <td className="p-4 text-muted-foreground">
                          {show.profiles?.group_name || "Unknown Group"}
                        </td>
                        <td className="p-4 text-muted-foreground">{getNicheLabel(show.niche)}</td>
                        <td className="p-4 text-muted-foreground">
                          {show.date ? new Date(show.date).toLocaleDateString() : "TBD"}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs border ${getStatusColor(show.status)}`}>
                            {getStatusLabel(show.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetails(show)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {show.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(show.id, show.title, show.producer_id)}
                                  className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(show.id, show.title, show.producer_id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {show.status !== "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  supabase
                                    .from("shows")
                                    .update({ status: "pending" })
                                    .eq("id", show.id)
                                    .then(() => fetchShows());
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Details Modal */}
      <Dialog open={detailsModal} onOpenChange={setDetailsModal}>
        <DialogContent className="bg-card border-secondary/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{selectedShow?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedShow?.profiles?.group_name || "Unknown Group"}
            </DialogDescription>
          </DialogHeader>
          {selectedShow && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className={`px-2 py-1 text-xs border ${getStatusColor(selectedShow.status)}`}>
                    {getStatusLabel(selectedShow.status)}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="text-foreground">{getNicheLabel(selectedShow.niche)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="text-foreground">
                    {selectedShow.date ? new Date(selectedShow.date).toLocaleDateString() : "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">City</p>
                  <p className="text-foreground">{selectedShow.city || "Not specified"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-1">Venue</p>
                <p className="text-foreground">{selectedShow.venue || "Not specified"}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-foreground">{selectedShow.description || "No description provided."}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Submitted</p>
                <p className="text-foreground">
                  {new Date(selectedShow.created_at).toLocaleString()}
                </p>
              </div>

              {selectedShow.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-secondary/20">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleApprove(selectedShow.id, selectedShow.title, selectedShow.producer_id);
                      setDetailsModal(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedShow.id, selectedShow.title, selectedShow.producer_id);
                      setDetailsModal(false);
                    }}
                    className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
