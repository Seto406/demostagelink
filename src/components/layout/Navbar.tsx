import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";

const Navbar = () => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/shows", label: "Shows" },
    { path: "/directory", label: "Directory" },
    { path: "/about", label: "About" },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-secondary/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={stageLinkLogo} 
              alt="StageLink Logo" 
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-serif font-bold text-foreground tracking-wide">
              Stage<span className="text-secondary">Link</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm uppercase tracking-widest font-medium transition-colors duration-300 hover:text-secondary ${
                  location.pathname === link.path 
                    ? "text-secondary" 
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
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
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
