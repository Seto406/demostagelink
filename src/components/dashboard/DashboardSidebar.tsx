import { Link } from "react-router-dom";
import { LayoutDashboard, Film, User, Users, LogOut, X, BarChart, LucideIcon } from "lucide-react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DashboardTab = "dashboard" | "shows" | "profile" | "members" | "analytics";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: DashboardTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  sidebarOpen: boolean;
  id?: string;
  variant?: "default" | "destructive";
}

const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  sidebarOpen,
  id,
  variant = "default",
}: SidebarItemProps) => {
  const baseClasses = "w-full flex items-center gap-3 px-4 py-3 transition-colors";
  const activeClasses = "bg-sidebar-accent text-sidebar-accent-foreground";
  const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent/10";
  const destructiveClasses = "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive";

  let className = baseClasses;
  if (variant === "destructive") {
    className = `${baseClasses} ${destructiveClasses}`;
  } else {
    className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  }

  const button = (
    <button
      id={id}
      onClick={onClick}
      aria-label={label}
      className={className}
    >
      <Icon className="w-5 h-5" />
      {sidebarOpen && <span>{label}</span>}
    </button>
  );

  if (sidebarOpen) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}: DashboardSidebarProps) => {
  return (
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
              <span className="text-lg font-serif font-bold text-sidebar-foreground">
                Stage<span className="text-sidebar-accent">Link</span>
              </span>
            )}
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            sidebarOpen={sidebarOpen}
          />

          <SidebarItem
            icon={BarChart}
            label="Analytics"
            isActive={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            sidebarOpen={sidebarOpen}
          />

          <SidebarItem
            icon={Film}
            label="My Productions"
            isActive={activeTab === "shows"}
            onClick={() => setActiveTab("shows")}
            sidebarOpen={sidebarOpen}
          />

          <SidebarItem
            id="profile-tab"
            icon={User}
            label="Profile"
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            sidebarOpen={sidebarOpen}
          />

          <SidebarItem
            icon={Users}
            label="Members"
            isActive={activeTab === "members"}
            onClick={() => setActiveTab("members")}
            sidebarOpen={sidebarOpen}
          />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <SidebarItem
            icon={LogOut}
            label="Logout"
            onClick={handleLogout}
            sidebarOpen={sidebarOpen}
            variant="destructive"
          />
        </div>
      </div>
    </aside>
  );
};
