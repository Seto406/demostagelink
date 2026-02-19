import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Menu, X, Settings, Bookmark, User, Ticket, Bell, Film, Users, House, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { unreadCount, newNotificationSignal } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBellShaking, setIsBellShaking] = useState(false);
  const [canAccessManagement, setCanAccessManagement] = useState(false);

  const centerNavLinks = user
    ? [
        { path: "/feed", label: "Home", icon: House, matchPath: "/feed" },
        ...(profile?.role === 'producer' ? [{ path: "/dashboard", label: "Management", icon: LayoutDashboard, matchPath: "/dashboard" }] : []),
        { path: "/shows", label: "Shows", icon: Film, matchPath: "/shows" },
        { path: "/directory", label: "Directory", icon: Users, matchPath: "/directory" },
        { path: "/favorites", label: "Favorites", icon: Bookmark, matchPath: "/favorites" },
      ]
    : [
        { path: "/shows", label: "Shows", icon: Film, matchPath: "/shows" },
        { path: "/directory", label: "Directory", icon: Users, matchPath: "/directory" },
      ];

  const mobileNavLinks = user
    ? [
        ...centerNavLinks.map(({ path, label }) => ({ path, label })),
        { path: "/about", label: "About" },
      ]
    : [
        { path: "/", label: "Home" },
        ...centerNavLinks.map(({ path, label }) => ({ path, label })),
        { path: "/about", label: "About" },
      ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (newNotificationSignal > 0) {
      setIsBellShaking(true);
      const timeout = setTimeout(() => setIsBellShaking(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [newNotificationSignal]);

  useEffect(() => {
    const checkManagementAccess = async () => {
      if (!user || !profile) {
        setCanAccessManagement(false);
        return;
      }

      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.user_id)
        .not("group_name", "is", null);

      if (error) {
        console.error("Error checking management access:", error);
        setCanAccessManagement(false);
        return;
      }

      setCanAccessManagement((count || 0) > 0);
    };

    checkManagementAccess();
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const homePath = user ? "/feed" : "/";
  const profileInitial = profile?.display_name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] border-b bg-background/70 backdrop-blur-md ${
          profile?.role === "producer" ? "border-amber-500/50" : "border-secondary/20"
        }`}
      >
        <div className="container mx-auto h-full px-4 sm:px-6">
          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center justify-self-start">
              <Link to={homePath} className="flex items-center gap-2 sm:gap-3 group">
                <img src={stageLinkLogo} alt="StageLink Logo" className="h-8 w-auto sm:h-10" />
                <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Stage<span className="text-secondary">Link</span>
                </span>
              </Link>
            </div>

            <div className="hidden items-center justify-center gap-x-8 md:flex">
              {centerNavLinks.map(({ path, label, icon: Icon, matchPath }) => {
                const isActive = location.pathname === matchPath;

                return (
                  <Link
                    key={label}
                    to={path}
                    className={`relative flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-secondary" : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    <span
                      className={`absolute inset-x-0 -bottom-[3px] h-[2px] rounded-full transition-opacity ${
                        isActive ? "bg-secondary opacity-100" : "bg-secondary/50 opacity-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-self-end gap-1 sm:gap-2">
              {user && (
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-full">
                    <Bell className={`h-5 w-5 ${isBellShaking ? "animate-shake" : ""}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {user && (
                <Link to="/profile">
                  <Avatar className="h-9 w-9 border border-secondary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Profile avatar" />
                    <AvatarFallback className="bg-muted text-foreground">{profileInitial}</AvatarFallback>
                  </Avatar>
                </Link>
              )}

              <button
                className="touch-target p-2 text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 pt-[72px] backdrop-blur-md">
          <div className="flex h-full flex-col overflow-y-auto p-6">
            <nav className="mb-8 flex flex-col gap-2">
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block rounded-xl px-6 py-4 text-center text-lg font-medium transition-colors ${
                    location.pathname === link.path || (link.path.includes("/directory") && location.pathname === "/directory")
                      ? "border border-secondary/30 bg-secondary/10 text-secondary"
                      : "text-foreground hover:bg-secondary/5 hover:text-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mb-6 w-full bg-secondary/20 h-px" />

            <div className="mb-6 mt-auto">
              {user ? (
                <div className="flex flex-col gap-3">
                  {isAdmin && (
                    <Link to="/admin" className="w-full">
                      <Button variant="ghost" className="w-full justify-center rounded-xl font-sans text-primary">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  {canAccessManagement && (
                    <div className="rounded-xl border border-secondary/20 bg-card/50 p-3 backdrop-blur-md">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Management</p>
                      <Link to="/dashboard" className="w-full">
                        <Button variant="ghost" className="w-full justify-center rounded-xl font-sans">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          My Dashboards
                        </Button>
                      </Link>
                    </div>
                  )}
                  <Link to="/profile" className="w-full">
                    <Button variant="ghost" className="w-full justify-center rounded-xl font-sans">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link to="/profile" className="w-full">
                    <Button variant="ghost" className="w-full justify-center rounded-xl font-sans">
                      <Ticket className="mr-2 h-4 w-4" />
                      My Passes
                    </Button>
                  </Link>
                  <Link to="/settings" className="w-full">
                    <Button variant="ghost" className="w-full justify-center rounded-xl font-sans">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/favorites" className="w-full">
                    <Button variant="ghost" className="w-full justify-center rounded-xl font-sans">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Favorites
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full rounded-xl font-sans" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="block w-full">
                  <Button
                    variant="default"
                    className="w-full rounded-xl bg-secondary font-sans text-secondary-foreground hover:bg-secondary/90"
                  >
                    Enter the Stage
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
