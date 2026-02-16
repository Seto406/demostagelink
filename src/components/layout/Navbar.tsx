import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Shield, Menu, X, Settings, Heart, Bell, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { unreadCount } = useNotifications();

  // Dynamic nav links based on auth state
  // Nav links without Favorites - moved to user section
  const navLinks = user
    ? [
        { path: "/feed", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/favorites", label: "Favorites" },
        { path: "/about", label: "About" },
      ]
    : [
        { path: "/", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/about", label: "About" },
      ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out h-[72px] ${
          scrolled ? "bg-background/95 backdrop-blur-md border-b border-secondary/20 shadow-sm" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 h-full relative z-10">
          <div className="flex items-center justify-between h-full">
            {/* Logo - Routes to feed if logged in, landing if not */}
            <Link to={user ? "/feed" : "/"} className="flex items-center gap-2 sm:gap-3 group">
              <img
                src={stageLinkLogo}
                alt="StageLink Logo"
                className={`h-8 sm:h-10 w-auto origin-left transition-transform duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}
              />
              <span
                className={`text-lg sm:text-xl font-sans font-bold text-foreground tracking-tight origin-left transition-transform duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}
              >
                Stage<span className="text-secondary">Link</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm uppercase tracking-widest font-medium transition-colors duration-300 hover:text-secondary py-2 ${
                    location.pathname === link.path
                      ? "text-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-primary">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {profile?.role === "producer" && (
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/notifications">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative"
                          aria-label="Notifications"
                        >
                          <Bell className="w-4 h-4" />
                          {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Notifications</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/favorites">
                        <Button variant="ghost" size="sm" aria-label="Favorites">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Favorites</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8 border border-secondary/20">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
                          <AvatarFallback className="bg-secondary/10 text-secondary">
                            {profile?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile?.username || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-foreground touch-target"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Simplified Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-background">
          <div className="flex flex-col h-full pt-24 pb-8 px-6 overflow-y-auto">

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2 mb-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block py-4 px-6 text-lg font-sans font-medium text-center transition-all duration-300 touch-target rounded-xl ${
                    location.pathname === link.path
                      ? "text-secondary bg-secondary/10 border border-secondary/30"
                      : "text-foreground hover:bg-secondary/5 hover:text-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="h-px bg-border mb-6" />

            {/* Auth Section */}
            <div>
              {user ? (
                <div className="flex flex-col gap-3">
                  {isAdmin && (
                    <Link to="/admin" className="w-full">
                      <Button variant="ghost" className="w-full justify-center text-primary font-sans rounded-xl">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  {profile?.role === "producer" && (
                    <Link to="/dashboard" className="w-full">
                      <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" className="w-full">
                    <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Link to="/settings" className="w-full">
                    <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/favorites" className="w-full">
                    <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full font-sans rounded-xl" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="w-full block">
                  <Button variant="hero" className="w-full font-sans rounded-xl">
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
