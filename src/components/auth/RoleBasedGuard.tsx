import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/ui/branded-loader";

interface RoleBasedGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const RoleBasedGuard = ({ children, allowedRoles = ['producer'] }: RoleBasedGuardProps) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};
