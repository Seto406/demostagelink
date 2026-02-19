import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type ManagedGroup = {
  id: string;
  group_name: string | null;
  avatar_url: string | null;
};

type MembershipApplication = {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
  status: string;
};

type ApplicantProfile = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [managedGroups, setManagedGroups] = useState<ManagedGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [applicantsByUserId, setApplicantsByUserId] = useState<Record<string, ApplicantProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

      const ownedOrManagedGroupIds = new Set<string>();

      if (profile.role === "producer") {
        ownedOrManagedGroupIds.add(profile.id);
      }

      const { data: managedMemberships, error: membershipsError } = await supabase
        .from("group_members")
        .select("group_id, role_in_group")
        .eq("user_id", profile.id)
        .or("role_in_group.ilike.%producer%,role_in_group.ilike.%owner%,role_in_group.ilike.%admin%,role_in_group.ilike.%director%");

      if (membershipsError) {
        console.error("Error fetching managed memberships:", membershipsError);
      }

      for (const membership of managedMemberships || []) {
        if (membership.group_id) {
          ownedOrManagedGroupIds.add(membership.group_id);
        }
      }

      if (ownedOrManagedGroupIds.size === 0) {
        setManagedGroups([]);
        setSelectedGroupId(null);
        setIsLoading(false);
        return;
      }

      const { data: groups, error: groupsError } = await supabase
        .from("profiles")
        .select("id, group_name, avatar_url")
        .in("id", Array.from(ownedOrManagedGroupIds));

      if (groupsError) {
        console.error("Error fetching managed groups:", groupsError);
        toast.error("Failed to load your dashboards.");
        setManagedGroups([]);
        setSelectedGroupId(null);
        setIsLoading(false);
        return;
      }

      const hydratedGroups = (groups || []) as ManagedGroup[];
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
        setApplicantsByUserId({});
        return;
      }

      const { data: pendingApplications, error: applicationsError } = await supabase
        .from("membership_applications" as never)
        .select("id, user_id, group_id, created_at, status")
        .eq("group_id", selectedGroupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error loading membership applications:", applicationsError);
        toast.error("Failed to load pending approvals.");
        return;
      }

      const apps = (pendingApplications || []) as MembershipApplication[];
      setApplications(apps);

      const applicantUserIds = Array.from(new Set(apps.map((app) => app.user_id))).filter(Boolean);
      if (applicantUserIds.length === 0) {
        setApplicantsByUserId({});
        return;
      }

      const { data: applicantProfiles, error: applicantError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", applicantUserIds);

      if (applicantError) {
        console.error("Error loading applicant profiles:", applicantError);
        return;
      }

      const lookup = Object.fromEntries(((applicantProfiles || []) as ApplicantProfile[]).map((p) => [p.user_id, p]));
      setApplicantsByUserId(lookup);
    };

    fetchApplications();
  }, [selectedGroupId]);

  const handleDecision = async (applicationId: string, decision: "approved" | "declined") => {
    setIsUpdating(applicationId);
    const { error } = await supabase
      .from("membership_applications" as never)
      .update({ status: decision } as never)
      .eq("id", applicationId);

    if (error) {
      console.error(`Error marking application as ${decision}:`, error);
      toast.error(`Unable to ${decision === "approved" ? "approve" : "decline"} application.`);
      setIsUpdating(null);
      return;
    }

    setApplications((prev) => prev.filter((application) => application.id !== applicationId));
    toast.success(decision === "approved" ? "Application approved." : "Application declined.");
    setIsUpdating(null);
  };

  if (loading || isLoading) {
    return <BrandedLoader size="lg" text="Loading management dashboard..." />;
  }

  if (!canManage) {
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

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 rounded-xl border border-secondary/20 bg-card/70 p-5 backdrop-blur-md">
        <h1 className="text-2xl font-serif font-bold text-foreground">My Dashboards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pending Approvals</p>

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

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="rounded-xl border border-secondary/20 bg-card/60 p-6 text-sm text-muted-foreground backdrop-blur-md">
            No pending applications for this group.
          </div>
        ) : (
          applications.map((application) => {
            const applicant = applicantsByUserId[application.user_id];
            const name = applicant?.username || "Applicant";
            const initial = name.charAt(0).toUpperCase();

            return (
              <div
                key={application.id}
                className="flex flex-col gap-4 rounded-xl border border-secondary/20 bg-card/70 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between"
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
                    onClick={() => handleDecision(application.id, "approved")}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    disabled={isUpdating === application.id}
                    onClick={() => handleDecision(application.id, "declined")}
                  >
                    <X className="mr-1 h-4 w-4" /> Decline
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
