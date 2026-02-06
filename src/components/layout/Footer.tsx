import { Link } from "react-router-dom";
import stageLinkLogo from "@/assets/stagelink-logo-mask.png";
import { AdBanner } from "@/components/ads/AdBanner";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-secondary/10 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Mobile: 2-column grid for links, Desktop: 4-column */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={stageLinkLogo} 
                alt="StageLink Logo" 
                className="h-8 w-auto rounded-full"
              />
              <span className="text-xl font-serif font-bold text-foreground">
                Stage<span className="text-secondary">Link</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Connecting audiences with the vibrant world of local theater across Metro Manila.
            </p>
          </div>

          {/* Links - Side by side on mobile */}
          <div>
            <h4 className="font-serif text-foreground font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Explore</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/directory" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  Theater Directory
                </Link>
              </li>
              <li>
                <Link to="/shows" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  All Shows
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60 text-sm cursor-default">
                  Mobile App (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* For Groups */}
          <div>
            <h4 className="font-serif text-foreground font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Groups</h4>
            <ul className="space-y-1.5 sm:space-y-2">
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

        <div className="mt-8 sm:mt-12">
          <AdBanner format="horizontal" variant="placeholder" />
        </div>

        <div className="border-t border-secondary/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-muted-foreground text-xs text-center sm:text-left">
              © 2026 StageLink. Supporting Local Theater in Metro Manila.
            </p>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-muted-foreground hover:text-secondary transition-colors text-xs">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-secondary transition-colors text-xs">
                Terms of Service
              </Link>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">Made with ❤️ for Filipino Theater</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
