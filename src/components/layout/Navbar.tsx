import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Menu, X, Settings, Bookmark, User, Ticket, Home } from "lucide-react";
import { useState, useEffect } from "react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic nav links based on auth state
  // Nav links without Favorites - moved to user section
  const navLinks = user
    ? [
        { path: "/feed", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/about", label: "About" },
      ]
    : [
        { path: "/", label: "Home" },
        { path: "/shows", label: "Shows" },
        { path: "/directory", label: "Directory" },
        { path: "/about", label: "About" },
      ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const homePath = user ? "/feed" : "/";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-[72px] bg-background/95 backdrop-blur-md border-b ${
        profile?.role === "producer" ? "border-amber-500/50" : "border-secondary/20"
      }`}>
        <div className="container mx-auto px-4 sm:px-6 h-full relative z-10">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={homePath}>
                <Button variant="ghost" size="icon" aria-label="Home" className="rounded-full">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={homePath} className="flex items-center gap-2 sm:gap-3 group">
                <img
                  src={stageLinkLogo}
                  alt="StageLink Logo"
                  className="h-8 sm:h-10 w-auto"
                />
                <span className="text-lg sm:text-xl font-sans font-bold text-foreground tracking-tight">
                  Stage<span className="text-secondary">Link</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center">
              <button
                className="p-2 text-foreground touch-target"
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
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-[72px]">
            <div className="h-full overflow-y-auto p-6 flex flex-col">
                <nav className="flex flex-col gap-2 mb-8">
                  {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`block py-4 px-6 text-lg font-sans font-medium text-center rounded-xl transition-colors ${
                          location.pathname === link.path
                            ? "text-secondary bg-secondary/10 border border-secondary/30"
                            : "text-foreground hover:bg-secondary/5 hover:text-secondary"
                        }`}
                      >
                        {link.label}
                      </Link>
                  ))}
                </nav>

                <div className="h-px bg-secondary/20 w-full mb-6" />

                <div className="mt-auto mb-6">
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
                      {/* Mobile Ticket Link */}
                       <Link to="/profile" className="w-full">
                        <Button variant="ghost" className="w-full justify-center font-sans rounded-xl">
                          <Ticket className="w-4 h-4 mr-2" />
                          My Passes
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
                          <Bookmark className="w-4 h-4 mr-2" />
                          Favorites
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full font-sans rounded-xl" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/login" className="w-full block">
                      <Button variant="default" className="w-full font-sans rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90">
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
