import { useState, useEffect, useCallback, useRef } from "react";
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
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  Check, 
  XCircle, 
  Eye, 
  EyeOff,
  Users, 
  Theater, 
  UserCheck,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Home,
  Megaphone,
  CheckCircle,
  Mail,
  ExternalLink,
  Settings,
  CreditCard
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InvitationHub } from "@/components/admin/InvitationHub";
import { PaymentSettings } from "@/components/admin/PaymentSettings";
import { PaymentApprovals } from "@/components/admin/PaymentApprovals";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  poster_url: string | null;
  deleted_at: string | null;
  profiles?: {
    group_name: string | null;
  };
}

interface UserProfile {
  id: string | null;
  user_id: string;
  email?: string;
  role: "audience" | "producer" | "admin";
  group_name: string | null;
  created_at: string;
}

interface ProducerRequest {
  id: string;
  user_id: string;
  group_name: string;
  portfolio_link: string;
  status: string;
  created_at: string;
  profiles?: {
    avatar_url: string | null;
    map_screenshot_url: string | null;
  } | null;
}

interface Stats {
  totalUsers: number;
  totalShows: number;
  activeProducers: number;
  pendingRequests: number;
  deletedShows: number;
  pendingShows: number;
  approvedShows: number;
  rejectedShows: number;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "deleted";

const ITEMS_PER_PAGE = 10;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject" | "broadcast"; show: Show } | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [producerRequests, setProducerRequests] = useState<ProducerRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalShows: 0,
    activeProducers: 0,
    pendingRequests: 0,
    deletedShows: 0,
    pendingShows: 0,
    approvedShows: 0,
    rejectedShows: 0
  });
  const [activeTab, setActiveTab] = useState("shows");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [currentShowsPage, setCurrentShowsPage] = useState(1);
  const [totalShowsCount, setTotalShowsCount] = useState(0);

  // Delete user state
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [adminSecurityKey, setAdminSecurityKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Try to use RPC for performance optimization (single request vs 8 parallel requests)
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats');

      if (!statsError && statsData) {
        // Map snake_case to camelCase and fill missing fields with defaults
        const mappedStats: Stats = {
          totalUsers: statsData.total_users || 0,
          totalShows: 0, // Not returned by RPC yet?
          activeProducers: 0,
          pendingRequests: statsData.pending_approvals || 0,
          activeShows: statsData.active_shows || 0,
          totalRevenue: statsData.total_revenue || 0,
          deletedShows: 0,
          pendingShows: 0,
          approvedShows: 0,
          rejectedShows: 0
        } as unknown as Stats;

        // Since the RPC might not return everything yet, we might want to still do parallel fetch if data is incomplete
        // But for now let's just use what we have and maybe fetch others?
        // Actually the RPC seems to return a subset.
        // Let's just fallback to parallel fetch if RPC is not comprehensive enough or update Stats type.
        // For now, I will comment out the RPC usage to rely on parallel fetch which works for all fields.
        // setStats(mappedStats);
        // return;
      }

      if (statsError) {
        console.warn("RPC fetch failed, falling back to parallel requests:", statsError);
      }

      // Fallback: Fetch all stats in parallel
      const [usersRes, showsRes, producersRes, requestsRes, deletedRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("shows").select("id", { count: "exact" }).is("deleted_at", null),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "producer"),
        supabase.from("producer_requests").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("shows").select("id", { count: "exact" }).not("deleted_at", "is", null),
        supabase.from("shows").select("id", { count: "exact" }).eq("status", "pending").is("deleted_at", null),
        supabase.from("shows").select("id", { count: "exact" }).eq("status", "approved").is("deleted_at", null),
        supabase.from("shows").select("id", { count: "exact" }).eq("status", "rejected").is("deleted_at", null),
      ]);

      if (!mounted.current) return;

      setStats({
        totalUsers: usersRes.count || 0,
        totalShows: showsRes.count || 0,
        activeProducers: producersRes.count || 0,
        pendingRequests: requestsRes.count || 0,
        deletedShows: deletedRes.count || 0,
        pendingShows: pendingRes.count || 0,
        approvedShows: approvedRes.count || 0,
        rejectedShows: rejectedRes.count || 0,
      });
    } catch (error) {
      if (!mounted.current) return;
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    }
  }, []);

  // Fetch all shows for admin
  const fetchShows = useCallback(async () => {
    setLoadingShows(true);

    const start = (currentShowsPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;
    
    let query = supabase
      .from("shows")
      .select(`
        id,
        title,
        description,
        date,
        venue,
        city,
        niche,
        status,
        created_at,
        producer_id,
        poster_url,
        deleted_at,
        profiles:producer_id (
          group_name
        )
      `, { count: "exact" });

    // Handle deleted filter differently
    if (filterStatus === "deleted") {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
    }

    // Apply sorting and pagination last
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    if (!mounted.current) return;

    if (error) {
      console.error("Error fetching shows:", error);
      toast({
        title: "Error",
        description: "Failed to load shows. Please try again.",
        variant: "destructive",
      });
    } else {
      setShows(data as Show[]);
      if (count !== null) setTotalShowsCount(count);
    }
    setLoadingShows(false);
  }, [filterStatus, currentShowsPage]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const { data, error } = await supabase.rpc('get_admin_user_list', {
        page_number: currentPage,
        page_size: ITEMS_PER_PAGE
      });

      if (error) throw error;

      // Parse the response from RPC (JSON)
      // The RPC returns { users: [...], total_count: number }
      const result = data as unknown as { users: UserProfile[], total_count: number };

      if (!mounted.current) return;

      if (result && result.users) {
        setUsers(result.users);
        setTotalUserCount(Number(result.total_count));
      } else {
        setUsers([]);
        setTotalUserCount(0);
      }
    } catch (error) {
      if (!mounted.current) return;
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      if (mounted.current) setLoadingUsers(false);
    }
  }, [currentPage]);

  // Fetch producer requests
  const fetchProducerRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("producer_requests")
      .select(`
        *,
        profiles:user_id (
          avatar_url,
          map_screenshot_url
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!mounted.current) return;
    if (error) {
      console.error("Error fetching producer requests:", error);
    } else {
      setProducerRequests(data as unknown as ProducerRequest[]);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchShows();
      fetchProducerRequests();
      fetchStats();
    }
  }, [isAdmin, filterStatus, fetchShows, fetchProducerRequests, fetchStats]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, currentPage, fetchUsers]);

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
        description: "Failed to approve production.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Production Approved",
        description: "The production is now visible on the public feed.",
      });

      // Update local state immediately
      setShows(prev => {
        if (filterStatus === "pending") {
          return prev.filter(s => s.id !== showId);
        }
        return prev.map(s => s.id === showId ? { ...s, status: "approved" } : s);
      });

      sendNotification(showId, showTitle, "approved", producerId);
      fetchStats();
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
        description: "Failed to reject production.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Production Rejected",
        description: "The producer will be notified.",
      });

      // Update local state immediately
      setShows(prev => {
        if (filterStatus === "pending") {
          return prev.filter(s => s.id !== showId);
        }
        return prev.map(s => s.id === showId ? { ...s, status: "rejected" } : s);
      });

      sendNotification(showId, showTitle, "rejected", producerId);
      fetchStats();
    }
  };

  const handleBroadcast = async (showId: string) => {
    setBroadcastLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("broadcast-new-show", {
        body: { showId },
      });

      if (error) throw error;

      toast({
        title: "Broadcast Sent",
        description: `Notification sent to audience members.`,
      });
    } catch (error) {
      console.error("Broadcast failed:", error);
      toast({
        title: "Broadcast Failed",
        description: "Failed to broadcast notification.",
        variant: "destructive",
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string, groupName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "producer", group_name: groupName })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to promote user.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "User Promoted",
        description: "User is now a Producer.",
      });
      fetchUsers();
      fetchStats();
    }
  };

  const handleDemoteUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "audience", group_name: null })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to demote user.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "User Demoted",
        description: "User is now an Audience member.",
      });
      fetchUsers();
      fetchStats();
    }
  };

  const handleApproveRequest = async (request: ProducerRequest) => {
    // Update user role to producer
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "producer", group_name: request.group_name })
      .eq("user_id", request.user_id);

    if (profileError) {
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive",
      });
      return;
    }

    // Update request status
    const { error: requestError } = await supabase
      .from("producer_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", request.id);

    if (requestError) {
      console.error("Error updating request:", requestError);
    } else {
      // Send email
      const { error: emailError } = await supabase.functions.invoke("send-producer-status-email", {
        body: {
          user_id: request.user_id,
          status: "approved",
          group_name: request.group_name,
        },
      });

      if (emailError) {
        console.error("Failed to send approval email:", emailError);
        toast({
          title: "Email Delivery Failed",
          description: "Producer approved, but email notification failed.",
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Request Approved",
      description: `${request.group_name} is now a Producer.`,
    });

    // Update local state immediately
    setProducerRequests(prev => prev.filter(r => r.id !== request.id));

    fetchUsers();
    fetchStats();
  };

  const handleRejectRequest = async (request: ProducerRequest) => {
    const { error } = await supabase
      .from("producer_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", request.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    } else {
      // Send email
      const { error: emailError } = await supabase.functions.invoke("send-producer-status-email", {
        body: {
          user_id: request.user_id,
          status: "rejected",
          group_name: request.group_name,
        },
      });

      if (emailError) {
        console.error("Failed to send rejection email:", emailError);
        toast({
          title: "Email Delivery Failed",
          description: "Request rejected, but email notification failed.",
          variant: "destructive",
        });
      }

      toast({
        title: "Request Rejected",
        description: "The user has been notified.",
      });

      // Update local state immediately
      setProducerRequests(prev => prev.filter(r => r.id !== request.id));

      fetchStats();
    }
  };

  // Soft delete show
  const handleSoftDeleteShow = async (showId: string) => {
    const { error } = await supabase
      .from("shows")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", showId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete production.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Production Deleted",
        description: "Production has been moved to trash. You can restore it later.",
      });
      fetchShows();
      fetchStats();
    }
  };

  // Restore soft-deleted show
  const handleRestoreShow = async (showId: string) => {
    const { error } = await supabase
      .from("shows")
      .update({ deleted_at: null })
      .eq("id", showId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to restore production.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Production Restored",
        description: "Production has been restored successfully.",
      });
      fetchShows();
      fetchStats();
    }
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentShowsPage(1);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      case "producer":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  // Force delete user function
  // Force redeploy: Clean build cache trigger
  const handleForceDeleteUser = async () => {
    const validKey = import.meta.env.VITE_ADMIN_ACTION_KEY;

    if (!validKey || adminSecurityKey.trim() !== validKey.trim()) {
      toast({
        title: "Invalid Security Key",
        description: "The provided security key is incorrect.",
        variant: "destructive",
      });
      return;
    }

    if (!userToDelete) return;

    try {
      // Delete user's shows first
      if (userToDelete.id) {
        const { error: showsError } = await supabase
          .from("shows")
          .delete()
          .eq("producer_id", userToDelete.id);

        if (showsError) console.error("Error deleting user shows:", showsError);
      }

      // Delete user's producer requests
      const { error: requestsError } = await supabase
        .from("producer_requests")
        .delete()
        .eq("user_id", userToDelete.user_id);

      if (requestsError) console.error("Error deleting user requests:", requestsError);

      // Call Edge Function to delete user from Auth (which cascades to profile)
      const { error: deleteUserError } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userToDelete.user_id },
      });

      if (deleteUserError) throw deleteUserError;

      toast({
        title: "User Deleted",
        description: "User has been removed from Auth and all associated data deleted.",
      });
      
      setDeleteUserModal(false);
      setUserToDelete(null);
      setAdminSecurityKey("");
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Check console for details.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Deployment sync check: verifying latest admin key logic
  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={stageLinkLogo} alt="StageLink" className="h-10 w-auto" />
              {sidebarOpen && (
                <span className="text-lg font-sans font-bold tracking-tight text-sidebar-foreground">
                  Stage<span className="text-sidebar-accent">Link</span>
                </span>
              )}
            </Link>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("shows")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "shows" 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {sidebarOpen && <span>Show Approvals</span>}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "users" 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span>User Management</span>}
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "payments"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              {sidebarOpen && <span>Payment Approvals</span>}
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "invitations"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Mail className="w-5 h-5" />
              {sidebarOpen && <span>Invitations</span>}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === "settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span>Payment Settings</span>}
            </button>
          </nav>

          {/* Admin badge */}
          {sidebarOpen && (
            <div className="px-4 py-2">
              <div className="bg-primary/20 border border-primary/30 px-3 py-2 text-center rounded-lg">
                <span className="text-xs text-primary uppercase tracking-wider">Admin Access</span>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
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
          <div className="flex items-center gap-2">
            <Link to="/feed">
              <button className="p-2 hover:bg-muted transition-colors rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Home">
                <Home className="w-5 h-5" />
              </button>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted transition-colors rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl text-foreground">
              {activeTab === "shows" ? "Show Approvals" : activeTab === "users" ? "User Management" : activeTab === "payments" ? "Payment Approvals" : activeTab === "settings" ? "Payment Settings" : "Invitations"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchStats();
                if (activeTab === "shows") fetchShows();
                else if (activeTab === "users") fetchUsers();
                fetchProducerRequests();
              }}
              className="h-8 px-2 text-muted-foreground hover:text-foreground border-secondary/20"
              title="Refresh Data"
            >
              <RotateCcw className={`w-4 h-4 ${loadingShows || loadingUsers ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="w-10" />
        </header>

        <div className="p-6">
          {/* Stats Widget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card/50 backdrop-blur-sm border border-secondary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Users</p>
                  <p className="text-xl font-semibold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-secondary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Theater className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Productions</p>
                  <p className="text-xl font-semibold text-foreground">{stats.totalShows}</p>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-secondary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Active Producers</p>
                  <p className="text-xl font-semibold text-foreground">{stats.activeProducers}</p>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-secondary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending Requests</p>
                  <p className="text-xl font-semibold text-foreground">{stats.pendingRequests}</p>
                </div>
              </div>
            </div>
          </div>

          {activeTab === "settings" ? (
            <PaymentSettings />
          ) : activeTab === "payments" ? (
            <PaymentApprovals />
          ) : activeTab === "invitations" ? (
            <InvitationHub />
          ) : activeTab === "shows" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Show Filter Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`bg-card border p-4 text-left transition-all rounded-xl ${
                    filterStatus === "all" ? "border-secondary" : "border-secondary/20 hover:border-secondary/50"
                  }`}
                >
                  <p className="text-muted-foreground text-sm mb-1">All Productions</p>
                  <p className="text-2xl font-serif text-foreground">{stats.totalShows}</p>
                </button>
                <button
                  onClick={() => handleFilterChange("pending")}
                  className={`bg-card border p-4 text-left transition-all rounded-xl ${
                    filterStatus === "pending" ? "border-yellow-500" : "border-secondary/20 hover:border-yellow-500/50"
                  }`}
                >
                  <p className="text-muted-foreground text-sm mb-1">Pending</p>
                  <p className="text-2xl font-serif text-yellow-500">{stats.pendingShows}</p>
                </button>
                <button
                  onClick={() => handleFilterChange("approved")}
                  className={`bg-card border p-4 text-left transition-all rounded-xl ${
                    filterStatus === "approved" ? "border-green-500" : "border-secondary/20 hover:border-green-500/50"
                  }`}
                >
                  <p className="text-muted-foreground text-sm mb-1">Approved</p>
                  <p className="text-2xl font-serif text-green-500">{stats.approvedShows}</p>
                </button>
                <button
                  onClick={() => handleFilterChange("rejected")}
                  className={`bg-card border p-4 text-left transition-all rounded-xl ${
                    filterStatus === "rejected" ? "border-red-500" : "border-secondary/20 hover:border-red-500/50"
                  }`}
                >
                  <p className="text-muted-foreground text-sm mb-1">Rejected</p>
                  <p className="text-2xl font-serif text-red-500">{stats.rejectedShows}</p>
                </button>
                <button
                  onClick={() => handleFilterChange("deleted")}
                  className={`bg-card border p-4 text-left transition-all rounded-xl ${
                    filterStatus === "deleted" ? "border-orange-500" : "border-secondary/20 hover:border-orange-500/50"
                  }`}
                >
                  <p className="text-muted-foreground text-sm mb-1">🗑️ Deleted</p>
                  <p className="text-2xl font-serif text-orange-500">{stats.deletedShows}</p>
                </button>
              </div>

              {/* Shows Table */}
              {loadingShows ? (
                <div className="text-muted-foreground text-center py-8">Loading productions...</div>
              ) : shows.length === 0 ? (
                <div className="bg-card/50 border border-secondary/20 p-12 text-center rounded-xl flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {filterStatus === "pending" 
                      ? "All caught up! No pending productions found."
                      : `No ${filterStatus === "all" ? "" : filterStatus} productions found.`}
                  </p>
                </div>
              ) : (
                <>
                <div className="bg-card border border-secondary/20 overflow-hidden overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[800px] caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Poster</th>
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
                        <tr key={show.id} className="border-t border-secondary/10 hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            {show.poster_url ? (
                              <img 
                                src={show.poster_url} 
                                alt={show.title} 
                                className="w-12 h-16 object-cover rounded border border-secondary/20"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-muted rounded border border-secondary/20 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-foreground font-medium">{show.title}</td>
                          <td className="p-4 text-muted-foreground">
                            {show.profiles?.group_name || "Unknown Group"}
                          </td>
                          <td className="p-4 text-muted-foreground">{getNicheLabel(show.niche)}</td>
                          <td className="p-4 text-muted-foreground">
                            {show.date ? new Date(show.date).toLocaleDateString() : "TBD"}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs border rounded-full ${getStatusColor(show.status)}`}>
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
                              
                              {/* Restore button for deleted shows */}
                              {filterStatus === "deleted" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestoreShow(show.id)}
                                  className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                  title="Restore Show"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              ) : (
                                <>
                                  {show.status === "pending" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setConfirmAction({ type: "approve", show })}
                                        className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                        title="Approve"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setConfirmAction({ type: "reject", show })}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                        title="Reject"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {show.status === "approved" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setConfirmAction({ type: "broadcast", show })}
                                      className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                      title="Broadcast to Audience"
                                    >
                                      <Megaphone className="w-4 h-4" />
                                    </Button>
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
                                  {/* Soft Delete button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSoftDeleteShow(show.id)}
                                    className="h-8 w-8 p-0 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                    title="Delete Show"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {Math.ceil(totalShowsCount / ITEMS_PER_PAGE) > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentShowsPage(p => Math.max(1, p - 1))}
                            className={currentShowsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {(() => {
                          const totalPages = Math.ceil(totalShowsCount / ITEMS_PER_PAGE);
                          const pages = [];

                          // Always show first page
                          pages.push(1);

                          // Calculate range around current page
                          const start = Math.max(2, currentShowsPage - 1);
                          const end = Math.min(totalPages - 1, currentShowsPage + 1);

                          if (start > 2) {
                            pages.push('ellipsis-start');
                          }

                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          if (end < totalPages - 1) {
                            pages.push('ellipsis-end');
                          }

                          // Always show last page if > 1
                          if (totalPages > 1) {
                            pages.push(totalPages);
                          }

                          return pages.map((page, i) => {
                            if (typeof page === 'string') {
                              return (
                                <PaginationItem key={`ellipsis-${i}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }

                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  isActive={page === currentShowsPage}
                                  onClick={() => setCurrentShowsPage(page as number)}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          });
                        })()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentShowsPage(p => Math.min(Math.ceil(totalShowsCount / ITEMS_PER_PAGE), p + 1))}
                            className={currentShowsPage === Math.ceil(totalShowsCount / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Producer Requests */}
              {producerRequests.length > 0 && (
                <div className="bg-card border border-yellow-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-yellow-500" />
                    Pending Producer Requests ({producerRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {producerRequests.map((request) => (
                      <div key={request.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-secondary/20">
                        <div className="flex-1 space-y-2">
                          <p className="text-foreground font-medium">{request.group_name}</p>

                          {/* Portfolio Link / Image */}
                          <div className="mb-2">
                             {request.portfolio_link.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <a href={request.portfolio_link} target="_blank" rel="noopener noreferrer">
                                   <img
                                     src={request.portfolio_link}
                                     alt="Portfolio"
                                     className="h-32 object-contain rounded border border-secondary/30 bg-black/20"
                                   />
                                </a>
                             ) : (
                                <a
                                  href={request.portfolio_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-secondary hover:underline flex items-center gap-1"
                                >
                                  View Portfolio <ExternalLink className="w-3 h-3" />
                                </a>
                             )}
                          </div>

                          {/* Verification Images from Profile */}
                          {(request.profiles?.avatar_url || request.profiles?.map_screenshot_url) && (
                            <div className="p-3 bg-background/50 rounded-lg border border-secondary/10">
                               <p className="text-xs text-muted-foreground mb-2 font-medium">Verification Images (Profile):</p>
                               <div className="flex gap-3">
                                  {request.profiles?.avatar_url && (
                                     <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground">Avatar</p>
                                        <a href={request.profiles.avatar_url} target="_blank" rel="noopener noreferrer">
                                          <img src={request.profiles.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-secondary/20" />
                                        </a>
                                     </div>
                                  )}
                                  {request.profiles?.map_screenshot_url && (
                                     <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground">Map/Location</p>
                                        {request.profiles.map_screenshot_url.startsWith('<iframe') ? (
                                           <div className="text-xs text-muted-foreground italic">Embedded Map</div>
                                        ) : (
                                            <a href={request.profiles.map_screenshot_url} target="_blank" rel="noopener noreferrer">
                                              <img src={request.profiles.map_screenshot_url} alt="Map" className="h-16 w-auto rounded object-cover border border-secondary/20" />
                                            </a>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request)}
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Table */}
              {loadingUsers ? (
                <div className="text-muted-foreground text-center py-8">Loading users...</div>
              ) : (
                <>
                  <div className="bg-card border border-secondary/20 overflow-hidden overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[600px] caption-bottom text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">User ID</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Email</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Group Name</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Role</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Joined</th>
                        <th className="text-left p-4 text-muted-foreground text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userProfile) => (
                        <tr key={userProfile.user_id} className="border-t border-secondary/10 hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-muted-foreground text-sm font-mono">
                            {userProfile.user_id.slice(0, 8)}...
                          </td>
                          <td className="p-4 text-foreground text-sm">
                            {userProfile.email || "—"}
                          </td>
                          <td className="p-4 text-foreground">
                            {userProfile.group_name || "—"}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs border rounded-full capitalize ${getRoleColor(userProfile.role)}`}>
                              {userProfile.role}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {userProfile.role !== "admin" && (
                              <div className="flex items-center gap-2">
                                {userProfile.role === "audience" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePromoteUser(userProfile.user_id, userProfile.group_name || "New Producer")}
                                    className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                    title="Promote to Producer"
                                  >
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Promote
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDemoteUser(userProfile.user_id)}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    title="Demote to Audience"
                                  >
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Demote
                                  </Button>
                                )}
                                {/* Force Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(userProfile);
                                    setDeleteUserModal(true);
                                  }}
                                  className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            {userProfile.role === "admin" && (
                              <span className="text-xs text-muted-foreground">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {Math.ceil(totalUserCount / ITEMS_PER_PAGE) > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {(() => {
                          const totalPages = Math.ceil(totalUserCount / ITEMS_PER_PAGE);
                          const pages = [];

                          // Always show first page
                          pages.push(1);

                          // Calculate range around current page
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);

                          if (start > 2) {
                            pages.push('ellipsis-start');
                          }

                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          if (end < totalPages - 1) {
                            pages.push('ellipsis-end');
                          }

                          // Always show last page if > 1
                          if (totalPages > 1) {
                            pages.push(totalPages);
                          }

                          return pages.map((page, i) => {
                            if (typeof page === 'string') {
                              return (
                                <PaginationItem key={`ellipsis-${i}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }

                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  isActive={page === currentPage}
                                  onClick={() => setCurrentPage(page as number)}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          });
                        })()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalUserCount / ITEMS_PER_PAGE), p + 1))}
                            className={currentPage === Math.ceil(totalUserCount / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Details Modal with Poster Image */}
      <Dialog open={detailsModal} onOpenChange={setDetailsModal}>
        <DialogContent className="bg-card border-secondary/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{selectedShow?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedShow?.profiles?.group_name || "Unknown Group"}
            </DialogDescription>
          </DialogHeader>
          {selectedShow && (
            <div className="space-y-4 mt-4">
              {/* Poster Image */}
              {selectedShow.poster_url ? (
                <div className="relative w-full aspect-[3/4] max-h-64 overflow-hidden rounded-lg border border-secondary/20">
                  <img 
                    src={selectedShow.poster_url} 
                    alt={selectedShow.title} 
                    className="w-full h-full object-contain bg-muted"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-muted rounded-lg border border-secondary/20 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No poster uploaded</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(selectedShow.status)}`}>
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
                      setDetailsModal(false);
                      setConfirmAction({ type: "approve", show: selectedShow });
                    }}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailsModal(false);
                      setConfirmAction({ type: "reject", show: selectedShow });
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-card border-secondary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              {confirmAction?.type === "approve"
                ? "Approve Show"
                : confirmAction?.type === "reject"
                  ? "Reject Show"
                  : "Broadcast Show"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "approve" 
                ? `Are you sure you want to approve "${confirmAction?.show.title}"? It will become visible on the public feed.`
                : confirmAction?.type === "reject"
                  ? `Are you sure you want to reject "${confirmAction?.show.title}"? The producer will be notified.`
                  : `Are you sure you want to broadcast "${confirmAction?.show.title}" to all audience members? This will send an email notification.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  if (confirmAction.type === "approve") {
                    handleApprove(confirmAction.show.id, confirmAction.show.title, confirmAction.show.producer_id);
                  } else if (confirmAction.type === "reject") {
                    handleReject(confirmAction.show.id, confirmAction.show.title, confirmAction.show.producer_id);
                  } else if (confirmAction.type === "broadcast") {
                    handleBroadcast(confirmAction.show.id);
                  }
                  setConfirmAction(null);
                }
              }}
              className={confirmAction?.type === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
              disabled={broadcastLoading}
            >
              {broadcastLoading
                ? "Sending..."
                : confirmAction?.type === "approve"
                  ? "Approve"
                  : confirmAction?.type === "reject"
                    ? "Reject"
                    : "Broadcast"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Modal */}
      <Dialog open={deleteUserModal} onOpenChange={setDeleteUserModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please enter the StageLink Admin Security Key to confirm this action.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">User to delete:</p>
                <p className="text-foreground font-medium">{userToDelete.group_name || "No group name"}</p>
                <p className="text-xs text-muted-foreground font-mono">{userToDelete.user_id}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  StageLink Admin Security Key
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter StageLink Admin Security Key"
                    value={adminSecurityKey}
                    onChange={(e) => setAdminSecurityKey(e.target.value)}
                    className="bg-background border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteUserModal(false);
                    setUserToDelete(null);
                    setAdminSecurityKey("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleForceDeleteUser}
                  disabled={!adminSecurityKey}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;