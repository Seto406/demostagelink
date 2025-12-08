import { Link } from "react-router-dom";
import stageLinkLogo from "@/assets/stagelink-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-secondary/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={stageLinkLogo} 
                alt="StageLink Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-serif font-bold text-foreground">
                Stage<span className="text-secondary">Link</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Connecting audiences with the vibrant world of local theater across Metro Manila. 
              Discover, support, and celebrate Filipino theatrical arts.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-foreground font-semibold mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/directory" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  Theater Directory
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Groups */}
          <div>
            <h4 className="font-serif text-foreground font-semibold mb-4">For Theater Groups</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  Submit Your Group
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  Producer Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © 2024 StageLink. Supporting Local Theater in Metro Manila.
          </p>
          <div className="flex gap-6">
            <span className="text-muted-foreground text-xs">Made with ❤️ for Filipino Theater</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
