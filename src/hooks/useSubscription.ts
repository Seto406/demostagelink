import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PRICE_CENTS } from "@/config/pricing";

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: subscription, isLoading } = useQuery({
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

  const initiateCheckout = async () => {
    if (!user) return;
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paymongo-session", {
        body: {
          amount: SUBSCRIPTION_PRICE_CENTS,
          description: "StageLink Pro Subscription",
          redirect_url: window.location.origin + "/payment/success",
        },
      });

      if (error) {
        console.error("Supabase Function Error:", error);
        throw error;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Missing checkoutUrl in response:", data);
        throw new Error("No checkout URL returned from payment provider");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Checkout Failed",
        description: `Could not initiate payment: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const isPro = subscription?.status === "active" && subscription?.tier === "pro";

  return {
    subscription,
    isLoading,
    isPro,
    initiateCheckout,
    isCheckingOut,
  };
};
