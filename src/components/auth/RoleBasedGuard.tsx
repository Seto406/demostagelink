import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/ui/branded-loader";

interface RoleBasedGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const RoleBasedGuard = ({ children, allowedRoles = ["producer"] }: RoleBasedGuardProps) => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    if (loading || !user || profile) return;

    let cancelled = false;
    setCheckingProfile(true);

    const checkProfile = async () => {
      try {
        await refreshProfile();
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    };

    const fallback = setTimeout(() => {
      if (!cancelled) {
        setCheckingProfile(false);
      }
    }, 2500);

    checkProfile();

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [loading, user, profile, refreshProfile]);

  if (loading || checkingProfile) {
    return <FullPageLoader />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};
