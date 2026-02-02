import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { SplitLanding } from "@/components/landing/SplitLanding";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      if (profile) {
        if (profile.role === "producer" || profile.role === "admin") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/feed", { replace: true });
        }
      } else {
        navigate("/feed", { replace: true });
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <SplitLanding />
      </main>
    </div>
  );
};

export default Login;
