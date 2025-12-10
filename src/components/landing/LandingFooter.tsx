import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import stagelinkLogo from "@/assets/stagelink-logo-mask.png";

const LandingFooter = () => {
  return (
    <footer className="bg-card border-t border-secondary/20 py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={stagelinkLogo} alt="StageLink" className="h-8 w-auto" />
              <span className="text-xl font-serif font-bold text-foreground tracking-wide">
                Stage<span className="text-secondary">Link</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Connecting theater groups with audiences across Metro Manila. Discover the magic of local productions.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Mail, href: "mailto:hello@stagelink.app" }
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-secondary/20 transition-colors border border-secondary/20"
                >
                  <Icon className="w-5 h-5 text-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Explore</h4>
            <ul className="space-y-3">
              <li><Link to="/shows" className="text-muted-foreground hover:text-foreground transition-colors">Browse Shows</Link></li>
              <li><Link to="/directory" className="text-muted-foreground hover:text-foreground transition-colors">Theater Directory</Link></li>
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">For Theater Groups</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Producer Login</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Submit a Show</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-secondary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} StageLink. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">
            Made with ❤️ for the Metro Manila theater community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
