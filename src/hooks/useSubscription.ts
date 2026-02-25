import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const startTrial = async () => {
    if (!user) return;
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("start-trial");

      if (error) {
        console.error("Start Trial Error:", error);
        throw error;
      }

      if (data?.message === "Subscription already active") {
         toast({
            title: "Already Active",
            description: "You already have an active subscription.",
         });
         return;
      }

      toast({
        title: "Trial Started!",
        description: "You now have 30 days of Pro access.",
      });

      await refetch();

    } catch (error) {
      console.error("Trial start error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Failed to Start Trial",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Calculate days left
  let daysLeft = 0;
  if (subscription?.current_period_end) {
      const end = new Date(subscription.current_period_end);
      const now = new Date();
      if (end > now) {
          const diffTime = Math.abs(end.getTime() - now.getTime());
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
  }

  return {
    subscription,
    isLoading,
    isPro,
    startTrial,
    isCheckingOut,
    daysLeft,
  };
};
