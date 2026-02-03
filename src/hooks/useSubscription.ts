import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
          amount: 39900, // 399.00 PHP in centavos
          description: "StageLink Pro Subscription",
          redirect_url: window.location.origin + "/payment/success",
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Could not initiate payment. Please try again.",
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
