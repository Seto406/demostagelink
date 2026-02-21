import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { AuthForm } from "@/components/auth/AuthForm";
import heroTheater from "@/assets/landing/hero-theater.jpg";
import logo from "@/assets/stagelink-logo.png";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      if (profile) {
        if (profile.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (profile.role === "producer") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/feed", { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BrandedLoader size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side (Image) - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative bg-black">
        <img
          src={heroTheater}
          alt="Theater Stage"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        {/* Dark Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

        {/* Logo Top-Left */}
        <div className="absolute top-8 left-8 z-10">
          <img src={logo} alt="StageLink" className="h-12 w-auto" />
        </div>

        {/* Value Proposition Bottom-Left */}
        <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 leading-tight">
            Join the stage. <br />
            Connect with the theater community.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Your all-in-one platform for discovering shows, managing productions, and building your audience.
          </p>
        </div>
      </div>

      {/* Right Side (Form) - Full width on mobile */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col relative bg-background">
        {/* Back to Home Link */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
