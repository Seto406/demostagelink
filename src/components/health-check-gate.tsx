import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Fail Open: We no longer block with "System Updating" (MaintenanceMode)

  // If loading or error, just proceed (Fail Open)
  if (isLoading || error || !data) {
    if (error) console.error("Health check failed:", error);
    return <>{children}</>;
  }

  // If all good, render children
  return <>{children}</>;
};
