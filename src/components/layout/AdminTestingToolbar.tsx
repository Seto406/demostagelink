import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const AdminTestingToolbar = () => {
  const {
    user,
    profile,
    isAdmin,
    adminViewRoleOverride,
    adminProModeOverride,
    setAdminViewRoleOverride,
    setAdminProModeOverride,
    clearAdminTestingOverrides,
  } = useAuth();

  if (!user || !profile || !isAdmin) return null;

  const isPreviewActive = adminViewRoleOverride !== null || adminProModeOverride !== null;

  return (
    <div className="fixed bottom-4 left-4 z-[70] max-w-[calc(100vw-2rem)] rounded-xl border border-secondary/40 bg-background/95 p-3 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Test Mode</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={adminViewRoleOverride === "audience" ? "default" : "outline"}
          onClick={() => setAdminViewRoleOverride(adminViewRoleOverride === "audience" ? null : "audience")}
        >
          Audience View
        </Button>
        <Button
          size="sm"
          variant={adminViewRoleOverride === "producer" ? "default" : "outline"}
          onClick={() => setAdminViewRoleOverride(adminViewRoleOverride === "producer" ? null : "producer")}
        >
          Producer View
        </Button>
        <Button
          size="sm"
          variant={adminProModeOverride === true ? "default" : "outline"}
          onClick={() => setAdminProModeOverride(adminProModeOverride === true ? false : true)}
        >
          {adminProModeOverride === false ? "Switch to Pro" : "Switch to Non‑Pro"}
        </Button>
        {isPreviewActive && (
          <Button size="sm" variant="destructive" onClick={clearAdminTestingOverrides}>
            Exit Test View
          </Button>
        )}
      </div>
    </div>
  );
};
