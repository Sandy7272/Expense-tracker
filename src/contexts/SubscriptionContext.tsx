import { createContext, useContext, ReactNode } from "react";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

interface SubscriptionContextType {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  setPremium: (v: boolean) => void;
  startTrial: (isTrial: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isTrialActive: false,
  trialDaysLeft: null,
  setPremium: () => {},
  startTrial: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const store = useSubscriptionStore();

  return (
    <SubscriptionContext.Provider value={store}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
