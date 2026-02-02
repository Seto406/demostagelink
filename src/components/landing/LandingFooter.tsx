import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail } from "lucide-react";
import stagelinkLogo from "@/assets/stagelink-logo-mask.png";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/stagelinkonfb/", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/stagelinkonig?igsh=MXQzbnZnZWJvM3V0NA==", label: "Instagram" },
  { icon: TikTokIcon, href: "https://www.tiktok.com/@stagelinkontiktok?_r=1&_t=ZS-91vyeb8pn8M", label: "TikTok" },
  { icon: XIcon, href: "https://x.com/stagelinkonx", label: "X" },
  { icon: Mail, href: "mailto:connect.stagelink@gmail.com", label: "Email" }
];

const LandingFooter = () => {
  return (
    <footer className="bg-card border-t border-secondary/20 py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={stagelinkLogo} alt="StageLink" className="h-8 w-auto rounded-full" />
              <span className="text-xl font-sans font-bold text-foreground tracking-tight">
                Stage<span className="text-secondary">Link</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Connecting theater groups with audiences across Metro Manila. Discover the magic of local productions.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  aria-label={label}
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
              <li><a href="mailto:connect.stagelink@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-secondary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} StageLink. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">
            Made with ❤️ by La Creneurs for the Metro Manila theater community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;