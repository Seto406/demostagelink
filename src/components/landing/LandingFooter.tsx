import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import stagelinkLogo from "@/assets/stagelink-logo-new.png";

const LandingFooter = () => {
  return (
    <footer className="bg-landing-text text-white py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={stagelinkLogo} alt="StageLink" className="h-8 w-auto brightness-0 invert" />
              <span className="font-serif font-bold text-xl">StageLink</span>
            </div>
            <p className="text-white/60 mb-6 leading-relaxed">
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
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-3">
              <li><Link to="/shows" className="text-white/60 hover:text-white transition-colors">Browse Shows</Link></li>
              <li><Link to="/directory" className="text-white/60 hover:text-white transition-colors">Theater Directory</Link></li>
              <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Theater Groups</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-white/60 hover:text-white transition-colors">Producer Login</Link></li>
              <li><Link to="/login" className="text-white/60 hover:text-white transition-colors">Submit a Show</Link></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white/60 hover:text-white transition-colors">About Us</Link></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} StageLink. All rights reserved.
          </p>
          <p className="text-white/40 text-sm">
            Made with ❤️ for the Metro Manila theater community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
