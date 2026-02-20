import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: string;
  status: "active" | "cancelled" | "expired" | "trial";
  amount: number;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  created_at: string;
}

export function useSubscriptionStatus() {
  const { user } = useAuth();

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
      return data as SubscriptionRecord | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });

  const isPremiumFromDB = subscription?.status === "active" && 
    subscription?.current_period_end && 
    new Date(subscription.current_period_end) > new Date();

  const isTrialFromDB = subscription?.status === "trial" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date();

  const trialDaysLeft = isTrialFromDB && subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    subscription,
    isPremiumFromDB: isPremiumFromDB || isTrialFromDB,
    isTrialFromDB,
    trialDaysLeft,
    isLoading,
    refetch,
  };
}
