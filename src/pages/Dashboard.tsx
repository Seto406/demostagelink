import { ProductionModal } from "@/components/dashboard/ProductionModal";
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Handshake, Link as LinkIcon, User, Search, Settings, AlertTriangle } from "lucide-react";
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

type ManagedGroup = {
  id: string;
  user_id: string;
  group_name: string | null;
  avatar_url: string | null;
  group_logo_url: string | null;
  group_banner_url: string | null;
  description: string | null;
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
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  group_name?: string | null;
  role?: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [managedGroups, setManagedGroups] = useState<ManagedGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollaborationRequest[]>([]);
  const [unlinkedMembers, setUnlinkedMembers] = useState<UnlinkedMember[]>([]);
  const [applicantsByUserId, setApplicantsByUserId] = useState<Record<string, ApplicantProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showToEdit, setShowToEdit] = useState<any>(null);

  // New State
  const [shows, setShows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("approved");
  const analyticsRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);

  // Linking State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedUnlinkedMember, setSelectedUnlinkedMember] = useState<UnlinkedMember | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState<ApplicantProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const canManage = useMemo(() => managedGroups.length > 0, [managedGroups.length]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchManagedGroups = async () => {
      if (!profile) return;
      setIsLoading(true);

      const { data: groups, error: groupsError } = await supabase
        .from("profiles")
        .select("id, user_id, group_name, avatar_url, group_logo_url, group_banner_url, description")
        .eq("user_id", profile.user_id)
        .not("group_name", "is", null);

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
  }, [profile]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedGroupId) {
        setApplications([]);
        setCollabRequests([]);
        setUnlinkedMembers([]);
        setApplicantsByUserId({});
        setShows([]);
        return;
      }

      // Fetch Shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("*")
        .eq("producer_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (showsError) {
        console.error("Error fetching shows:", showsError);
      } else {
        setShows(showsData || []);
      }

      // Fetch Member Applications
      const { data: pendingApplications, error: applicationsError } = await supabase
        .from("group_members" as never)
        .select("id, user_id, group_id, created_at, status, role_in_group" as never)
        .eq("group_id", selectedGroupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error loading membership applications:", applicationsError);
        toast.error("Failed to load pending approvals.");
        return;
      }

      // Fetch Collab Requests
      const { data: collabData, error: collabError } = await supabase
        .from("collaboration_requests" as any)
        .select("*")
        .eq("receiver_id", selectedGroupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (collabError) {
        console.error("Error loading collab requests:", collabError);
      }

      // Fetch Unlinked Members (Manual Entries)
      const { data: unlinkedData, error: unlinkedError } = await supabase
        .from("group_members" as any)
        .select("id, status, role_in_group")
        .eq("group_id", selectedGroupId)
        .is("user_id", null);

      if (unlinkedError) {
        console.error("Error loading unlinked members:", unlinkedError);
      }

      const apps = ((pendingApplications || []) as MembershipApplication[]).filter((app) => Boolean(app.user_id));
      setApplications(apps);

      const collabs = (collabData || []) as CollaborationRequest[];
      setCollabRequests(collabs);

      setUnlinkedMembers((unlinkedData || []) as UnlinkedMember[]);

      // Collect IDs from both sources
      const appUserIds = apps.map((app) => app.user_id).filter(Boolean);
      const collabUserIds = collabs.map((r) => r.sender_id).filter(Boolean);
      const allUserIds = Array.from(new Set([...appUserIds, ...collabUserIds]));

      if (allUserIds.length === 0) {
        setApplicantsByUserId({});
        return;
      }

      const { data: applicantProfiles, error: applicantError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, group_name, role")
        .in("user_id", allUserIds);

      if (applicantError) {
        console.error("Error loading applicant profiles:", applicantError);
        return;
      }

      const lookup = Object.fromEntries(((applicantProfiles || []) as ApplicantProfile[]).map((p) => [p.user_id, p]));
      setApplicantsByUserId(lookup);
    };

    fetchApplications();
  }, [selectedGroupId]);

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
      .from("group_members" as never)
      .update({ status: "active" } as never)
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

    const { data: userStatsRow, error: userStatsError } = await supabase
      .from("user_stats" as never)
      .select("xp" as never)
      .eq("user_id", application.user_id as never)
      .maybeSingle();

    if (userStatsError) {
      console.error("Error fetching user stats:", userStatsError);
      toast.error("Member approved, but XP update failed.");
      setIsUpdating(null);
      return;
    }

    const currentXp = Number((userStatsRow as { xp?: number } | null)?.xp || 0);
    const nextXp = currentXp + 50;
    const nextLevel = Math.floor(nextXp / 100) + 1;

    const { error: upsertStatsError } = await supabase
      .from("user_stats" as never)
      .upsert({ user_id: application.user_id, xp: nextXp, level: nextLevel } as never, { onConflict: "user_id" as never });

    if (upsertStatsError) {
      console.error("Error upserting user stats:", upsertStatsError);
      toast.error("Member approved, but XP update failed.");
      setIsUpdating(null);
      return;
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
    toast.success("Member approved and XP awarded.");
    setIsUpdating(null);
  };

  const handleDecline = async (applicationId: string) => {
    setIsUpdating(applicationId);
    const { error } = await supabase
      .from("group_members" as never)
      .update({ status: "declined" } as never)
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
    const { error: insertError } = await supabase
        .from("group_members" as any)
        .insert({
            user_id: request.sender_id,
            group_id: selectedGroupId,
            role_in_group: 'producer',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    if (insertError) {
        console.error("Error inserting group member:", insertError);
        toast.error("Failed to add producer to group members.");
        setIsUpdating(null);
        return;
    }

    // 2. Update request status
    const { error: updateError } = await supabase
        .from("collaboration_requests" as any)
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
      .from("collaboration_requests" as any)
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
      .from("group_members" as any)
      .update({ user_id: foundUser.user_id } as any)
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
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_tour: false })
      .eq("id", profile.id);

    if (!error) {
      toast.success("Tour restarted! Refreshing page...");
      window.location.reload();
    } else {
      toast.error("Failed to restart tour.");
    }
  };

  const handlePostShow = () => {
    setShowToEdit(null);
    setShowProductionModal(true);
  };

  if (loading || isLoading) {
    return <BrandedLoader size="lg" text="Loading management dashboard..." />;
  }

  // Ensure Role is Producer
  if (profile?.role !== 'producer' && !canManage) {
    return (
      <div className="container mx-auto px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-secondary/20 bg-card/70 p-8 text-center backdrop-blur-md">
          <h1 className="mb-2 text-2xl font-serif font-bold text-foreground">Management Hub</h1>
          <p className="text-muted-foreground">
            You don&apos;t have a producer dashboard yet. Create or manage a theater group to unlock this portal.
          </p>
        </div>
      </div>
    );
  }

  const selectedGroup = managedGroups.find((group) => group.id === selectedGroupId);
  const approvedShows = shows.filter(s => s.status === 'approved');
  const pendingShows = shows.filter(s => s.status === 'pending');
  const rejectedShows = shows.filter(s => s.status === 'rejected');

  const handleEditShow = (show: any) => {
    setShowToEdit(show);
    setShowProductionModal(true);
  };

  return (
    <div className="container mx-auto px-6 pb-8 pt-6 min-h-[calc(100vh-72px)]">
      <div className="mb-6 rounded-xl border border-secondary/20 bg-card/70 p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">My Dashboards</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your productions and team</p>
          </div>

          {selectedGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Edit Group Profile
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {managedGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                selectedGroupId === group.id
                  ? "border border-secondary/40 bg-secondary/15 text-secondary"
                  : "border border-secondary/20 bg-background/40 text-foreground hover:bg-secondary/10"
              }`}
            >
              {group.group_name || "Unnamed Group"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
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
      </div>

      <div className="mb-8" ref={analyticsRef}>
         {selectedGroupId && <AnalyticsDashboard profileId={selectedGroupId} isPro={true} />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
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
              <ShowList items={approvedShows} emptyText="No active shows found. Post a new production to get started!" onEdit={handleEditShow} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
              <ShowList items={pendingShows} emptyText="No pending shows." onEdit={handleEditShow} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
              <ShowList items={rejectedShows} emptyText="No rejected or draft shows." onEdit={handleEditShow} />
          </TabsContent>
      </Tabs>

      {/* Collaboration Requests Section */}
      {collabRequests.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md">
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

      <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/60 backdrop-blur-md mb-8" ref={membersRef}>
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
            const name = applicant?.username || "Unknown User" || "Applicant";
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

      {/* Link User Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link User to Member</DialogTitle>
            <DialogDescription>
              Search for a user by username to link them to <strong>{"this member"}</strong>.
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
        />
      )}
      <EditProducerProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        producer={selectedGroup}
        theaterGroup={null}
        onSuccess={() => {
           toast.success("Profile updated.");
        }}
      />
    </div>
  );
};

const ShowList = ({ items, emptyText, onEdit }: { items: any[], emptyText: string, onEdit: (show: any) => void }) => (
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
                     <Button variant="outline" size="sm" onClick={() => onEdit(show)}>
                         Edit
                     </Button>
                </div>
            ))
        )}
    </div>
);

export default Dashboard;
