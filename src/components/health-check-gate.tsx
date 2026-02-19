import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceMode } from '@/components/ui/maintenance-mode';
import { ReactNode } from 'react';

export const HealthCheckGate = ({ children }: { children: ReactNode }) => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_service_health');
      if (error) throw error;
      return data;
    },
    retry: 3,
    retryDelay: 2000, // Retry every 2 seconds
    staleTime: 60 * 1000, // Check every minute
    refetchOnWindowFocus: true,
  });

  // If we are loading for the first time, show the "Updating" state
  if (isLoading) {
    return <MaintenanceMode />;
  }

  // If we have an error, log it but let the app load (Fail Open)
  if (error) {
    console.error("Health check failed:", error);
    return <>{children}</>;
  }

  // If data is null or undefined (RPC failed silently?), proceed anyway
  if (!data) {
     console.warn("Health check returned no data, proceeding.");
     return <>{children}</>;
  }

  // If all good, render children
  return <>{children}</>;
};
