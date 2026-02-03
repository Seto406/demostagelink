import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused';
  plan_id: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const subscribe = async (priceId: string = "price_pro_monthly") => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Call Edge Function to create Checkout Session
    // const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    //   body: { priceId }
    // });

    console.log("Initiating subscription for:", priceId);

    // For now, show a toast explaining this is a demo/placeholder
    toast({
      title: "Coming Soon",
      description: "Payment integration is being set up. Please join the waitlist for now.",
    });

    // Simulating a "Waitlist" action via mailto as a fallback if they really want to proceed
    window.location.href = `mailto:connect.stagelink@gmail.com?subject=Subscribe to Pro Plan&body=I would like to subscribe to the Pro plan (User ID: ${user.id})`;
  };

  const manageSubscription = async () => {
    if (!user) return;

    // TODO: Call Edge Function to create Portal Session
    // const { data } = await supabase.functions.invoke('create-portal-session');
    // window.location.href = data.url;

    toast({
      title: "Manage Subscription",
      description: "Customer portal will be available soon.",
    });
  };

  return {
    subscription,
    isLoading,
    subscribe,
    manageSubscription,
    isPro: subscription?.status === 'active' || subscription?.status === 'trialing'
  };
};
