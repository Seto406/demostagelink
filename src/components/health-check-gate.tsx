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

  // If we have an error, show the "Connection Issue" state
  if (error) {
    return <MaintenanceMode error={error} retry={() => refetch()} />;
  }

  // If data is null or undefined (RPC failed silently?)
  if (!data) {
     return <MaintenanceMode error={new Error("No response from server")} retry={() => refetch()} />;
  }

  // If all good, render children
  return <>{children}</>;
};
