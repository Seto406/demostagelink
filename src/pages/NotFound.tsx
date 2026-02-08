import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <h1 className="text-8xl font-serif font-bold text-primary">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
