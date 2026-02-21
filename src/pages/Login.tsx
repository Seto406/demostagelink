import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { AuthForm } from "@/components/auth/AuthForm";
import heroTheater from "@/assets/landing/hero-theater.jpg";
import logo from "@/assets/stagelink-logo-mask.png";
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
    <div className="min-h-screen h-screen w-full flex items-center justify-center overflow-hidden bg-background relative">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <img
          src={heroTheater}
          alt="Theater Stage"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Landing Page
        </Link>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="StageLink" className="h-20 w-auto drop-shadow-lg" />
        </div>

        {/* Auth Form */}
        <div className="w-full">
          <AuthForm hideLogo={true} />
        </div>
      </div>
    </div>
  );
};

export default Login;
