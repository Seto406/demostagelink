import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Navigate, Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Check, X, Handshake, Link as LinkIcon, User, Search, Settings, AlertTriangle, MapPin, Calendar, ExternalLink, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditProducerProfileDialog } from "@/components/producer/EditProducerProfileDialog";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { UpsellModal } from "@/components/dashboard/UpsellModal";

type ManagedGroup = {
  id: string;
  user_id: string;
  group_name: string | null;
  avatar_url: string | null;
  group_logo_url: string | null;
  group_banner_url: string | null;
  description: string | null;
  founded_year: number | null;
  address: string | null;
};

type MembershipApplication = {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
  status: string;
  role_in_group?: string | null;
};

type UnlinkedMember = {
  id: string;
  role_in_group: string | null;
  status: string;
};

type CollaborationRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
};

type ApplicantProfile = {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  group_name?: string | null;
  role?: string;
};

type Follower = {
  id: string;
  follower_id: string;
  created_at: string;
  profile?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
};

type Show = Database["public"]["Tables"]["shows"]["Row"] & {
  admin_feedback?: string | null;
  rejection_reason?: string | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { isPro, isLoading: isSubscriptionLoading } = useSubscription();
  const [managedGroups, setManagedGroups] = useState<ManagedGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [activeMembers, setActiveMembers] = useState<MembershipApplication[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollaborationRequest[]>([]);
  const [unlinkedMembers, setUnlinkedMembers] = useState<UnlinkedMember[]>([]);
  const [applicantsByUserId, setApplicantsByUserId] = useState<Record<string, ApplicantProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showToEdit, setShowToEdit] = useState<Show | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // New State
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [activeTab, setActiveTab] = useState("approved");
  const analyticsRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);

  // Linking State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedUnlinkedMember, setSelectedUnlinkedMember] = useState<UnlinkedMember | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState<ApplicantProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Upsell State
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellContext, setUpsellContext] = useState<{ featureName?: string; description?: string }>({});

  const canManage = useMemo(() => managedGroups.length > 0, [managedGroups.length]);

  // Route Guard for Analytics
  useEffect(() => {
    if (location.pathname === '/dashboard/analytics' && !loading && !isSubscriptionLoading && !isPro) {
      toast.error("Advanced analytics are a Premium feature.");
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, isPro, loading, isSubscriptionLoading, navigate]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    let aborted = false;

    const fetchManagedGroups = async () => {
      if (!profile) return;
      if (managedGroups.length === 0) setIsLoading(true);

      const { data: groups, error: groupsError } = await supabase
        .from("profiles")
        .select("id, user_id, group_name, avatar_url, group_logo_url, group_banner_url, description, founded_year, address")
        .eq("user_id", profile.user_id)
        .not("group_name", "is", null);

      if (aborted) return;

      if (groupsError) {
        console.error("Error fetching managed groups:", groupsError);
        toast.error("Failed to load your dashboards.");
        setManagedGroups([]);
        setSelectedGroupId(null);
        setIsLoading(false);
        return;
      }

      const hydratedGroups = (groups || []) as ManagedGroup[];
      if (hydratedGroups.length === 0) {
        setManagedGroups([]);
        setSelectedGroupId(null);
        setIsLoading(false);
        return;
      }

      setManagedGroups(hydratedGroups);
      setSelectedGroupId((prev) => prev || hydratedGroups[0]?.id || null);
      setIsLoading(false);
    };

    fetchManagedGroups();

    return () => { aborted = true; };
    // Use profile.user_id to prevent re-runs on every profile object change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id, refreshKey]);

  useEffect(() => {
    let aborted = false;

    const fetchApplications = async () => {
      if (!selectedGroupId) {
        if (!aborted) {
          setApplications([]);
          setCollabRequests([]);
          setUnlinkedMembers([]);
          setApplicantsByUserId({});
          setShows([]);
        }
        return;
      }

      // Fetch Shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("*")
        .eq("producer_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (aborted) return;

      if (showsError) {
        console.error("Error fetching shows:", showsError);
        toast.error("Failed to load shows.");
      } else {
        setShows(showsData || []);
      }

      // Fetch Member Applications
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("id, user_id, group_id, created_at, status, role_in_group")
        .eq("group_id", selectedGroupId)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false });

      if (aborted) return;

      if (memberError) {
        console.error("Error loading group members:", memberError);
        toast.error("Failed to load members.");
        return;
      }

      const pendingApplications = memberData?.filter(m => m.status === 'pending') || [];
      const activeMembersData = memberData?.filter(m => m.status === 'active') || [];

      // Fetch Collab Requests
      const { data: collabData, error: collabError } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("receiver_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (aborted) return;

      if (collabError) {
        console.error("Error loading collab requests:", collabError);
        toast.error("Failed to load collaboration requests.");
      }

      // Fetch Unlinked Members (Manual Entries)
      const { data: unlinkedData, error: unlinkedError } = await supabase
        .from("group_members")
        .select("id, status, role_in_group")
        .eq("group_id", selectedGroupId)
        .is("user_id", null);

      if (aborted) return;

      if (unlinkedError) {
        console.error("Error loading unlinked members:", unlinkedError);
        toast.error("Failed to load unlinked members.");
      }

      // Fetch Followers
      let followsData = null;
      try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: followsError } = await supabase
            .from("follows" as any)
            .select("id, follower_id, created_at")
            .eq("following_id", selectedGroupId)
            .order("created_at", { ascending: false });

          if (aborted) return;

          if (followsError) {
            console.error("Error fetching followers:", followsError);
            toast.error("Failed to load followers.");
          } else {
            followsData = data;
          }
      } catch (e) {
          console.error("Unexpected error fetching followers:", e);
          toast.error("An unexpected error occurred loading followers.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const followerIds = followsData?.map((f: any) => f.follower_id) || [];

      let followersWithProfiles: Follower[] = [];
      if (followerIds.length > 0) {
          const { data: followerProfiles } = await supabase
            .from("profiles")
            .select("id, user_id, username, avatar_url")
            .in("user_id", followerIds);

          if (aborted) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          followersWithProfiles = (followsData || []).map((f: any) => ({
            id: f.id,
            follower_id: f.follower_id,
            created_at: f.created_at,
            profile: followerProfiles?.find((p) => p.user_id === f.follower_id)
          }));
      }
      setFollowers(followersWithProfiles);

      const apps = ((pendingApplications || []) as MembershipApplication[]).filter((app) => Boolean(app.user_id));
      setApplications(apps);

      const active = ((activeMembersData || []) as MembershipApplication[]).filter((m) => Boolean(m.user_id));
      setActiveMembers(active);

      const collabs = (collabData || []) as CollaborationRequest[];
      setCollabRequests(collabs);

      setUnlinkedMembers((unlinkedData || []) as UnlinkedMember[]);

      // Collect IDs from all sources
      const appUserIds = apps.map((app) => app.user_id).filter(Boolean);
      const activeUserIds = active.map((m) => m.user_id).filter(Boolean);
      const collabUserIds = collabs.map((r) => r.sender_id).filter(Boolean);
      const allUserIds = Array.from(new Set([...appUserIds, ...activeUserIds, ...collabUserIds]));

      if (allUserIds.length === 0) {
        setApplicantsByUserId({});
        return;
      }

      const { data: applicantProfiles, error: applicantError } = await supabase
        .from("profiles")
        .select("id, user_id, username, avatar_url, group_name, role")
        .in("user_id", allUserIds);

      if (aborted) return;

      if (applicantError) {
        console.error("Error loading applicant profiles:", applicantError);
        toast.error("Failed to load applicant profiles.");
        return;
      }

      const lookup = Object.fromEntries(((applicantProfiles || []) as ApplicantProfile[]).map((p) => [p.user_id, p]));
      setApplicantsByUserId(lookup);
    };

    fetchApplications();

    return () => { aborted = true; };
  }, [selectedGroupId, user, refreshKey]);

  const handleApproval = async (applicationId: string) => {
    if (!selectedGroupId) return;

    const application = applications.find((item) => item.id === applicationId);
    const selectedGroup = managedGroups.find((group) => group.id === selectedGroupId);

    if (!application?.user_id || !selectedGroup) {
      toast.error("Unable to approve this member right now.");
      return;
    }

    setIsUpdating(applicationId);

    const { error: statusError } = await supabase
      .from("group_members")
      .update({ status: "active" })
      .eq("id", applicationId)
      .eq("group_id", selectedGroupId);

    if (statusError) {
      console.error("Error updating member status:", statusError);
      toast.error("Unable to approve application.");
      setIsUpdating(null);
      return;
    }

    // Update profile if the member is a producer
    if (application.role_in_group === 'producer') {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: 'producer',
          group_name: selectedGroup.group_name
        })
        .eq("user_id", application.user_id);

      if (profileError) {
        console.error("Error updating producer profile:", profileError);
        toast.error("Member approved, but profile update failed.");
      }
    }


    const groupName = selectedGroup.group_name || "the group";
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: application.user_id,
        title: "Membership Approved",
        message: `You are now a member of ${groupName}!`,
        type: "membership",
        link: `/group/${selectedGroupId}`,
      });

    if (notificationError) {
      console.error("Error creating approval notification:", notificationError);
      toast.error("Member approved, but notification delivery failed.");
      setIsUpdating(null);
      return;
    }

    setApplications((prev) => prev.filter((item) => item.id !== applicationId));
    setActiveMembers((prev) => [...prev, { ...application, status: 'active' }]);
    toast.success("Member approved.");
    setIsUpdating(null);
  };

  const handleDecline = async (applicationId: string) => {
    setIsUpdating(applicationId);
    const { error } = await supabase
      .from("group_members")
      .update({ status: "declined" })
      .eq("id", applicationId);

    if (error) {
      console.error("Error declining member:", error);
      toast.error("Unable to decline application.");
      setIsUpdating(null);
      return;
    }

    setApplications((prev) => prev.filter((application) => application.id !== applicationId));
    toast.success("Application declined.");
    setIsUpdating(null);
  };

  const handleApproveCollab = async (requestId: string) => {
    if (!selectedGroupId) return;
    const request = collabRequests.find(r => r.id === requestId);
    if (!request) return;

    setIsUpdating(requestId);

    // 1. Insert into group_members
    const sender = applicantsByUserId[request.sender_id];
    const { error: insertError } = await supabase
        .from("group_members")
        .insert({
            user_id: request.sender_id,
            group_id: selectedGroupId,
            role_in_group: 'producer',
            status: 'active',
            member_name: sender?.username || "Collaborator"
        });

    if (insertError) {
        console.error("Error inserting group member:", insertError);
        toast.error("Failed to add producer to group members.");
        setIsUpdating(null);
        return;
    }

    // 2. Update request status
    const { error: updateError } = await supabase
        .from("collaboration_requests")
        .update({ status: 'accepted' })
        .eq('id', requestId);

    if (updateError) {
        console.error("Error updating request status:", updateError);
    }

    // Update profile for the new producer
    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            role: 'producer',
            group_name: managedGroups.find(g => g.id === selectedGroupId)?.group_name
        })
        .eq("user_id", request.sender_id);

    if (profileError) {
        console.error("Error updating producer profile:", profileError);
        toast.error("Collaborator approved, but profile update failed.");
    }

    // Notification
    await supabase.from("notifications").insert({
        user_id: request.sender_id,
        title: "Collab Request Accepted",
        message: `Your collaboration request to ${managedGroups.find(g => g.id === selectedGroupId)?.group_name} was accepted!`,
        type: "collab",
        link: `/group/${selectedGroupId}`
    });

    setCollabRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success("Collaborator approved!");
    setIsUpdating(null);
  };

  const handleDeclineCollab = async (requestId: string) => {
    setIsUpdating(requestId);
    const { error } = await supabase
      .from("collaboration_requests")
      .update({ status: 'rejected' })
      .eq("id", requestId);

    if (error) {
      console.error("Error rejecting collab:", error);
      toast.error("Unable to reject request.");
      setIsUpdating(null);
      return;
    }

    setCollabRequests(prev => prev.filter((r) => r.id !== requestId));
    toast.success("Request rejected.");
    setIsUpdating(null);
  };

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setIsSearching(true);
    setFoundUser(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .eq("username", searchUsername.trim())
      .maybeSingle();

    if (error) {
      console.error("Error searching user:", error);
      toast.error("Search failed.");
    } else if (data) {
      setFoundUser(data as ApplicantProfile);
    } else {
      toast.info("User not found.");
    }
    setIsSearching(false);
  };

  const handleLinkUser = async () => {
    if (!selectedUnlinkedMember || !foundUser) return;

    setIsUpdating(selectedUnlinkedMember.id);
    const { error } = await supabase
      .from("group_members")
      .update({ user_id: foundUser.user_id })
      .eq("id", selectedUnlinkedMember.id);

    if (error) {
      console.error("Error linking user:", error);
      toast.error("Failed to link user.");
    } else {
      toast.success(`Linked ${foundUser.username} to ${"this member"}`);
      setUnlinkedMembers(prev => prev.filter(m => m.id !== selectedUnlinkedMember.id));
      setLinkDialogOpen(false);
      setFoundUser(null);
      setSearchUsername("");
    }
    setIsUpdating(null);
  };

  // Quick Action Handlers
  const handleAnalyze = () => {
    analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleManageEnsemble = () => {
    membersRef.current?.scrollIntoView({ behavior: "smooth" });
    toast.info("Manage your team members and approvals here.");
  };

  const handleRestartTour = async () => {
    if (!profile) return;

    // Clear the local storage key so the tour shows up again
    localStorage.removeItem("stagelink_has_seen_tour");

    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_tour: false })
      .eq("id", profile.id);

    if (!error) {
      toast.success("Tour restarted! Redirecting to feed...");
      navigate("/feed");
    } else {
      toast.error("Failed to restart tour.");
    }
  };

  const handlePostShow = () => {
    setShowToEdit(null);
    setShowProductionModal(true);
  };

  const handleGuestList = (showId: string) => {
    if (!isPro) {
        setUpsellContext({ featureName: "Guest List", description: "Accessing guest lists requires a Premium subscription." });
        setUpsellOpen(true);
        return;
    }
    navigate(`/dashboard/guests/${showId}`);
  };

  // Hard Lock: Immediate redirect for non-producers to prevent flicker
  if (!loading && profile && profile.role !== 'producer') {
    return <Navigate to="/feed" replace />;
  }

  if (loading || isLoading) {
    return <BrandedLoader size="lg" text="Loading management dashboard..." />;
  }

  // Analytics View
  if (location.pathname === '/dashboard/analytics' && isPro && selectedGroupId) {
    return (
        <div className="container mx-auto px-6 pb-8 pt-6 min-h-[calc(100vh-72px)]">
             <div className="mb-6 flex items-center justify-between">
                 <h1 className="text-3xl font-serif font-bold">Analytics Dashboard</h1>
                 <Button variant="outline" onClick={() => navigate('/dashboard')}>
                     Back to Overview
                 </Button>
             </div>
             <AnalyticsDashboard profileId={selectedGroupId} isPro={true} />
        </div>
    );
  }

  const selectedGroup = managedGroups.find((group) => group.id === selectedGroupId);
  const approvedShows = shows.filter(s => s.status === 'approved');
  const pendingShows = shows.filter(s => s.status === 'pending');
  const rejectedShows = shows.filter(s => s.status === 'rejected');

  const handleEditShow = (show: Show) => {
    setShowToEdit(show);
    setShowProductionModal(true);
  };

  return (
    <div className="container mx-auto px-6 pb-8 pt-6 min-h-[calc(100vh-72px)]">

      {/* Zone 1: Brand Summary (Header) */}
      <div className="mb-8 grid gap-6 md:grid-cols-1">
        <Card className="relative overflow-hidden border-secondary/20 bg-card/70 backdrop-blur-md">
            {selectedGroup?.group_banner_url && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={selectedGroup.group_banner_url}
                        alt="Banner Background"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
                </div>
            )}
            <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Logo */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-secondary/30 bg-muted flex-shrink-0 bg-background/50 backdrop-blur-sm">
                    {selectedGroup?.group_logo_url ? (
                        <img src={selectedGroup.group_logo_url} alt={selectedGroup.group_name || "Group Logo"} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Logo</div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-serif font-bold text-foreground">{selectedGroup?.group_name || "Unnamed Group"}</h1>
                        {selectedGroup && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditProfileOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Settings className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        {selectedGroup?.founded_year ? (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Est. {selectedGroup.founded_year}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 opacity-50">
                                <Calendar className="w-4 h-4" />
                                <span>Year not set</span>
                            </div>
                        )}

                        {selectedGroup?.address ? (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{selectedGroup.address}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 opacity-50">
                                <MapPin className="w-4 h-4" />
                                <span>Location not set</span>
                            </div>
                        )}

                        {(!selectedGroup?.founded_year || !selectedGroup?.address) && (
                            <Button
                                variant="link"
                                className="h-auto p-0 text-xs text-primary underline-offset-4"
                                onClick={() => setIsEditProfileOpen(true)}
                            >
                                Complete Profile
                            </Button>
                        )}
                    </div>

                    {/* Public Profile Link */}
                    <div className="pt-2 flex justify-center md:justify-start">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href={`/producer/${selectedGroup?.id}`} target="_blank" rel="noopener noreferrer">
                                View Public Profile <ExternalLink className="w-3 h-3" />
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Group Switcher (if multiple groups) */}
                {managedGroups.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-0 md:ml-auto self-start">
                        {managedGroups.map((group) => (
                            <button
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`rounded-full px-4 py-1.5 text-xs transition border ${
                                selectedGroupId === group.id
                                ? "border-secondary/40 bg-secondary/15 text-secondary"
                                : "border-secondary/20 bg-background/40 text-muted-foreground hover:bg-secondary/10"
                            }`}
                            >
                            {group.group_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
      </div>

      {/* Zone 2: Stats */}
      <div className="mb-8" ref={analyticsRef} data-tour="dashboard-analytics">
         {selectedGroupId && <AnalyticsDashboard profileId={selectedGroupId} isPro={isPro} onUpsell={() => {
             setUpsellContext({ featureName: "Analytics", description: "Detailed analytics are available on the Premium plan." });
             setUpsellOpen(true);
         }} />}
      </div>

      {/* Zone 3: Management */}
      <div className="space-y-8">
          {selectedGroupId && (
              <QuickActions
                  onPostShow={handlePostShow}
                  onManageEnsemble={handleManageEnsemble}
                  onAnalyze={handleAnalyze}
                  onRestartTour={handleRestartTour}
                  shows={shows}
                  profileId={selectedGroupId}
                  isTrialExpired={false} // Assuming false for now or fetch from subscription
                  pendingMemberCount={applications.length}
              />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} data-tour="dashboard-tabs">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/10 p-1 rounded-xl">
                  <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">
                      Approved Shows ({approvedShows.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">
                      Pending Review ({pendingShows.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground">
                      Rejected / Drafts ({rejectedShows.length})
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="approved" className="mt-4">
                  <ShowList
                    items={approvedShows}
                    emptyText="No active shows found. Post a new production to get started!"
                    onEdit={handleEditShow}
                    onGuestList={handleGuestList}
                  />
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                  <ShowList
                    items={pendingShows}
                    emptyText="No pending shows."
                    onEdit={handleEditShow}
                    onGuestList={handleGuestList}
                  />
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                  <ShowList
                    items={rejectedShows}
                    emptyText="No rejected or draft shows."
                    onEdit={handleEditShow}
                    onGuestList={handleGuestList}
                  />
              </TabsContent>
          </Tabs>

          {/* Collaboration Requests Section */}
          {collabRequests.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md">
               <div className="bg-secondary/10 px-6 py-3 border-b border-secondary/20">
                 <h2 className="font-serif font-bold text-lg flex items-center gap-2">
                   <Handshake className="w-5 h-5 text-secondary" />
                   Incoming Collaboration Requests
                 </h2>
               </div>
               {collabRequests.map((request, index) => {
                 const sender = applicantsByUserId[request.sender_id];
                 const name = sender?.group_name || sender?.username || "Producer";
                 const initial = name.charAt(0).toUpperCase();

                 return (
                   <div
                     key={request.id}
                     className={`flex min-h-[100px] flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                       index < collabRequests.length - 1 ? "border-b border-secondary/20" : ""
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <Avatar className="h-10 w-10 border border-secondary/30">
                         <AvatarImage src={sender?.avatar_url || undefined} alt={`${name} avatar`} />
                         <AvatarFallback>{initial}</AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-medium text-foreground">{name}</p>
                         <p className="text-xs text-muted-foreground">
                           Requested {format(new Date(request.created_at), "MMM d, yyyy")}
                         </p>
                         <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                            Producer
                         </span>
                       </div>
                     </div>

                     <div className="flex items-center gap-2">
                       <Button
                         size="sm"
                         className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                         disabled={isUpdating === request.id}
                         onClick={() => handleApproveCollab(request.id)}
                       >
                         <Check className="mr-1 h-4 w-4" /> Accept Collab
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         className="rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                         disabled={isUpdating === request.id}
                         onClick={() => handleDeclineCollab(request.id)}
                       >
                         <X className="mr-1 h-4 w-4" /> Reject
                       </Button>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md" ref={membersRef}>
            <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/20">
                 <h2 className="font-serif font-bold text-lg text-muted-foreground">
                   Member Applications
                 </h2>
            </div>
            {applications.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No pending member applications.
              </div>
            ) : (
              applications.map((application, index) => {
                const applicant = applicantsByUserId[application.user_id];
                const name = applicant?.username || "Unknown User";
                const initial = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={application.id}
                    className={`flex min-h-[120px] flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                      index < applications.length - 1 ? "border-b border-secondary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-secondary/30">
                        <AvatarImage src={applicant?.avatar_url || undefined} alt={`${name} avatar`} />
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {format(new Date(application.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                        disabled={isUpdating === application.id}
                        onClick={() => handleApproval(application.id)}
                      >
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={isUpdating === application.id}
                        onClick={() => handleDecline(application.id)}
                      >
                        <X className="mr-1 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Followers Section */}
          <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md">
            <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/20">
                 <h2 className="font-serif font-bold text-lg text-muted-foreground flex items-center gap-2">
                   <Users className="w-5 h-5" />
                   Followers ({followers.length})
                 </h2>
            </div>
            {followers.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No followers yet. Share your profile to get started!
              </div>
            ) : (
              followers.map((follower, index) => (
                  <div
                    key={follower.id}
                    className={`flex min-h-[80px] flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                      index < followers.length - 1 ? "border-b border-secondary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-secondary/30">
                        <AvatarImage src={follower.profile?.avatar_url || undefined} alt={follower.profile?.username || "Follower"} />
                        <AvatarFallback>{(follower.profile?.username?.[0] || "F").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{follower.profile?.username || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground">
                          Followed {format(new Date(follower.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {follower.profile?.id && (
                         <Button
                           size="sm"
                           variant="outline"
                           className="rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10"
                           asChild
                         >
                           <Link to={`/profile/${follower.profile.id}`}>
                             View Profile
                           </Link>
                         </Button>
                       )}
                    </div>
                  </div>
              ))
            )}
          </div>

          {/* Active Members Section */}
          <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md">
            <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/20">
                 <h2 className="font-serif font-bold text-lg text-muted-foreground">
                   Active Members
                 </h2>
            </div>
            {activeMembers.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No active members yet.
              </div>
            ) : (
              activeMembers.map((member, index) => {
                const profile = applicantsByUserId[member.user_id];
                const name = profile?.username || member.role_in_group || "Member";
                const initial = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={member.id}
                    className={`flex min-h-[80px] flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                      index < activeMembers.length - 1 ? "border-b border-secondary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-secondary/30">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={`${name} avatar`} />
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role_in_group || "Member"}
                          {member.role_in_group === 'producer' && " (Producer)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {profile?.id && (
                         <Button
                           size="sm"
                           variant="outline"
                           className="rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10"
                           asChild
                         >
                           <Link to={`/profile/${profile.id}`}>
                             View Profile
                           </Link>
                         </Button>
                       )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Unlinked Members Section */}
          {unlinkedMembers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md">
               <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/20">
                 <h2 className="font-serif font-bold text-lg text-muted-foreground flex items-center gap-2">
                   <User className="w-5 h-5" />
                   Manual Entries (Unlinked)
                 </h2>
                 <p className="text-xs text-muted-foreground">These members were added manually and are not linked to a user account.</p>
               </div>
               {unlinkedMembers.map((member, index) => (
                   <div
                     key={member.id}
                     className={`flex min-h-[80px] flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                       index < unlinkedMembers.length - 1 ? "border-b border-secondary/20" : ""
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                         {"Unknown Member".charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-medium text-foreground">{"Unknown Member"}</p>
                         <p className="text-xs text-muted-foreground capitalize">{member.role_in_group || "Member"}</p>
                       </div>
                     </div>

                     <Button
                       size="sm"
                       variant="outline"
                       className="rounded-xl border-secondary/30 text-secondary hover:bg-secondary/10"
                       onClick={() => {
                         setSelectedUnlinkedMember(member);
                         setLinkDialogOpen(true);
                         setFoundUser(null);
                         setSearchUsername("");
                       }}
                     >
                       <LinkIcon className="mr-1 h-4 w-4" /> Link User
                     </Button>
                   </div>
               ))}
            </div>
          )}
      </div>

      {/* Link User Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link User to Member</DialogTitle>
            <DialogDescription>
              Search for a user by username to link them to <strong>{"this member"}.</strong>
              This will merge their history with the user account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-2 items-end">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
              </div>
              <Button onClick={handleSearchUser} disabled={isSearching || !searchUsername}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {foundUser && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-secondary/10 border-secondary/20">
                <Avatar>
                  <AvatarImage src={foundUser.avatar_url || undefined} />
                  <AvatarFallback>{foundUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{foundUser.username}</p>
                  <p className="text-xs text-muted-foreground">User ID: {foundUser.user_id.slice(0, 8)}...</p>
                </div>
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!foundUser || isUpdating === selectedUnlinkedMember?.id}
              onClick={handleLinkUser}
            >
              {isUpdating === selectedUnlinkedMember?.id ? "Linking..." : "Confirm Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Producer Profile Dialog */}
      {showProductionModal && (
        <ProductionModal
          open={showProductionModal}
          onOpenChange={setShowProductionModal}
          showToEdit={showToEdit}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
      <EditProducerProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        producer={selectedGroup}
        theaterGroup={null}
        onSuccess={() => {
           setRefreshKey(prev => prev + 1);
           toast.success("Profile updated.");
        }}
      />
      <UpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        featureName={upsellContext.featureName}
        description={upsellContext.description}
      />
    </div>
  );
};

const ShowList = ({ items, emptyText, onEdit, onGuestList }: { items: Show[], emptyText: string, onEdit: (show: Show) => void, onGuestList: (showId: string) => void }) => (
    <div className="space-y-4">
        {items.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-secondary/30 rounded-xl">
                <p className="text-muted-foreground">{emptyText}</p>
            </div>
        ) : (
            items.map((show) => (
                <div key={show.id} className="bg-card border border-secondary/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                     <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                         {show.poster_url ? (
                             <img src={show.poster_url} alt={show.title} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-xs text-muted-foreground">No Poster</div>
                         )}
                     </div>
                     <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-lg">{show.title}</h3>
                             {show.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                             {show.status === 'pending' && <Badge variant="secondary">Pending Review</Badge>}
                         </div>
                         <p className="text-sm text-muted-foreground">{show.date || "Date TBA"} • {show.venue || "Venue TBA"}</p>

                         {show.status === 'rejected' && (
                             <div className="mt-2 bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex gap-2 items-start text-sm">
                                 <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                 <div className="text-destructive">
                                     <span className="font-semibold">Rejection Reason:</span>
                                     <p className="mt-1 text-xs opacity-90">
                                         {show.admin_feedback || show.rejection_reason || "Your show submission was rejected. Please ensure all details comply with our content guidelines. Contact support if you believe this is a mistake."}
                                     </p>
                                 </div>
                             </div>
                         )}
                     </div>
                     <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => onGuestList(show.id)}>
                                <Users className="w-4 h-4 mr-2" /> Guest List
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onEdit(show)}>
                                Edit
                            </Button>
                        </div>
                     </div>
                </div>
            ))
        )}
    </div>
);

export default Dashboard;
