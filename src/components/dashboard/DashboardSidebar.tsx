import { Link } from "react-router-dom";
import { LayoutDashboard, Film, User, Users, LogOut, X, Lock } from "lucide-react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

export type DashboardTab = "dashboard" | "shows" | "profile" | "members";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: DashboardTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  isPro?: boolean;
  onUpsell?: () => void;
}

export const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  isPro = false,
  onUpsell,
}: DashboardSidebarProps) => {
  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={stageLinkLogo} alt="StageLink" className="h-10 w-auto shrink-0" />
            {sidebarOpen && (
              <span className="text-lg font-serif font-bold text-sidebar-foreground">
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
            onClick={() => setActiveTab("dashboard")}
            aria-label="Dashboard"
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
            aria-label="My Productions"
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
              activeTab === "shows"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/10"
            }`}
          >
            <Film className="w-5 h-5" />
            {sidebarOpen && <span>My Productions</span>}
          </button>

          <button
            id="profile-tab"
            onClick={() => setActiveTab("profile")}
            aria-label="Profile"
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
              activeTab === "profile"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/10"
            }`}
          >
            <User className="w-5 h-5" />
            {sidebarOpen && <span>Profile</span>}
          </button>

          <button
            onClick={() => {
              if (!isPro) {
                onUpsell?.();
                return;
              }
              setActiveTab("members");
            }}
            aria-label="Members"
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
              activeTab === "members"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/10"
            }`}
          >
            <Users className="w-5 h-5" />
            {sidebarOpen && (
              <>
                <span>Members</span>
                {!isPro && <Lock className="w-4 h-4 ml-auto" />}
              </>
            )}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
