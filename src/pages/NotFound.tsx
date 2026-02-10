import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Ghost } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 relative z-10">
      <div className="glass max-w-md w-full rounded-2xl p-8 text-center space-y-8 animate-in fade-in zoom-in duration-700 border-primary/20 shadow-2xl">

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Ghost className="w-12 h-12 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-6xl font-serif font-bold text-primary drop-shadow-md">404</h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground">
            The Stage Is Dark
          </h2>
          <p className="text-muted-foreground text-lg">
            We couldn't find the scene you're looking for. It might have been cut from the script.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild size="lg" className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-12 px-8 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <Link to="/">
              <Home className="h-5 w-5" />
              Return to Lobby
            </Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground/50 font-mono">
          Route: {location.pathname}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
